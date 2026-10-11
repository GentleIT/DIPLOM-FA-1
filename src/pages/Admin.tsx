import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Check, Languages, Loader2, Trash2, Edit2, BookOpen, Eye, ExternalLink, Download, LogOut, Plus, Users, FileSearch } from 'lucide-react';
import { apiRequest, authApi } from '@/lib/api';

// --- Список из 13 категорий (вернул Историю) ---
const ALL_CATEGORIES = [
  { id: 'geography', ru: 'География', kk: 'География', en: 'Geography' },
  { id: 'population', ru: 'Народонаселение', kk: 'Халық', en: 'Population' },
  { id: 'history', ru: 'История', kk: 'Тарих', en: 'History' }, // Добавлено
  { id: 'economy', ru: 'Экономика и бизнес', kk: 'Экономика және бизнес', en: 'Economy & Business' },
  { id: 'politics', ru: 'Политика', kk: 'Саясат', en: 'Politics' },
  { id: 'law', ru: 'Право', kk: 'Құқық', en: 'Law' },
  { id: 'tourism', ru: 'Туризм', kk: 'Туризм', en: 'Tourism' },
  { id: 'education', ru: 'Образование', kk: 'Білім', en: 'Education' },
  { id: 'science', ru: 'Наука', kk: 'Ғылым', en: 'Science' },
  { id: 'healthcare', ru: 'Здравоохранение', kk: 'Денсаулық сақтау', en: 'Healthcare' },
  { id: 'culture', ru: 'Культура и искусство', kk: 'Мәдениет және өнер', en: 'Culture & Art' },
  { id: 'architecture', ru: 'Архитектура и градостроительство', kk: 'Сәулет және қала құрылысы', en: 'Architecture' },
  { id: 'sports', ru: 'Спорт', kk: 'Спорт', en: 'Sport' }
];
const MAX_ISSUE_FILE_SIZE_MB = 1500;
const MAX_ISSUE_FILE_SIZE_BYTES = MAX_ISSUE_FILE_SIZE_MB * 1024 * 1024;

const translateText = async (text: string, targetLang: string) => {
  if (!text) return '';
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=${targetLang}&dt=t&q=${encodeURI(text)}`);
    const data = await res.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch (e) { return text; }
};

const EMPTY_RECORD = {
  title: { ru: '', kk: '', en: '' },
  description: { ru: '', kk: '', en: '' },
  category: 'geography',
  holder: '',
  location: '',
  date: new Date().toISOString().slice(0, 10),
  image: '',
  featured: false,
};

type FormMode = 'add' | 'edit' | 'approve';

const getLocalizedField = (value: unknown, lang: 'ru' | 'kk' | 'en'): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed[lang] || '';
      }
    } catch {
      return lang === 'ru' ? value : '';
    }
    return lang === 'ru' ? value : '';
  }
  if (typeof value === 'object') {
    return (value as Record<string, string>)[lang] || '';
  }
  return '';
};

const buildFormState = (initialData: any) => ({
  id: initialData?.id || '',
  title_ru: getLocalizedField(initialData?.title, 'ru'),
  title_kk: getLocalizedField(initialData?.title, 'kk'),
  title_en: getLocalizedField(initialData?.title, 'en'),
  desc_ru: getLocalizedField(initialData?.description, 'ru'),
  desc_kk: getLocalizedField(initialData?.description, 'kk'),
  desc_en: getLocalizedField(initialData?.description, 'en'),
  category: initialData?.category || 'geography',
  holder: initialData?.holder || '',
  location: initialData?.location || '',
  date: initialData?.date || new Date().toISOString().slice(0, 10),
  image: initialData?.image || '',
  featured: Boolean(initialData?.featured),
});

const Admin: React.FC = () => {
  const { language } = useLanguage(); 
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingData, setEditingData] = useState<any>(null);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [issues, setIssues] = useState<any[]>([]);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const [issueFile, setIssueFile] = useState<File | null>(null);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<{ id: string; email: string; created_at: string }[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [parsingIssueId, setParsingIssueId] = useState<string | null>(null);

  const resolvePdfUrl = (rawUrl: string) => {
    if (!rawUrl) return '#';
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    return rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  };

  const downloadIssuePdf = async (rawUrl: string, issueTitle: string) => {
    const url = resolvePdfUrl(rawUrl);
    try {
      const absolute = new URL(url, window.location.origin);
      if (absolute.origin !== window.location.origin) {
        window.open(absolute.toString(), '_blank', 'noopener,noreferrer');
        return;
      }
      const response = await fetch(absolute.toString());
      if (!response.ok) throw new Error('Не удалось загрузить PDF');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      const safeTitle = (issueTitle || 'issue').replace(/[\\/:*?"<>|]+/g, '_');
      link.download = `${safeTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error: any) {
      toast({
        title: 'Ошибка скачивания',
        description: error.message || 'Не удалось скачать PDF',
        variant: 'destructive',
      });
    }
  };

  // Внедренная проверка авторизации
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user } = await authApi.getSession();
        if (!user) {
          window.location.href = '/admin-login';
          return;
        }
        setUser(user);
        fetchData();
        fetchIssues();
        fetchAdminUsers();
      } catch (_error) {
        window.location.href = '/admin-login'; 
      }
    };
    checkUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apps = await apiRequest<any[]>('/api/applications?status=pending', { auth: true });
      const recs = await apiRequest<any[]>('/api/records');
      setApplications(apps || []);
      setRecords(recs || []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    setIssuesLoading(true);
    try {
      const data = await apiRequest<any[]>('/api/issues');
      setIssues(data || []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки выпусков", description: err.message, variant: "destructive" });
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const data = await apiRequest<{ id: string; email: string; created_at: string }[]>('/api/admin/users', {
        auth: true,
      });
      setAdminUsers(data || []);
    } catch (err: any) {
      toast({ title: 'Ошибка загрузки пользователей', description: err.message, variant: 'destructive' });
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !newAdminPassword) {
      toast({ title: 'Заполните email и пароль', variant: 'destructive' });
      return;
    }
    setCreatingAdmin(true);
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        auth: true,
        body: { email, password: newAdminPassword },
      });
      toast({ title: 'Пользователь добавлен' });
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdminUsers();
    } catch (err: any) {
      toast({ title: 'Не удалось создать пользователя', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (id === user?.id) {
      toast({ title: 'Нельзя удалить свой аккаунт', variant: 'destructive' });
      return;
    }
    if (!confirm(`Удалить пользователя ${email}?`)) return;
    try {
      await apiRequest(`/api/admin/users/${id}`, { method: 'DELETE', auth: true });
      toast({ title: 'Пользователь удалён' });
      fetchAdminUsers();
    } catch (err: any) {
      toast({ title: 'Ошибка удаления', description: err.message, variant: 'destructive' });
    }
  };

  const createIssue = async () => {
    if (!issueTitle.trim()) {
      toast({ title: "Укажите название выпуска", variant: "destructive" });
      return;
    }

    try {
      setIssuesLoading(true);
      let finalUrl = issueUrl.trim();

      if (issueFile) {
        if (issueFile.size > MAX_ISSUE_FILE_SIZE_BYTES) {
          toast({
            title: "Файл слишком большой",
            description: `Размер PDF превышает ${MAX_ISSUE_FILE_SIZE_MB} МБ. Увеличьте file size limit в bucket issues-pdf или используйте внешнюю ссылку.`,
            variant: "destructive",
          });
          setIssuesLoading(false);
          return;
        }

        const form = new FormData();
        form.append('title', issueTitle.trim());
        form.append('status', 'archive');
        form.append('pdf', issueFile);
        await apiRequest('/api/issues', {
          method: 'POST',
          auth: true,
          body: form,
          isFormData: true,
        });
      } else {
        if (!finalUrl) {
          toast({ title: "Укажите ссылку PDF или загрузите файл", variant: "destructive" });
          return;
        }
        await apiRequest('/api/issues', {
          method: 'POST',
          auth: true,
          body: {
            title: issueTitle.trim(),
            pdf_url: finalUrl,
            status: 'archive',
          },
        });
      }

      toast({ title: "Выпуск добавлен" });
      setIssueTitle('');
      setIssueUrl('');
      setIssueFile(null);
      fetchIssues();
    } catch (err: any) {
      const details = String(err?.message || "");
      const normalized = details.toLowerCase();
      const sizeHint = normalized.includes("maximum allowed size") || normalized.includes("exceeded");
      toast({ title: "Ошибка добавления выпуска", description: err.message, variant: "destructive" });
      if (sizeHint) {
        toast({
          title: "Проверьте лимит загрузки",
          description: "Убедитесь, что PDF не превышает лимиты вашего сервера.",
          variant: "destructive",
        });
      }
    } finally {
      setIssuesLoading(false);
    }
  };

  const setIssueAsCurrent = async (issueId: string) => {
    try {
      await apiRequest(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        auth: true,
        body: { status: 'current' },
      });

      toast({ title: "Текущий выпуск обновлен" });
      fetchIssues();
    } catch (err: any) {
      toast({ title: "Ошибка назначения текущего выпуска", description: err.message, variant: "destructive" });
    }
  };

  const moveIssueToArchive = async (issueId: string) => {
    try {
      await apiRequest(`/api/issues/${issueId}/status`, {
        method: 'PATCH',
        auth: true,
        body: { status: 'archive' },
      });
      toast({ title: "Выпуск перемещен в архив" });
      fetchIssues();
    } catch (err: any) {
      toast({ title: "Ошибка обновления выпуска", description: err.message, variant: "destructive" });
    }
  };

  const deleteIssue = async (issueId: string) => {
    if (!confirm("Удалить выпуск безвозвратно?")) return;
    try {
      await apiRequest(`/api/issues/${issueId}`, { method: 'DELETE', auth: true });
      toast({ title: "Выпуск удален" });
      fetchIssues();
    } catch (err: any) {
      toast({ title: "Ошибка удаления выпуска", description: err.message, variant: "destructive" });
    }
  };

  const parseIssue = async (issueId: string) => {
    setParsingIssueId(issueId);
    try {
      const result = await apiRequest<{ pages: number; records: number }>(`/api/issues/${issueId}/parse`, {
        method: 'POST',
        auth: true,
      });
      toast({
        title: 'PDF распарсен',
        description: `Страниц: ${result.pages}. Карточек рекордов: ${result.records}.`,
      });
      fetchIssues();
      fetchData();
    } catch (err: any) {
      toast({ title: 'Ошибка парсинга PDF', description: err.message, variant: 'destructive' });
    } finally {
      setParsingIssueId(null);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin-login');
  };

  const handleAddRecord = () => {
    setActiveAppId(null);
    setFormMode('add');
    setEditingData({ ...EMPTY_RECORD });
    setIsFormOpen(true);
  };

  const handleApproveClick = (app: any) => {
    setFormMode('approve');
    setActiveAppId(app.id);
    setEditingData({
      title: { ru: app.title, kk: '', en: '' },
      description: { ru: app.description, kk: '', en: '' },
      category: app.category || 'geography',
      holder: app.holder,
      location: app.location || '',
      date: app.date,
      image: app.image,
      featured: false
    });
    setIsFormOpen(true);
  };

  const handleRejectApplication = async (id: string) => {
    if (!confirm("Удалить заявку безвозвратно?")) return;
    try {
      await apiRequest(`/api/applications/${id}`, { method: 'DELETE', auth: true });
      setApplications(prev => prev.filter(a => a.id !== id));
      toast({ title: "Заявка отклонена и удалена" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
  };

  const handleEditRecord = (rec: any) => {
    setActiveAppId(null);
    setFormMode('edit');
    setEditingData(rec);
    setIsFormOpen(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Удалить рекорд из базы? Он исчезнет с сайта.")) return;
    try {
      await apiRequest(`/api/records/${id}`, { method: 'DELETE', auth: true });
      setRecords(prev => prev.filter(r => r.id !== id));
      toast({ title: "Рекорд удален" });
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    }
  };

  const filteredRecords = categoryFilter === 'all' 
    ? records 
    : records.filter(r => r.category === categoryFilter);

  const formDialogTitle =
    formMode === 'add'
      ? 'Добавить рекорд'
      : formMode === 'approve'
        ? 'Публикация рекорда'
        : 'Редактирование рекорда';

  if (loading || !user) return <div className="p-20 text-center flex flex-col items-center gap-4"><Loader2 className="animate-spin" /> Загрузка доступа...</div>;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Settings /> Панель управления</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Выйти
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="applications">
        <TabsList className="mb-6">
          <TabsTrigger value="applications">Заявки ({applications.length})</TabsTrigger>
          <TabsTrigger value="records">База рекордов ({records.length})</TabsTrigger>
          <TabsTrigger value="issues">Сборник выпусков ({issues.length})</TabsTrigger>
          <TabsTrigger value="admins" className="gap-1">
            <Users className="h-4 w-4 shrink-0" />
            Администраторы ({adminUsers.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 && <div className="text-center py-10 border rounded-lg border-dashed">Нет новых заявок</div>}
          {applications.map(app => (
            <Card key={app.id}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg">{app.title}</h3>
                  <p className="text-sm text-muted-foreground">{app.holder} | {app.date}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApproveClick(app)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Check className="w-4 h-4 mr-1" /> Рассмотреть
                  </Button>
                  <Button onClick={() => handleRejectApplication(app.id)} variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" /> Отклонить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Рекорды публикуются на сайте сразу, без модерации.
            </p>
            <Button onClick={handleAddRecord} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Добавить рекорд
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border overflow-x-auto">
            <Button variant={categoryFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('all')}>Все</Button>
            {ALL_CATEGORIES.map(cat => (
              <Button key={cat.id} variant={categoryFilter === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter(cat.id)} className="whitespace-nowrap">
                {cat[language as keyof typeof cat] || cat.ru}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredRecords.map(rec => (
              <Card key={rec.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">
                      {typeof rec.title === 'object' ? (rec.title[language] || rec.title.ru) : (rec.title || 'Без названия')}
                    </span>
                    <p className="text-sm text-muted-foreground">{rec.holder}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">
                      {ALL_CATEGORIES.find(c => c.id === rec.category)?.[language as keyof typeof ALL_CATEGORIES] || rec.category}
                    </Badge>
                    <Button variant="outline" size="icon" onClick={() => handleEditRecord(rec)}><Edit2 className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteRecord(rec.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5" /> Добавить выпуск</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Название выпуска" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
                <Input placeholder="Ссылка на PDF (если без загрузки)" value={issueUrl} onChange={(e) => setIssueUrl(e.target.value)} />
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setIssueFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={createIssue} disabled={issuesLoading}>
                {issuesLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Добавить в архив
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {issues.map(issue => (
              <Card key={issue.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold text-lg">{issue.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Статус: {issue.status === 'current' ? 'Текущий выпуск (книжка)' : 'Архив'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={resolvePdfUrl(issue.pdf_url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Eye className="w-4 h-4 mr-1" /> Предпросмотр</Button>
                    </a>
                    <a href={resolvePdfUrl(issue.pdf_url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" /> Открыть PDF</Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => downloadIssuePdf(issue.pdf_url, issue.title)}>
                      <Download className="w-4 h-4 mr-1" /> Скачать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => parseIssue(issue.id)}
                      disabled={parsingIssueId === issue.id}
                    >
                      {parsingIssueId === issue.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <FileSearch className="w-4 h-4 mr-1" />
                      )}
                      Парсить PDF
                    </Button>
                    {typeof issue.extracted_records_count === 'number' && (
                      <Badge variant="outline">{issue.extracted_records_count} карточек</Badge>
                    )}
                    {issue.status !== 'current' ? (
                      <Button size="sm" onClick={() => setIssueAsCurrent(issue.id)}>
                        Сделать текущим
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => moveIssueToArchive(issue.id)}>
                        В архив
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => deleteIssue(issue.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {issues.length === 0 && !issuesLoading && (
              <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">Выпусков пока нет</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5" /> Новый администратор
              </h3>
              <p className="text-sm text-muted-foreground">
                Любой из списка может войти на страницу «Вход для администратора» с email и паролем.
              </p>
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    autoComplete="username"
                    placeholder="admin@example.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground">Пароль (мин. 6 символов)</label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={creatingAdmin} className="md:col-span-1">
                  {creatingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Добавить
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Учётные записи</h3>
            {adminUsersLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!adminUsersLoading && adminUsers.length === 0 && (
              <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">Нет пользователей</div>
            )}
            {!adminUsersLoading &&
              adminUsers.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-medium">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Создан: {u.created_at ? new Date(u.created_at).toLocaleString('ru-RU') : '—'}
                      </p>
                      {u.id === user.id && <Badge className="mt-2">Вы</Badge>}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={u.id === user.id || adminUsers.length <= 1}
                      onClick={() => handleDeleteAdmin(u.id, u.email)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Удалить
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{formDialogTitle}</DialogTitle></DialogHeader>
          {editingData && (
            <RecordForm 
              key={`${formMode}-${activeAppId || editingData?.id || 'new'}`}
              initialData={editingData}
              formMode={formMode}
              appId={activeAppId} 
              onClose={() => { setIsFormOpen(false); fetchData(); }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- КОМПОНЕНТ ФОРМЫ ---
const RecordForm = ({ initialData, formMode, appId, onClose }: { initialData: any; formMode: FormMode; appId: string | null; onClose: () => void }) => {
  const { toast } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState(() => buildFormState(initialData));

  const handleTranslate = async () => {
    if (!formData.title_ru) return;
    setIsTranslating(true);
    try {
      const [tkk, ten, dkk, den] = await Promise.all([
        translateText(formData.title_ru, 'kk'), 
        translateText(formData.title_ru, 'en'),
        translateText(formData.desc_ru, 'kk'), 
        translateText(formData.desc_ru, 'en')
      ]);
      setFormData(p => ({ ...p, title_kk: tkk, title_en: ten, desc_kk: dkk, desc_en: den }));
    } finally {
      setIsTranslating(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalId = formData.id || crypto.randomUUID();
      const payload = {
        id: finalId,
        title: { ru: formData.title_ru, kk: formData.title_kk, en: formData.title_en },
        description: { ru: formData.desc_ru, kk: formData.desc_kk, en: formData.desc_en },
        category: formData.category,
        holder: formData.holder,
        location: formData.location,
        date: formData.date,
        image: formData.image,
        featured: formData.featured
      };

      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append('data', JSON.stringify(payload));
        uploadForm.append('image', imageFile);
        await apiRequest('/api/records', {
          method: 'POST',
          auth: true,
          body: uploadForm,
          isFormData: true,
        });
      } else {
        await apiRequest('/api/records', { method: 'POST', auth: true, body: payload });
      }

      if (appId) {
        await apiRequest(`/api/applications/${appId}`, {
          method: 'PATCH',
          auth: true,
          body: { status: 'approved' },
        });
      }

      toast({
        title: formMode === 'add' ? 'Рекорд добавлен на сайт' : 'Данные сохранены',
      });
      onClose();
    } catch (err: any) {
      toast({ title: "Ошибка сохранения", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const submitLabel =
    formMode === 'add'
      ? 'Добавить на сайт'
      : formMode === 'approve'
        ? 'Опубликовать рекорд'
        : 'Сохранить изменения';

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <span className="text-sm font-medium">Авто-перевод (Google Translate)</span>
        <Button type="button" size="sm" onClick={handleTranslate} disabled={isTranslating}>
          {isTranslating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Languages className="h-4 w-4 mr-2" />} Перевести
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Название RU</label>
          <Input value={formData.title_ru} onChange={e=>setFormData({...formData, title_ru: e.target.value})} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Название KK</label>
          <Input value={formData.title_kk} onChange={e=>setFormData({...formData, title_kk: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Название EN</label>
          <Input value={formData.title_en} onChange={e=>setFormData({...formData, title_en: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Textarea placeholder="Описание RU" rows={3} value={formData.desc_ru} onChange={e=>setFormData({...formData, desc_ru: e.target.value})} />
        <Textarea placeholder="Описание KK" rows={3} value={formData.desc_kk} onChange={e=>setFormData({...formData, desc_kk: e.target.value})} />
        <Textarea placeholder="Описание EN" rows={3} value={formData.desc_en} onChange={e=>setFormData({...formData, desc_en: e.target.value})} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <Input placeholder="Рекордсмен" value={formData.holder} onChange={e=>setFormData({...formData, holder: e.target.value})} required />
        <Input placeholder="Местоположение" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} />
        <Input type="date" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} required />
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={formData.category} 
          onChange={e=>setFormData({...formData, category: e.target.value})}
        >
          {ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.ru}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Ссылка на фото</label>
          <Input placeholder="https://..." value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Или загрузить фото</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="flex items-center gap-2 h-10 px-3 border rounded-md md:col-span-2">
          <input type="checkbox" checked={formData.featured} onChange={e=>setFormData({...formData, featured: e.target.checked})} />
          <span className="text-sm">Показывать в избранном</span>
        </div>
      </div>

      <Button type="submit" className="w-full h-12 bg-indigo-600 text-white" disabled={isSaving}>
        {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
};

export default Admin;
