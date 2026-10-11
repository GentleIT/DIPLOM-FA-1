import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { useSearchParams } from 'react-router-dom';

const ALL_CATEGORIES = [
  { id: 'geography', ru: 'География', kk: 'География', en: 'Geography', color: '#EF4444' },
  { id: 'population', ru: 'Народонаселение', kk: 'Халық', en: 'Population', color: '#F97316' },
  { id: 'economy', ru: 'Экономика и бизнес', kk: 'Экономика және бизнес', en: 'Economy & Business', color: '#FACC15' },
  { id: 'politics', ru: 'Политика', kk: 'Саясат', en: 'Politics', color: '#22C55E' },
  { id: 'law', ru: 'Право', kk: 'Құқық', en: 'Law', color: '#0EA5E9' },
  { id: 'tourism', ru: 'Туризм', kk: 'Туризм', en: 'Tourism', color: '#A855F7' },
  { id: 'education', ru: 'Образование', kk: 'Білім', en: 'Education', color: '#7E22CE' },
  { id: 'science', ru: 'Наука', kk: 'Ғылым', en: 'Science', color: '#EC4899' },
  { id: 'healthcare', ru: 'Здравоохранение', kk: 'Денсаулық сақтау', en: 'Healthcare', color: '#BE123C' },
  { id: 'culture', ru: 'Культура и искусство', kk: 'Мәдениет и өнер', en: 'Culture & Art', color: '#F87171' },
  { id: 'architecture', ru: 'Архитектура и градостроительство', kk: 'Сәулет және қала құрылысы', en: 'Architecture', color: '#EAB308' },
  { id: 'sports', ru: 'Спорт', kk: 'Спорт', en: 'Sport', color: '#FB923C' }
];

const parseLocalizedField = (value: unknown, language: string): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[language] || parsed.ru || parsed.en || parsed.kk || '';
      }
    } catch (_error) {
      return value;
    }
    return value;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, string>;
    return record[language] || record.ru || record.en || record.kk || '';
  }
  return String(value);
};

