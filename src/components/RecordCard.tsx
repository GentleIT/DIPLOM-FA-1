import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Record } from '@/data/mockRecords';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecordCardProps {
  record: Record;
  index?: number;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, index = 0 }) => {
  const { language, t } = useLanguage();

  const categoryIcons: { [key: string]: string } = {
    sports: '🏆',
    culture: '🎭',
    science: '🔬',
    nature: '🏔️',
    technology: '💻',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="group overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={record.image}
            alt={record.title[language]}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          <Badge className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm text-foreground hover:bg-card">
            <span className="mr-1">{categoryIcons[record.category]}</span>
            {t(record.category)}
          </Badge>

          {/* Featured Badge */}
          {record.featured && (
            <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground">
              ⭐ Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-5">
          {/* Title */}
          <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {record.title[language]}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {record.description[language]}
          </p>

          {/* Meta Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{record.holder}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">{record.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                {new Date(record.date).toLocaleDateString(
                  language === 'kk' ? 'kk-KZ' : language === 'ru' ? 'ru-RU' : 'en-US'
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecordCard;
