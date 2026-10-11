import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Menu, X } from 'lucide-react';
import ModernBurgerMenu from './ModernBurgerMenu';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const languages = [
    { code: 'kk' as const, label: 'Қазақша', flag: '' },
    { code: 'ru' as const, label: 'Русский', flag: '' },
    { code: 'en' as const, label: 'English', flag: '' },
  ];

  return (
    <header className={`sticky top-0 z-[110] transition-all duration-300 ${menuOpen ? 'bg-transparent' : 'glass-effect border-b border-border/50'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - скрывается при открытии меню */}
          <Link 
            to="/" 
            className={`flex items-center gap-3 group transition-all duration-300 ${menuOpen ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100'}`} 
            onClick={closeMenu}
          >
            <img 
              src="/LOGO.png" 
              alt="КИнЭС" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-foreground leading-tight">
                КИНЭС СПРАВОЧНИК
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Язык - скрывается при открытии меню */}
            <div className={`transition-all duration-300 ${menuOpen ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100'}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline uppercase">
                      {language}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`gap-2 cursor-pointer ${language === lang.code ? 'bg-muted' : ''}`}
                    >
                      <span>{lang.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Единственная кнопка управления меню */}
            <Button
              variant="ghost"
              size="icon"
              className="relative z-[120] hover:bg-primary/10 transition-colors"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <ModernBurgerMenu isOpen={menuOpen} onClose={closeMenu} />
    </header>
  );
};

export default Header;