import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { PageFlip } from 'page-flip';
import * as pdfjsLib from 'pdfjs-dist';
import { X, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { apiRequest } from '@/lib/api';

const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
const openJpegWasmUrl = new URL('pdfjs-dist/wasm/openjpeg.wasm', import.meta.url).toString();
const wasmBaseUrl = openJpegWasmUrl.slice(0, openJpegWasmUrl.lastIndexOf('/') + 1);
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props { pdfUrl: string; }
type RenderQuality = 'preview' | 'high';
type IssueSearchResult = { kind: 'page'; page: number; text: string };
type RecordSearchResult = { kind: 'record'; id: string; title: string; text: string; holder?: string; category?: string };
type SearchResult = IssueSearchResult | RecordSearchResult;
const ALWAYS_HIGH_QUALITY_PAGES = 12;
const MIN_BOOK_SCALE = 0.5;
const MAX_BOOK_SCALE = 5;
const BOOK_SCALE_STEP = 0.25;

const getScaleTier = (scale: number) => Math.round(scale * 4) / 4;

const getRenderZoomFactor = (scale: number) => {
  if (scale <= 1) return 1;
  return Math.min(scale, MAX_BOOK_SCALE);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolvePdfSource = (pdfUrl: string) => {
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  const normalized = pdfUrl.startsWith('/') ? pdfUrl : `/${pdfUrl}`;
  return new URL(normalized, window.location.origin).toString();
};

const computeBookDimensions = (
  isMobile: boolean,
  pageRatio: number,
) => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (isMobile) {
    const width = Math.floor(Math.min(vw - 20, 300));
    const maxHeight = Math.floor(vh * 0.48);
    const height = Math.min(Math.round(width * pageRatio), maxHeight, 420);
    return { width, height: Math.max(height, 280) };
  }

  const spreadBudget = Math.min(vw * 0.82, 820);
  const width = Math.floor(Math.max(Math.min(spreadBudget / 2, 380), 260));
  const maxHeight = Math.floor(vh * 0.58);
  const height = Math.min(Math.round(width * pageRatio), maxHeight, 560);
  return { width, height: Math.max(height, 340) };
};

const FlipBook: React.FC<Props> = ({ pdfUrl }) => {
  const bookContainer = useRef<HTMLDivElement>(null);
  const pageFlip = useRef<PageFlip | null>(null);
  const pdfDoc = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const loadedPagesRef = useRef<Map<number, string>>(new Map());
  const pageQualityRef = useRef<Map<number, RenderQuality>>(new Map());
  const pageScaleTierRef = useRef<Map<number, number>>(new Map());
  const bookScaleRef = useRef(1);
  const renderJobs = useRef<Map<string, Promise<string | null>>>(new Map());
  const pendingQueueRef = useRef<number[]>([]);
  const activeWorkersRef = useRef(0);
  const queueTokenRef = useRef(0);

  const [totalLibPages, setTotalLibPages] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookSize, setBookSize] = useState({ width: 380, height: 520 });
  const [isMobile, setIsMobile] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMinimized, setIsSearchMinimized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchCompletedEmpty, setSearchCompletedEmpty] = useState(false);
  const [bookScale, setBookScale] = useState(1);

  const clampScale = (value: number) =>
    Math.min(MAX_BOOK_SCALE, Math.max(MIN_BOOK_SCALE, getScaleTier(value)));

  const zoomIn = () => setBookScale((prev) => clampScale(prev + BOOK_SCALE_STEP));
  const zoomOut = () => setBookScale((prev) => clampScale(prev - BOOK_SCALE_STEP));
  const resetZoom = () => setBookScale(1);

  useEffect(() => {
    bookScaleRef.current = bookScale;
  }, [bookScale]);

  const spreadWidth = isMobile ? bookSize.width : bookSize.width * 2;
  const scaledSpreadWidth = spreadWidth * bookScale;
  const scaledBookHeight = bookSize.height * bookScale;

  const categories = ["География", "Народонаселение", "Экономика", "Политика", "Право", "Туризм", "Образование", "Наука", "Здравоохранение", "Культура", "Архитектура", "Спорт"];

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const renderPage = useCallback(async (pageNum: number, quality: RenderQuality, scaleTier: number) => {
    if (!pdfDoc.current || pageNum <= 0 || pageNum > pdfDoc.current.numPages) return null;
    const renderAttempt = async (attempt: number): Promise<string | null> => {
      try {
      const page = await pdfDoc.current.getPage(pageNum);
      const zoomFactor = getRenderZoomFactor(scaleTier);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, zoomFactor >= 2 ? 2.5 : 2);
      const baseScale = quality === 'high'
        ? (isMobile ? 1.05 : 1.35)
        : (isMobile ? 0.85 : 1.05);
      let renderScale = baseScale * zoomFactor * pixelRatio;
      let viewport = page.getViewport({ scale: renderScale });
      const maxCanvasSide = 3600;
      const largestSide = Math.max(viewport.width, viewport.height);
      if (largestSide > maxCanvasSide) {
        renderScale *= maxCanvasSide / largestSide;
        viewport = page.getViewport({ scale: renderScale });
      }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      if (context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
          await page.render({
            canvasContext: context,
            viewport,
            intent: quality === 'high' && pageNum <= ALWAYS_HIGH_QUALITY_PAGES ? 'print' : 'display',
          }).promise;
        if (quality === 'high' || zoomFactor >= 1.5) {
          return canvas.toDataURL('image/png');
        }
        return canvas.toDataURL('image/jpeg', zoomFactor >= 1.25 ? 0.85 : 0.78);
      }
        return null;
      } catch (error: any) {
        const message = String(error?.message || '');
        const transient =
          message.includes("Dependent image isn't ready yet") ||
          message.includes('JpxError') ||
          message.includes('OpenJPEG failed to initialize');
        if (transient && attempt < 2) {
          await sleep(120 * (attempt + 1));
          return renderAttempt(attempt + 1);
        }
        console.error(error);
        return null;
      }
    };

    return renderAttempt(0);
  }, [isMobile]);

  const renderAndStorePage = useCallback(async (pageNum: number, quality: RenderQuality = 'preview', scaleTier = bookScaleRef.current) => {
    const normalizedTier = getScaleTier(scaleTier);
    const storedTier = pageScaleTierRef.current.get(pageNum);
    const currentQuality = pageQualityRef.current.get(pageNum);
    const alreadyGoodEnough =
      loadedPagesRef.current.has(pageNum) &&
      storedTier === normalizedTier &&
      (currentQuality === 'high' || (currentQuality === 'preview' && quality === 'preview'));
    if (alreadyGoodEnough) return;

    const key = `${pageNum}:${quality}:${normalizedTier}`;
    const existingJob = renderJobs.current.get(key);
    if (existingJob) {
      await existingJob;
      return;
    }

    const job = renderPage(pageNum, quality, normalizedTier);
    renderJobs.current.set(key, job);
    const img = await job;
    renderJobs.current.delete(key);

    if (!img) return;
    const latestTier = getScaleTier(bookScaleRef.current);
    if (latestTier !== normalizedTier) return;
    const latestQuality = pageQualityRef.current.get(pageNum);
    if (latestQuality === 'high' && quality === 'preview') return;
    loadedPagesRef.current.set(pageNum, img);
    pageQualityRef.current.set(pageNum, quality);
    pageScaleTierRef.current.set(pageNum, normalizedTier);
    setLoadedPages(new Map(loadedPagesRef.current));
  }, [renderPage]);

  const buildPriorityQueue = useCallback((activePage: number) => {
    const ordered = new Set<number>();
    const preloadRange = isMobile ? 4 : 7;
    const aheadRange = isMobile ? 6 : 12;

    const add = (num: number) => {
      if (num >= 1 && num <= totalLibPages) ordered.add(num);
    };

    // Highest priority: current visible spread
    add(activePage);
    add(activePage + 1);
    add(activePage - 1);

    // Near pages around current spread
    for (let i = 1; i <= preloadRange; i += 1) {
      add(activePage + i);
      add(activePage - i);
      add(activePage + 1 + i);
    }

    // Read-ahead pages to avoid "empty until page 11"
    for (let i = preloadRange + 1; i <= aheadRange; i += 1) {
      add(activePage + i);
    }

    return Array.from(ordered).filter((num) => !loadedPagesRef.current.has(num));
  }, [isMobile, totalLibPages]);

  const processQueue = useCallback(() => {
    const maxWorkers = isMobile ? 1 : 2;
    while (activeWorkersRef.current < maxWorkers && pendingQueueRef.current.length > 0) {
      const nextPage = pendingQueueRef.current.shift();
      if (!nextPage) return;
      activeWorkersRef.current += 1;
      const quality: RenderQuality = nextPage <= ALWAYS_HIGH_QUALITY_PAGES ? 'high' : 'preview';
      renderAndStorePage(nextPage, quality)
        .catch(() => undefined)
        .finally(() => {
          activeWorkersRef.current -= 1;
          processQueue();
        });
    }
  }, [isMobile, renderAndStorePage]);

  const renderFocusedWindowHighQuality = useCallback(async (activePage: number) => {
    const targets: number[] = [];
    for (let delta = -2; delta <= 2; delta += 1) {
      const page = activePage + delta;
      if (page >= 1 && page <= totalLibPages) {
        targets.push(page);
      }
    }
    await Promise.all(targets.map((num) => renderAndStorePage(num, 'high')));
  }, [renderAndStorePage, totalLibPages]);

  const schedulePriorityRender = useCallback((activePage: number) => {
    if (!pdfDoc.current) return;
    const token = ++queueTokenRef.current;
    pendingQueueRef.current = buildPriorityQueue(activePage);
    if (token !== queueTokenRef.current) return;
    processQueue();
    renderFocusedWindowHighQuality(activePage).catch(() => undefined);
  }, [buildPriorityQueue, processQueue, renderFocusedWindowHighQuality]);

  const performSearch = async (queryOverride?: string) => {
    const finalQuery = (queryOverride || searchQuery).trim().toLowerCase();
    if (finalQuery.length < 2 || !pdfDoc.current) return;
    
    setIsSearching(true);
    setIsSearchMinimized(false);
    setSearchResults([]);
    setSearchCompletedEmpty(false);
    
    try {
      const serverData = await apiRequest<{ results: { page: number; text: string }[] }>(
        `/api/issues/search?pdf_url=${encodeURIComponent(pdfUrl)}&q=${encodeURIComponent(finalQuery)}&limit=80`,
      );
      const serverResults: SearchResult[] = (serverData.results || []).map((item) => ({
        kind: 'page',
        page: item.page,
        text: item.text,
      }));

      if (serverResults.length > 0) {
        setSearchResults(serverResults);
        if (queryOverride) {
          handleJump(serverResults[0].page, false);
        }
        setIsSearching(false);
        return;
      }

      const records = await apiRequest<any[]>(
        `/api/records?limit=20&q=${encodeURIComponent(finalQuery)}`,
      );
      const recordResults: SearchResult[] = (records || []).map((record) => {
        const title = typeof record.title === 'object' ? (record.title.ru || record.title.en || record.title.kk || '') : String(record.title || '');
        const description = typeof record.description === 'object'
          ? (record.description.ru || record.description.en || record.description.kk || '')
          : String(record.description || '');
        return {
          kind: 'record',
          id: record.id,
          title,
          text: description,
          holder: record.holder,
          category: record.category,
        };
      });

      setSearchResults(recordResults);
      if (recordResults.length === 0) {
        setSearchCompletedEmpty(true);
      }
      setIsSearching(false);
      return;
    } catch (_serverError) {
      // Fallback for external PDFs or issues that have not been parsed yet.
    }

    const tempResults: IssueSearchResult[] = [];

    try {
      for (let i = 1; i <= pdfDoc.current.numPages; i++) {
        const page = await pdfDoc.current.getPage(i);
        const textContent = await page.getTextContent();
        const pageString = textContent.items.map((it: any) => it.str).join(" ").replace(/\s+/g, ' ');

        if (pageString.toLowerCase().includes(finalQuery)) {
          const matches = [...pageString.toLowerCase().matchAll(new RegExp(escapeRegExp(finalQuery), 'gi'))];
          matches.forEach(match => {
            const idx = match.index || 0;
            const contextText = pageString.substring(Math.max(0, idx - 45), idx + 85);
            tempResults.push({ kind: 'page', page: i, text: `...${contextText}...` });
          });
          
          if (i % 20 === 0) setSearchResults([...tempResults]);

          if (queryOverride && tempResults.length > 0) {
            handleJump(i, false); 
            setIsSearching(false);
            return;
          }
        }
        if (i % 60 === 0) await new Promise(r => setTimeout(r, 1));
        if (tempResults.length >= 80) break;
      }
      setSearchResults([...tempResults]);
      if (tempResults.length === 0) {
        setSearchCompletedEmpty(true);
      }
    } catch (err) { console.error(err); }
    setIsSearching(false);
  };

  const handleJump = async (pageNum: number, shouldClearSearch = true) => {
    if (!pageFlip.current) return;
    await renderAndStorePage(pageNum, 'high');
    await renderFocusedWindowHighQuality(pageNum);
    if (pageNum <= ALWAYS_HIGH_QUALITY_PAGES) {
      const firstRange = Array.from({ length: ALWAYS_HIGH_QUALITY_PAGES }, (_, i) => i + 1);
      await Promise.all(firstRange.map((num) => renderAndStorePage(num, 'high')));
    }
    pageFlip.current.flip(pageNum - 1);
    if (shouldClearSearch) setSearchResults([]);
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      setLoadError(null);
      setBookScale(1);
      setCurrentPage(0);
      setSearchResults([]);
      setLoadedPages(new Map());
      loadedPagesRef.current = new Map();
      pageQualityRef.current = new Map();
      pageScaleTierRef.current = new Map();
      bookScaleRef.current = 1;
      renderJobs.current.clear();
      pendingQueueRef.current = [];
      activeWorkersRef.current = 0;
      pageFlip.current?.destroy();
      pageFlip.current = null;
      pdfDoc.current = null;

      try {
        const pdfSource = resolvePdfSource(pdfUrl);
        const pdf = await pdfjsLib.getDocument({
          url: pdfSource,
          wasmUrl: wasmBaseUrl,
          useWasm: true,
          withCredentials: false,
        }).promise;
        if (!isMounted) return;
        pdfDoc.current = pdf;
        setTotalLibPages(pdf.numPages);

        const firstPage = await pdf.getPage(1);
        const baseViewport = firstPage.getViewport({ scale: 1 });
        const ratio = baseViewport.height / baseViewport.width;
        setBookSize(computeBookDimensions(isMobile, ratio));

        const firstPageToOpen = 1;
        await Promise.all([1, 2, 3, 4].map((num) => renderAndStorePage(num, 'high')));
        const firstRange = Array.from({ length: Math.min(ALWAYS_HIGH_QUALITY_PAGES, pdf.numPages) }, (_, i) => i + 1);
        pendingQueueRef.current = firstRange.filter((num) => !loadedPagesRef.current.has(num));
        processQueue();
        await renderFocusedWindowHighQuality(firstPageToOpen);
        schedulePriorityRender(firstPageToOpen);
        if (!isMounted) return;
        setIsLoading(false);
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setLoadError('Не удалось загрузить PDF выпуска. Проверьте файл в админ-панели.');
          setIsLoading(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [isMobile, pdfUrl, processQueue, renderAndStorePage, renderFocusedWindowHighQuality, schedulePriorityRender]);

  useEffect(() => {
    if (!isLoading && bookContainer.current && !pageFlip.current) {
      pageFlip.current = new PageFlip(bookContainer.current, {
        width: bookSize.width,
        height: bookSize.height,
        size: "stretch",
        showCover: true,
        drawShadow: !isMobile,
        usePortrait: isMobile,
        flippingTime: isMobile ? 350 : 450,
        useMouseEvents: true,
        swipeDistance: isMobile ? 20 : 30,
        maxShadowOpacity: isMobile ? 0.25 : 0.5,
      });
      pageFlip.current.loadFromHTML(document.querySelectorAll(".page-element"));
      pageFlip.current.on('flip', (e) => {
        setCurrentPage(e.data as number);
        schedulePriorityRender((e.data as number) + 1);
      });
    }
  }, [isLoading, bookSize.height, bookSize.width, isMobile, schedulePriorityRender]);

  useEffect(() => {
    if (isLoading || !pdfDoc.current) return;

    const tier = getScaleTier(bookScale);
    for (const pageNum of [...loadedPagesRef.current.keys()]) {
      if (pageScaleTierRef.current.get(pageNum) !== tier) {
        loadedPagesRef.current.delete(pageNum);
        pageQualityRef.current.delete(pageNum);
        pageScaleTierRef.current.delete(pageNum);
      }
    }
    setLoadedPages(new Map(loadedPagesRef.current));
    schedulePriorityRender(currentPage + 1);
    renderFocusedWindowHighQuality(currentPage + 1).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-render pages when zoom changes
  }, [bookScale, isLoading, schedulePriorityRender, renderFocusedWindowHighQuality]);

  // Мемоизируем список страниц, чтобы React не перерисовывал их без нужды
  const pagesMarkup = useMemo(() => {
    return Array.from({ length: totalLibPages }, (_, i) => i + 1).map((num) => (
      <div key={num} className="page-element" data-density={num === 1 ? "hard" : "soft"}>
        <div className={`absolute inset-y-0 w-20 z-10 pointer-events-none ${num % 2 === 0 ? 'right-0 bg-gradient-to-l from-black/[0.06]' : 'left-0 bg-gradient-to-r from-black/[0.06]'} to-transparent`} />
        {loadedPages.has(num) ? (
          <img src={loadedPages.get(num)} alt="" className="w-full h-full object-contain select-none" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-200 uppercase text-[9px] font-bold tracking-[0.3em]">Загрузка {num}</div>
        )}
      </div>
    ));
  }, [totalLibPages, loadedPages]);

  if (isLoading) return <div className="h-screen flex items-center justify-center font-serif bg-white text-slate-400">ПОДГОТОВКА СТРАНИЦ...</div>;

  if (loadError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white text-slate-600 px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="max-w-md">{loadError}</p>
        <a href={resolvePdfSource(pdfUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Открыть PDF напрямую
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-0 bg-[#f1f5f9] pb-4 md:pb-8" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <style>{`
        .interface-text, button, input, .res-item { font-family: "Times New Roman", Times, serif !important; }
        .page-element { background: white; }
        #flipbook { max-width: 100%; transform-origin: top center; }
      `}</style>

      {/* ПАНЕЛЬ */}
      <div className="z-[100] mt-3 md:mt-4 mb-2 md:mb-3 flex flex-col gap-2 md:gap-3 bg-white/95 p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-lg border border-white w-[96%] max-w-4xl backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar md:flex-wrap md:overflow-visible">
          {categories.map(cat => (
            <button key={cat} onClick={() => { setSearchQuery(cat); performSearch(cat); }}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] md:text-[10px] font-bold uppercase hover:bg-slate-900 hover:text-white transition-all border border-slate-200 whitespace-nowrap shrink-0">
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full">
          <div className="relative flex-1 w-full">
            <input className="w-full bg-slate-100/50 rounded-xl md:rounded-2xl px-4 md:px-5 py-2.5 md:py-3 text-sm outline-none border border-transparent focus:border-slate-300 transition-all"
              placeholder="Поиск по ключевым словам..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
            {isSearching && <Loader2 className="absolute right-3 top-3 animate-spin text-slate-400" size={18} />}
          </div>
          
          <div className="flex items-center justify-center gap-2 md:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-slate-200">
              <button
                onClick={zoomOut}
                disabled={bookScale <= MIN_BOOK_SCALE}
                className="p-1 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Уменьшить"
              >
                <ZoomOut size={isMobile ? 16 : 18} />
              </button>
              <input
                type="range"
                min={MIN_BOOK_SCALE * 100}
                max={MAX_BOOK_SCALE * 100}
                step={BOOK_SCALE_STEP * 100}
                value={Math.round(bookScale * 100)}
                onChange={(e) => setBookScale(clampScale(Number(e.target.value) / 100))}
                className="w-16 md:w-24 accent-slate-700 cursor-pointer"
                aria-label="Масштаб"
              />
              <span className="text-[10px] md:text-xs font-bold min-w-[44px] text-center tabular-nums">
                {Math.round(bookScale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={bookScale >= MAX_BOOK_SCALE}
                className="p-1 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Увеличить"
              >
                <ZoomIn size={isMobile ? 16 : 18} />
              </button>
              <button
                onClick={resetZoom}
                disabled={bookScale === 1}
                className="p-1 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed ml-0.5 border-l border-slate-200 pl-1.5"
                aria-label="Сбросить масштаб"
              >
                <RotateCcw size={isMobile ? 14 : 16} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-5 bg-slate-900 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl shadow-lg">
            <button onClick={() => pageFlip.current?.flipPrev()} className="hover:text-blue-400 p-1" aria-label="Предыдущая страница">
              <ChevronLeft size={isMobile ? 20 : 22} />
            </button>
            <div className="flex flex-col items-center min-w-[44px]">
              <span className="text-xs font-bold leading-none">{currentPage + 1}</span>
              <span className="text-[8px] md:text-[9px] opacity-40 uppercase tracking-tighter font-serif">из {totalLibPages}</span>
            </div>
            <button onClick={() => pageFlip.current?.flipNext()} className="hover:text-blue-400 p-1" aria-label="Следующая страница">
              <ChevronRight size={isMobile ? 20 : 22} />
            </button>
            </div>
          </div>
        </div>
      </div>

      {searchCompletedEmpty && !isSearching && searchQuery.trim().length >= 2 && (
        <div className="w-[96%] max-w-4xl mb-2 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs md:text-sm text-slate-500">
          По запросу «{searchQuery.trim()}» ничего не найдено в текущем выпуске.
        </div>
      )}

      {/* РЕЗУЛЬТАТЫ ПОИСКА */}
      {searchResults.length > 0 && (
        <div className={`fixed z-[110] bg-white shadow-2xl rounded-2xl border border-slate-200 transition-all duration-300 flex flex-col ${
          isSearchMinimized
            ? 'bottom-4 left-4 right-4 md:left-8 md:right-auto md:w-48 h-12 overflow-hidden'
            : isMobile
              ? 'bottom-4 left-3 right-3 max-h-[42vh]'
              : 'top-32 left-6 w-72 max-h-[50vh]'
        }`}>
          <div className="p-3 bg-slate-900 text-white flex justify-between items-center shrink-0 cursor-pointer" onClick={() => setIsSearchMinimized(!isSearchMinimized)}>
            <span className="text-[10px] font-bold uppercase tracking-widest">Найдено: {searchResults.length}</span>
            <div className="flex gap-2">
              {isSearchMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <X size={16} className="text-slate-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setSearchResults([]); }} />
            </div>
          </div>
          {!isSearchMinimized && (
            <div className="overflow-y-auto p-2 space-y-2 bg-white flex-1 scrollbar-thin">
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  onClick={() => res.kind === 'page' ? handleJump(res.page, false) : undefined}
                  className={`res-item p-3 hover:bg-slate-50 rounded-xl border-b border-slate-50 transition-colors ${res.kind === 'page' ? 'cursor-pointer' : ''}`}
                >
                  {res.kind === 'page' ? (
                    <>
                      <div className="text-[9px] font-black text-blue-600 mb-1 tracking-tighter">СТРАНИЦА {res.page}</div>
                      <div className="text-[11px] leading-snug text-slate-600 italic"
                        dangerouslySetInnerHTML={{ __html: res.text.replace(new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi'), '<mark class="bg-yellow-200 text-black px-0.5 rounded font-bold">$1</mark>') }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] font-black text-emerald-600 mb-1 tracking-tighter">КАРТОЧКА РЕКОРДА</div>
                      <div className="text-[12px] leading-snug text-slate-900 font-bold mb-1"
                        dangerouslySetInnerHTML={{ __html: res.title.replace(new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi'), '<mark class="bg-yellow-200 text-black px-0.5 rounded font-bold">$1</mark>') }}
                      />
                      {res.holder && <div className="text-[10px] font-semibold text-slate-500 mb-1">{res.holder}</div>}
                      <div className="text-[11px] leading-snug text-slate-600"
                        dangerouslySetInnerHTML={{ __html: res.text.replace(new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi'), '<mark class="bg-yellow-200 text-black px-0.5 rounded font-bold">$1</mark>') }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ВИЗУАЛ КНИГИ */}
      <div className="w-full flex justify-center items-start px-2 md:px-4 py-2 md:py-4 overflow-x-auto">
        <div
          className="relative"
          style={{
            width: scaledSpreadWidth,
            height: scaledBookHeight,
            minWidth: scaledSpreadWidth,
          }}
        >
          <div
            className="transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${bookScale})`,
              transformOrigin: 'top center',
              width: spreadWidth,
              height: bookSize.height,
              margin: '0 auto',
            }}
          >
            <div
              ref={bookContainer}
              id="flipbook"
              className="shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] md:shadow-[0_35px_70px_-20px_rgba(0,0,0,0.4)]"
              style={{ maxWidth: isMobile ? '100%' : `${bookSize.width * 2 + 24}px` }}
            >
              {pagesMarkup}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipBook;
