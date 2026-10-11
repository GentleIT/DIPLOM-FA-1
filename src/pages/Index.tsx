import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Trophy, BookOpen } from 'lucide-react';

type SlideData = {
  category: string;
  categoryLabelKey: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
};

const SLIDES_DATA: SlideData[] = [
  {
    category: 'geography',
    categoryLabelKey: 'geography',
    titleKey: 'slide1Title',
    descriptionKey: 'slide1Desc',
    icon: '🌍',
  },
  {
    category: 'population',
    categoryLabelKey: 'population',
    titleKey: 'slide2Title',
    descriptionKey: 'slide2Desc',
    icon: '👥',
  },
  {
    category: 'economy',
    categoryLabelKey: 'economy',
    titleKey: 'slide3Title',
    descriptionKey: 'slide3Desc',
    icon: '💼',
  },
  {
    category: 'politics',
    categoryLabelKey: 'politics',
    titleKey: 'slide4Title',
    descriptionKey: 'slide4Desc',
    icon: '🏛️',
  },
  {
    category: 'law',
    categoryLabelKey: 'law',
    titleKey: 'slide5Title',
    descriptionKey: 'slide5Desc',
    icon: '⚖️',
  },
  {
    category: 'tourism',
    categoryLabelKey: 'tourism',
    titleKey: 'slide6Title',
    descriptionKey: 'slide6Desc',
    icon: '✈️',
  },
  {
    category: 'education',
    categoryLabelKey: 'education',
    titleKey: 'slide7Title',
    descriptionKey: 'slide7Desc',
    icon: '🎓',
  },
  {
    category: 'science',
    categoryLabelKey: 'science',
    titleKey: 'slide8Title',
    descriptionKey: 'slide8Desc',
    icon: '🔬',
  },
  {
    category: 'healthcare',
    categoryLabelKey: 'healthcare',
    titleKey: 'slide9Title',
    descriptionKey: 'slide9Desc',
    icon: '🏥',
  },
  {
    category: 'culture',
    categoryLabelKey: 'culture',
    titleKey: 'slide10Title',
    descriptionKey: 'slide10Desc',
    icon: '🎭',
  },
  {
    category: 'architecture',
    categoryLabelKey: 'architecture',
    titleKey: 'slide11Title',
    descriptionKey: 'slide11Desc',
    icon: '🏗️',
  },
  {
    category: 'sports',
    categoryLabelKey: 'sports',
    titleKey: 'slide12Title',
    descriptionKey: 'slide12Desc',
    icon: '🏆',
  },
];

const Index: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(197,71%,52%,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(45,93%,58%,0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>{t('recordsOfKazakhstan')}</span>
            </div>

            <h1 className="font-bold text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                {t('bookTitle')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('siteFullName')}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/records">
                <Button size="lg" className="gap-2 text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
                  <Trophy className="w-5 h-5" />
                  {t('discoverRecords')}
                </Button>
              </Link>
              <Link to="/current-issue">
                <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 h-auto border-2 hover:bg-primary/10">
                  <BookOpen className="w-5 h-5" />
                  {t('currentIssue')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Слайдер с рекордами */}
      <section className="container mx-auto px-4 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            {t('recordsOfKazakhstan')}
          </h2>
          <p className="text-center text-muted-foreground text-lg">
            {t('uniqueAchievements')}
          </p>
        </motion.div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full max-w-7xl mx-auto"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {SLIDES_DATA.map((slide, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="h-full"
                >
                  <Card className="h-full flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Верхняя часть: категория + текст */}
                      <div className="flex flex-col gap-3 flex-1">
                        <Badge className="w-fit text-sm px-4 py-1.5" variant="secondary">
                          <span className="mr-2 text-lg">{slide.icon}</span>
                          {t(slide.categoryLabelKey)}
                        </Badge>

                        <h3 className="text-xl font-bold leading-tight">
                          {t(slide.titleKey)}
                        </h3>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {t(slide.descriptionKey)}
                        </p>
                      </div>

                      {/* Кнопка "Подробнее" фиксированно внизу карточки */}
                      <div className="mt-6">
                        <Link to="/records">
                          <Button className="w-full gap-2 group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all">
                            {t('moreDetails')}
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
          <CarouselNext className="hidden md:flex -right-12 bg-background/80 backdrop-blur-sm border-2 hover:bg-background" />
        </Carousel>
      </section>

      {/* Текстовая информация */}
      <section className="container mx-auto px-4 max-w-5xl mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-card/80 backdrop-blur-md shadow-2xl rounded-3xl p-8 md:p-12 border border-border/50"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('bookTitle')}
          </h1>
          <p className="text-center text-muted-foreground mb-10 text-lg">
            {t('siteFullName')}
          </p>

          <div className="space-y-6 text-justify leading-relaxed text-base md:text-lg">
            <p className="text-foreground/90">
              {t('bookDescription1')}
            </p>
            <p className="text-foreground/90">
              {t('bookDescription2')}
            </p>
            <p className="text-foreground/90">
              {t('bookDescription3')}
            </p>

            <h2 className="text-3xl font-semibold mt-12 mb-6 text-foreground">{t('history')}</h2>
            <p className="text-foreground/90">
              {t('historyText1')}
            </p>
            <p className="text-foreground/90">
              {t('historyText2')}
            </p>
            <p className="text-foreground/90">
              {t('historyText3')}
            </p>
            <p className="text-foreground/90">
              {t('historyText4')}
            </p>

            <h2 className="text-3xl font-semibold mt-12 mb-6 text-foreground">{t('mainSections')}</h2>
            <p className="text-foreground/90 mb-4">
              {t('mainSectionsText')}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {['geography', 'population', 'economy', 'politics', 'law', 'tourism', 'education', 'science', 'healthcare', 'culture', 'architecture', 'sports'].map((cat) => (
                <li key={cat} className="flex items-center gap-2 text-foreground/90">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {t(cat)}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Index;
