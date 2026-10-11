import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Home, BookOpen, FileText, Trophy, Archive, BookMarked, Settings } from 'lucide-react';

interface ModernBurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModernBurgerMenu: React.FC<ModernBurgerMenuProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [homeSubOpen, setHomeSubOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      id: 'home',
      label: t('home'),
      icon: Home,
      path: '/',
      subItems: [
        { label: language === 'ru' ? 'Главная страница' : language === 'kk' ? 'Басты бет' : 'Home Page', path: '/' },
        { label: t('editorialBoard'), path: '/editorial-board' },
        { label: t('about'), path: '/about' },
      ],
    },
    { id: 'records', label: t('records'), icon: Trophy, path: '/records' },
    { id: 'submit', label: t('submitRecord'), icon: FileText, path: '/submit' },
    { id: 'archive', label: t('archive'), icon: Archive, path: '/archive' },
    { id: 'currentIssue', label: t('currentIssue'), icon: BookMarked, path: '/current-issue' },
    { id: 'admin', label: t('admin'), icon: Settings, path: '/admin' },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setHomeSubOpen(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Z-index чуть ниже хедера */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-[105] flex flex-col border-l border-border/50"
          >
            {/* Декоративный эффект корешка книги */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-primary/20 to-transparent" />

            {/* Header меню (без кнопки X, она в Header.tsx) */}
            <div className="p-6 pt-20 border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{t('siteName')}</h2>
              </div>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {hasSubItems ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => setHomeSubOpen(!homeSubOpen)}
                          className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${
                            homeSubOpen ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium text-lg">{item.label}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${homeSubOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {homeSubOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-muted/30 rounded-2xl ml-4"
                            >
                              <div className="p-2 space-y-1">
                                {item.subItems!.map((subItem) => (
                                  <Link
                                    key={subItem.path}
                                    to={subItem.path}
                                    onClick={onClose}
                                    className={`block px-6 py-3 rounded-xl text-base transition-colors ${
                                      isActive(subItem.path) ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                          isActive(item.path)
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-lg">{item.label}</span>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground text-center font-medium opacity-60">
                © {new Date().getFullYear()} {t('siteName')}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModernBurgerMenu;