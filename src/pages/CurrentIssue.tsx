import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Home, Loader2, Menu } from 'lucide-react';
import ModernBurgerMenu from '@/components/ModernBurgerMenu';
import FlipBook from '@/components/FlipBook';
import { apiRequest } from '@/lib/api';

type Issue = {
  id: string;
  title: string;
  pdf_url: string;
};

const CurrentIssue: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentIssue = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Issue[]>('/api/issues?status=current');
        if (data.length > 0) {
          setIssue(data[0]);
        }
      } catch (error: any) {
        console.warn('Не удалось загрузить текущий выпуск:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentIssue();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Загрузка текущего выпуска...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Текущий выпуск не назначен. Назначьте его в админ-панели.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header — теперь светлый */}
      <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between h-12 md:h-14">
            <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0">
              <img src="/LOGO.png" alt="КИнЭС" className="h-7 md:h-8 w-auto shrink-0" />
              <span className="font-bold text-slate-900 tracking-tight text-sm md:text-base truncate">КИНЭС СПРАВОЧНИК</span>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="text-slate-900 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Меню должно быть ПОВЕРХ всего */}
      <ModernBurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Инфо-панель */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 md:px-6 py-2 md:py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white border-slate-200 text-slate-600 hover:text-slate-900 h-8 px-2 md:px-3">
              <Home className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Главная</span>
            </Button>
          </Link>
          <div className="min-w-0">
            <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-bold truncate">Казахстанская книга рекордов</p>
            <p className="text-xs md:text-sm font-bold text-slate-700 truncate">{issue.title}</p>
          </div>
        </div>
        <a href={issue.pdf_url} download className="shrink-0">
          <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md">
            <Download className="w-4 h-4" />
            <span className="text-xs md:text-sm">Скачать PDF</span>
          </Button>
        </a>
      </div>

      {/* Книга */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <FlipBook pdfUrl={issue.pdf_url} />
      </div>
    </div>
  );
};

export default CurrentIssue;