import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockRecords, Record } from '@/data/mockRecords';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InteractiveJournal: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const featuredRecords = mockRecords.filter((r) => r.featured);
  const totalPages = featuredRecords.length;

  const nextPage = () => {
    setDirection(1);
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setDirection(-1);
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const currentRecord = featuredRecords[currentPage];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto perspective-1000">
      {/* Book Container */}
      <div className="relative bg-card rounded-2xl shadow-elevated overflow-hidden book-shadow">
        {/* Decorative Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-primary/20 to-transparent z-10" />
        
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left Page - Image */}
          <div className="lg:w-1/2 relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  rotateY: { duration: 0.4 },
                }}
                className="absolute inset-0"
              >
                <div
                  className="w-full h-full min-h-[300px] lg:min-h-[500px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${currentRecord.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-kazakh-dark/80 via-transparent to-transparent" />
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Page Number */}
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
              {currentPage + 1} / {totalPages}
            </div>
          </div>

          {/* Right Page - Content */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center kazakh-pattern">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                custom={direction}
                variants={{
                  enter: { opacity: 0, y: 20 },
                  center: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -20 },
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {/* Category Badge */}
                <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <span className="text-lg">
                    {currentRecord.category === 'nature' && '🏔️'}
                    {currentRecord.category === 'science' && '🔬'}
                    {currentRecord.category === 'technology' && '💻'}
                    {currentRecord.category === 'sports' && '🏆'}
                    {currentRecord.category === 'culture' && '🎭'}
                  </span>
                  {t(currentRecord.category)}
                </div>

                {/* Title */}
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {currentRecord.title[language]}
                </h2>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {currentRecord.description[language]}
                </p>

                {/* Meta Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">{currentRecord.holder}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{currentRecord.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      {new Date(currentRecord.date).toLocaleDateString(
                        language === 'kk' ? 'kk-KZ' : language === 'ru' ? 'ru-RU' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </span>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="mt-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <div className="h-px flex-1 bg-gradient-to-l from-primary/50 to-transparent" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            className="rounded-full bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            className="rounded-full bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Page Indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {featuredRecords.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentPage ? 1 : -1);
              setCurrentPage(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentPage
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveJournal;
