import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/mockRecords';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FileText, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { motion } from 'framer-motion';

const SubmitRecord: React.FC = () => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    holder: '',
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('date', formData.date);
      payload.append('holder', formData.holder);
      payload.append('location', formData.location);
      if (formData.image) payload.append('image', formData.image);

      await apiRequest('/api/applications', {
        method: 'POST',
        body: payload,
        isFormData: true,
      });

      toast({
        title: language === 'ru' ? 'Успешно!' : 'Сәтті!',
        description: 'Заявка отправлена на модерацию',
      });

      setFormData({ title: '', description: '', category: '', date: '', location: '', holder: '', image: null });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Ошибка при отправке',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 bg-slate-50/50">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg border-none">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{t('submitRecord')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Название рекорда *</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Имя рекордсмена *</Label>
                  <Input value={formData.holder} onChange={e => setFormData({...formData, holder: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select onValueChange={v => setFormData({...formData, category: v})} value={formData.category}>
                      <SelectTrigger><SelectValue placeholder="Выбрать" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{t(c.labelKey)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Дата</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Местоположение</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Фото</Label>
                  <Input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files?.[0] || null})} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Отправить
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitRecord;