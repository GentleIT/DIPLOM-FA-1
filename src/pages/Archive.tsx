import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Eye, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type ArchiveItem = {
  id: string;
  title: string;
  pdf_url: string;
};

const Archive: React.FC = () => {
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchiveFiles = async () => {
      try {
        const data = await apiRequest<ArchiveItem[]>('/api/issues?status=archive');
        setArchiveItems(data || []);
      } catch (error) {
        console.error('Ошибка загрузки архива:', error);
        setArchiveItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArchiveFiles();
  }, []);


  return (
    <div className="min-h-screen py-10 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl bg-card shadow-elevated rounded-3xl p-8 md:p-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Архив выпусков КИнЭС</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Здесь представлены PDF-файлы прошлых выпусков Казахстанской книги рекордов. Нажмите на название или кнопку,
          чтобы скачать выбранный выпуск.
        </p>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : archiveItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Архивные выпуски не найдены.
          </div>
        ) : (
          <div className="space-y-4">
            {archiveItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border rounded-xl px-4 py-3 bg-background hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lg font-semibold text-primary hover:underline block"
                  >
                    {item.title}
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Архивный PDF-документ
                  </p>
                </div>
                <div className="flex gap-2 md:ml-4">
                  <a href={item.pdf_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Предпросмотр
                    </Button>
                  </a>
                  <a href={item.pdf_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Открыть PDF
                    </Button>
                  </a>
                  <a href={item.pdf_url} download>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      Скачать
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;