const getRecordSearchText = (rec: any, language: string) => {
  const title = parseLocalizedField(rec.title, language);
  const description = parseLocalizedField(rec.description, language);
  const categoryInfo = ALL_CATEGORIES.find((c) => c.id === rec.category);
  const categoryLabel = categoryInfo
    ? (categoryInfo[language as keyof typeof categoryInfo] || categoryInfo.ru || '')
    : rec.category || '';

  return [title, description, rec.holder, rec.location, categoryLabel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const SAMPLE_RECORDS = [
  {
    id: 1,
    category: 'geography',
    title: {
      ru: 'Самый большой каньон Казахстана',
      kk: 'Қазақстанның ең үлкен шатқалы',
      en: 'The Largest Canyon in Kazakhstan'
    },
    description: {
      ru: 'Чарынский каньон признан самым впечатляющим природным образованием с уникальной флорой и фауной.',
      kk: 'Шарын шатқалы ерекше флора мен фаунасы бар ең әсерлі табиғи құрылым ретінде танылды.',
      en: 'Charyn Canyon is recognized as the most impressive natural formation with unique flora and fauna.'
    },
    holder: 'Государственный национальный парк «Чарын»',
    date: '2024-06-01',
    image: 'https://picsum.photos/id/1015/600/400'
  },
  {
    id: 2,
    category: 'population',
    title: {
      ru: 'Самая большая семья в Казахстане',
      kk: 'Қазақстандағы ең үлкен отбасы',
      en: 'Largest Family in Kazakhstan'
    },
    description: {
      ru: 'Семья из 22 детей установила рекорд по численности домохозяйства.',
      kk: '22 баладан тұратын отбасы шаруашылық саны бойынша рекорд орнатты.',
      en: 'A family of 22 children set the record for household size.'
    },
    holder: 'Семья Жанболатовых (Алматы)',
    date: '2023-12-15',
    image: 'https://picsum.photos/id/1005/600/400'
  },
  {
    id: 3,
    category: 'economy',
    title: {
      ru: 'Самый крупный экспортёр зерна',
      kk: 'Ең ірі астық экспорттаушы',
      en: 'Largest Grain Exporter'
    },
    description: {
      ru: 'Компания экспортировала рекордные 1,5 млн тонн пшеницы за один сезон.',
      kk: 'Компания бір маусымда рекордтық 1,5 млн тонна бидай экспорттады.',
      en: 'The company exported a record 1.5 million tons of wheat in one season.'
    },
    holder: 'ТОО «КазахЗерноЭкспорт»',
    date: '2025-02-20',
    image: 'https://picsum.photos/id/201/600/400'
  },
  {
    id: 4,
    category: 'politics',
    title: {
      ru: 'Самый молодой депутат Парламента',
      kk: 'Парламенттің ең жас депутаты',
      en: 'Youngest Member of Parliament'
    },
    description: {
      ru: 'В 28 лет избран в Мажилис, побив рекорд возраста.',
      kk: '28 жаста Мәжіліске сайланды, жас рекордты жаңартты.',
      en: 'Elected to the Mazhilis at 28 years old, breaking the age record.'
    },
    holder: 'Айдар Нурланов',
    date: '2024-09-10',
    image: 'https://picsum.photos/id/29/600/400'
  },
  {
    id: 5,
    category: 'law',
    title: {
      ru: 'Самый крупный выигранный судебный иск',
      kk: 'Ең ірі жеңілген сот ісі',
      en: 'Largest Won Court Case'
    },
    description: {
      ru: 'Иск на сумму 12 млрд тенге по защите прав потребителей успешно завершен.',
      kk: 'Тұтынушы құқықтарын қорғау бойынша 12 млрд теңгеге талап сәтті аяқталды.',
      en: 'A lawsuit for 12 billion tenge to protect consumer rights was successfully completed.'
    },
    holder: 'Юридическая фирма «Правозащита»',
    date: '2024-07-18',
    image: 'https://picsum.photos/id/133/600/400'
  },
  {
    id: 6,
    category: 'tourism',
    title: {
      ru: 'Самый посещаемый туристический объект',
      kk: 'Ең көп келетін туристік нысан',
      en: 'Most Visited Tourist Attraction'
    },
    description: {
      ru: 'Национальный парк «Бурабай» принял рекордные 2,5 млн туристов за год.',
      kk: '«Бурабай» ұлттық паркі жылына рекордтық 2,5 млн турист қабылдады.',
      en: 'Burabay National Park received a record 2.5 million tourists per year.'
    },
    holder: 'Национальный парк «Бурабай»',
    date: '2024-08-01',
    image: 'https://picsum.photos/id/1016/600/400'
  },
  {
    id: 7,
    category: 'education',
    title: {
      ru: 'Самый высокий балл на ЕНТ',
      kk: 'ЕНТ бойынша ең жоғары балл',
      en: 'Highest UNT Score'
    },
    description: {
      ru: 'Ученик набрал 140 баллов из 140 возможных, установив абсолютный рекорд.',
      kk: 'Оқушы 140 баллдың барлығын жинап, абсолютті рекорд орнатты.',
      en: 'A student scored the maximum 140 out of 140 points, setting an absolute record.'
    },
    holder: 'Айгерим Сатыбалдиева (Алматы)',
    date: '2024-06-15',
    image: 'https://picsum.photos/id/160/600/400'
  },
  {
    id: 8,
    category: 'science',
    title: {
      ru: 'Самое значимое научное открытие',
      kk: 'Ең маңызды ғылыми жаңалық',
      en: 'Most Significant Scientific Discovery'
    },
    description: {
      ru: 'Открытие нового вида полезных ископаемых в недрах Казахстана.',
      kk: 'Қазақстан жер қойнауында жаңа пайдалы қазбалар түрін ашу.',
      en: 'Discovery of a new type of mineral resources in the depths of Kazakhstan.'
    },
    holder: 'Академик Ерлан Касымов',
    date: '2023-10-20',
    image: 'https://picsum.photos/id/251/600/400'
  },
  {
    id: 9,
    category: 'healthcare',
    title: {
      ru: 'Самая успешная кампания вакцинации',
      kk: 'Ең табысты вакцинация науқаны',
      en: 'Most Successful Vaccination Campaign'
    },
    description: {
      ru: '95% населения вакцинировано в рекордно короткие сроки — 90 дней.',
      kk: 'Халықтың 95%-ы рекордтық қысқа мерзімде — 90 күнде вакцинацияланды.',
      en: '95% of the population was vaccinated in a record short time — 90 days.'
    },
    holder: 'Министерство здравоохранения Республики Казахстан',
    date: '2024-04-12',
    image: 'https://picsum.photos/id/180/600/400'
  },
  {
    id: 10,
    category: 'culture',
    title: {
      ru: 'Самый большой культурный фестиваль',
      kk: 'Ең үлкен мәдени фестиваль',
      en: 'Largest Cultural Festival'
    },
    description: {
      ru: 'Фестиваль «Наурыз» собрал рекордные 600 000 участников.',
      kk: '«Наурыз» фестивалі рекордтық 600 000 қатысушыны жинады.',
      en: 'The Nauryz Festival gathered a record 600,000 participants.'
    },
    holder: 'Организационный комитет фестиваля «Наурыз»',
    date: '2025-03-22',
    image: 'https://picsum.photos/id/1009/600/400'
  },
  {
    id: 11,
    category: 'architecture',
    title: {
      ru: 'Самое высокое здание в Казахстане',
      kk: 'Қазақстандағы ең биік ғимарат',
      en: 'Tallest Building in Kazakhstan'
    },
    description: {
      ru: 'Башня в Астане высотой 420 метров установила новый национальный рекорд.',
      kk: 'Астанадағы 420 метр биіктіктегі мұнара жаңа ұлттық рекорд орнатты.',
      en: 'A tower in Astana at 420 meters high set a new national record.'
    },
    holder: 'Архитектурное бюро «KazTower»',
    date: '2025-01-10',
    image: 'https://picsum.photos/id/101/600/400'
  },
  {
    id: 12,
    category: 'sports',
    title: {
      ru: 'Самый быстрый марафонец Казахстана',
      kk: 'Қазақстанның ең жылдам марафоншысы',
      en: 'Fastest Marathon Runner of Kazakhstan'
    },
    description: {
      ru: 'Установлен рекорд времени на Алматинском марафоне — 2:08:45.',
      kk: 'Алматы марафонында рекордтық уақыт — 2:08:45 орнатылды.',
      en: 'A time record was set at the Almaty Marathon — 2:08:45.'
    },
    holder: 'Марат Жумабаев',
    date: '2024-09-05',
    image: 'https://picsum.photos/id/102/600/400'
  }
];

const Records = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [globalSearchActive, setGlobalSearchActive] = useState(false);
  const [globalResults, setGlobalResults] = useState<{ title: string; url: string; snippet: string; source?: string }[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [issueResults, setIssueResults] = useState<{ issueTitle: string; pdfUrl: string; page: number; text: string }[]>([]);
  const [issueResultsLoading, setIssueResultsLoading] = useState(false);
  const lastGlobalQueryRef = useRef('');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const trimmedSearch = debouncedSearch;
  const normalizedSearch = trimmedSearch.toLowerCase();

  useEffect(() => {
    const loadRecords = async () => {
      const params = new URLSearchParams();
      params.set('limit', normalizedSearch ? '120' : '60');
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (normalizedSearch) params.set('q', trimmedSearch);

      setRecordsLoading(true);
      try {
        const data = await apiRequest<any[]>(`/api/records?${params.toString()}`);
        setRecords(data);
      } catch (_error) {
        setRecords(SAMPLE_RECORDS);
      } finally {
        setRecordsLoading(false);
        setLoading(false);
      }
    };
    loadRecords();
  }, [activeCategory, normalizedSearch, trimmedSearch]);

  const filteredRecords = records;

  useEffect(() => {
    if (normalizedSearch.length < 2 || recordsLoading) {
      setGlobalSearchActive(false);
      setGlobalResults([]);
      lastGlobalQueryRef.current = '';
      return;
    }

    if (filteredRecords.length > 0) {
      setGlobalSearchActive(false);
      setGlobalResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setGlobalSearchActive(true);
      if (lastGlobalQueryRef.current !== normalizedSearch) {
        lastGlobalQueryRef.current = normalizedSearch;
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [normalizedSearch, filteredRecords.length, recordsLoading]);

  useEffect(() => {
    if (!globalSearchActive || trimmedSearch.length < 2) return;

    let cancelled = false;
    const loadGlobalResults = async () => {
      setGlobalLoading(true);
      try {
        const data = await apiRequest<{
          results: { title: string; url: string; snippet: string; source?: string }[];
        }>(`/api/search/instant?q=${encodeURIComponent(trimmedSearch)}`);
        if (!cancelled) setGlobalResults(data.results || []);
      } catch (_error) {
        if (!cancelled) setGlobalResults([]);
      } finally {
        if (!cancelled) setGlobalLoading(false);
      }
    };

    loadGlobalResults();
    return () => { cancelled = true; };
  }, [globalSearchActive, trimmedSearch]);

  useEffect(() => {
    if (trimmedSearch.length < 2) {
      setIssueResults([]);
      setIssueResultsLoading(false);
      return;
    }

    let cancelled = false;
    const loadIssueResults = async () => {
      setIssueResultsLoading(true);
      try {
        const data = await apiRequest<{
          results: { issueTitle: string; pdfUrl: string; page: number; text: string }[];
        }>(`/api/issues/search?q=${encodeURIComponent(trimmedSearch)}&limit=12`);
        if (!cancelled) setIssueResults(data.results || []);
      } catch (_error) {
        if (!cancelled) setIssueResults([]);
      } finally {
        if (!cancelled) setIssueResultsLoading(false);
      }
    };

    loadIssueResults();
    return () => { cancelled = true; };
  }, [trimmedSearch]);

  const resolvePdfPageUrl = (rawUrl: string, page: number) => {
    const normalized = rawUrl?.startsWith('/') ? rawUrl : `/${rawUrl || ''}`;
    return `${normalized}#page=${page}`;
  };

  const ddgSearchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(trimmedSearch)}`;

  const ddgCopy =
    language === 'ru'
      ? {
          localEmpty: 'На сайте ничего не найдено.',
          globalTitle: 'Глобальный поиск',
          globalHint: 'Результаты из интернета прямо на странице.',
          link: 'Полный поиск в DuckDuckGo',
          back: 'Вернуться к поиску на сайте',
          loading: 'Ищем в интернете...',
          empty: 'Кратких результатов нет. Откройте полный поиск в DuckDuckGo.',
        }
      : language === 'kk'
        ? {
            localEmpty: 'Сайтта ештеңе табылмады.',
            globalTitle: 'Жаһандық іздеу',
            globalHint: 'Интернет нәтижелері бетте көрсетіледі.',
            link: 'DuckDuckGo-да толық іздеу',
            back: 'Сайтта іздеуге оралу',
            loading: 'Интернетте іздеу...',
            empty: 'Қысқа нәтижелер жоқ. DuckDuckGo-да толық іздеуді ашыңыз.',
          }
        : {
            localEmpty: 'Nothing found on this site.',
            globalTitle: 'Global search',
            globalHint: 'Web results shown on this page.',
            link: 'Full search on DuckDuckGo',
            back: 'Back to site search',
            loading: 'Searching the web...',
            empty: 'No quick results. Open full search on DuckDuckGo.',
          };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">
          {language === 'ru' ? 'Рекорды Казахстана' : language === 'kk' ? 'Қазақстан рекордтар кітабы' : 'Book of Records'}
        </h1>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={language === 'ru' ? 'Поиск...' : language === 'kk' ? 'Іздеу...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {globalSearchActive && trimmedSearch.length >= 2 && (
        <div className="mb-8 rounded-lg border bg-muted/20 overflow-hidden">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-4 border-b bg-muted/40">
            <div>
              <p className="font-semibold">{ddgCopy.globalTitle}</p>
              <p className="text-sm text-muted-foreground">{ddgCopy.globalHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setGlobalSearchActive(false)}>
                {ddgCopy.back}
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <a href={ddgSearchUrl} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  {ddgCopy.link}
                </a>
              </Button>
            </div>
          </div>
          <div className="px-4 py-4 space-y-3 bg-white min-h-[120px]">
            {globalLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ddgCopy.loading}
              </div>
            )}
            {!globalLoading && globalResults.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{ddgCopy.empty}</p>
            )}
            {!globalLoading && globalResults.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-blue-700 leading-snug">{item.title}</p>
                  {item.source && (
                    <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                      {item.source}
                    </Badge>
                  )}
                </div>
                {item.snippet && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.snippet}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {!globalSearchActive && trimmedSearch.length >= 2 && filteredRecords.length === 0 && (
        <div className="mb-8 rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center md:text-left">
          <p className="text-muted-foreground">{ddgCopy.localEmpty}</p>
        </div>
      )}

      {/* КНОПКИ С ПОСТОЯННОЙ ЗАЛИВКОЙ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        <Button
          onClick={() => setActiveCategory('all')}
          className="rounded-full whitespace-nowrap px-6 transition-all"
          style={{
            backgroundColor: activeCategory === 'all' ? '#0891B2' : '#E2E8F0',
            color: activeCategory === 'all' ? '#FFFFFF' : '#475569',
            border: 'none'
          }}
        >
          {language === 'ru' ? 'Все' : language === 'kk' ? 'Барлығы' : 'All'}
        </Button>

        {ALL_CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="rounded-full whitespace-nowrap px-6 transition-all"
            style={{
              backgroundColor: cat.color,
              color: '#FFFFFF',
              border: 'none',
              opacity: activeCategory === 'all' || activeCategory === cat.id ? 1 : 0.4,
              transform: activeCategory === cat.id ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {cat[language as keyof typeof cat] || cat.ru}
          </Button>
        ))}
      </div>

      {trimmedSearch.length >= 2 && (
        <div className="mb-8 rounded-lg border bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <p className="font-semibold text-sm">
                {language === 'en' ? 'Found in PDF issues' : 'Найдено в выпусках PDF'}
              </p>
            </div>
            {issueResultsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="p-4 space-y-3">
            {!issueResultsLoading && issueResults.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'No matching PDF pages.' : 'Совпадений на страницах выпусков нет.'}
              </p>
            )}
            {issueResults.map((item, index) => (
              <a
                key={`${item.pdfUrl}-${item.page}-${index}`}
                href={resolvePdfPageUrl(item.pdfUrl, item.page)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <p className="font-medium text-slate-900">{item.issueTitle || 'PDF выпуск'}</p>
                  <Badge variant="outline" className="w-fit shrink-0">
                    {language === 'en' ? `Page ${item.page}` : `Страница ${item.page}`}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.text}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {recordsLoading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {language === 'en' ? 'Searching...' : 'Поиск...'}
        </div>
      )}

      {!globalSearchActive && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((rec) => {
          const categoryInfo = ALL_CATEGORIES.find(c => c.id === rec.category);
          const categoryColor = categoryInfo?.color || '#94a3b8';
          const titleText = parseLocalizedField(rec.title, language);

          return (
            <Card key={rec.id} className="flex flex-col h-full shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {}
              <img
                src={rec.image}
                alt={titleText}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    style={{ backgroundColor: categoryColor, color: '#FFFFFF' }}
                    className="text-[10px] uppercase border-none px-3 py-1"
                  >
                    {categoryInfo?.[language as keyof typeof categoryInfo] || rec.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{rec.date}</span>
                </div>

                <h3 className="text-xl font-bold mb-3">
                  {titleText}
                </h3>

                <p className="text-muted-foreground text-sm mb-6 flex-grow">
                  {parseLocalizedField(rec.description, language)}
                </p>

                <div className="pt-4 border-t mt-auto">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Рекордсмен</p>
                  <p className="font-semibold text-slate-700">{rec.holder}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default Records;
