export interface Record {
  id: string;
  title: {
    kk: string;
    ru: string;
    en: string;
  };
  description: {
    kk: string;
    ru: string;
    en: string;
  };
  category: string;
  date: string;
  holder: string;
  location: string;
  image: string;
  featured?: boolean;
}

export interface Application {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  holder: string;
  location: string;
  image: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submitterEmail: string;
}

export const categories = [
  { id: 'geography', labelKey: 'geography', icon: '🌍' },
  { id: 'population', labelKey: 'population', icon: '👥' },
  { id: 'economy', labelKey: 'economy', icon: '💼' },
  { id: 'politics', labelKey: 'politics', icon: '🏛️' },
  { id: 'law', labelKey: 'law', icon: '⚖️' },
  { id: 'tourism', labelKey: 'tourism', icon: '✈️' },
  { id: 'education', labelKey: 'education', icon: '🎓' },
  { id: 'science', labelKey: 'science', icon: '🔬' },
  { id: 'healthcare', labelKey: 'healthcare', icon: '🏥' },
  { id: 'culture', labelKey: 'culture', icon: '🎭' },
  { id: 'architecture', labelKey: 'architecture', icon: '🏗️' },
  { id: 'sports', labelKey: 'sports', icon: '🏆' },
];

export const mockRecords: Record[] = [
  {
    id: '1',
    title: {
      kk: 'Ең биік тау - Хан-Тәңірі',
      ru: 'Самая высокая гора - Хан-Тенгри',
      en: 'Highest Mountain - Khan Tengri',
    },
    description: {
      kk: 'Хан-Тәңірі - Тянь-Шань тауларындағы ең әсем және биік шыңдардың бірі, биіктігі 7010 метр.',
      ru: 'Хан-Тенгри - одна из красивейших и высочайших вершин Тянь-Шаня, высота 7010 метров.',
      en: 'Khan Tengri - one of the most beautiful and highest peaks of Tian Shan, height 7010 meters.',
    },
    category: 'geography',
    date: '1931-08-11',
    holder: 'Природа Казахстана',
    location: 'Алматинская область',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    featured: true,
  },
  {
    id: '2',
    title: {
      kk: 'Ғарышқа ұшқан алғашқы қазақстандық',
      ru: 'Первый казахстанский космонавт',
      en: 'First Kazakhstani Cosmonaut',
    },
    description: {
      kk: 'Тоқтар Әубәкіров - ғарышқа ұшқан алғашқы қазақстандық, 1991 жылы 2 қазанда.',
      ru: 'Токтар Аубакиров - первый казахстанец в космосе, полетел 2 октября 1991 года.',
      en: 'Toktar Aubakirov - first Kazakhstani in space, flew on October 2, 1991.',
    },
    category: 'science',
    date: '1991-10-02',
    holder: 'Тоқтар Әубәкіров',
    location: 'Байконыр',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
    featured: true,
  },
  {
    id: '3',
    title: {
      kk: 'Олимпиада чемпионы - Бекзат Саттарханов',
      ru: 'Олимпийский чемпион - Бекзат Саттарханов',
      en: 'Olympic Champion - Bekzat Sattarkhanov',
    },
    description: {
      kk: '2000 жылы Сидней олимпиадасында бокстан алтын медаль иеленді.',
      ru: 'Завоевал золотую медаль по боксу на Олимпиаде в Сиднее 2000 года.',
      en: 'Won gold medal in boxing at the Sydney 2000 Olympics.',
    },
    category: 'sports',
    date: '2000-09-30',
    holder: 'Бекзат Саттарханов',
    location: 'Сидней, Австралия',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
  },
  {
    id: '4',
    title: {
      kk: 'Ең үлкен көл - Каспий теңізі',
      ru: 'Крупнейшее озеро - Каспийское море',
      en: 'Largest Lake - Caspian Sea',
    },
    description: {
      kk: 'Каспий теңізі - әлемдегі ең үлкен тұйық су қоймасы.',
      ru: 'Каспийское море - крупнейший замкнутый водоём в мире.',
      en: 'The Caspian Sea is the largest enclosed body of water in the world.',
    },
    category: 'geography',
    date: '2024-01-01',
    holder: 'Природа Казахстана',
    location: 'Западный Казахстан',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
  {
    id: '5',
    title: {
      kk: 'ЭКСПО-2017 көрмесі',
      ru: 'Выставка ЭКСПО-2017',
      en: 'EXPO 2017 Exhibition',
    },
    description: {
      kk: 'Астанада өткен халықаралық ЭКСПО көрмесі - Орталық Азиядағы алғашқы дүниежүзілік көрме.',
      ru: 'Международная выставка ЭКСПО в Астане - первая всемирная выставка в Центральной Азии.',
      en: 'International EXPO exhibition in Astana - first World Expo in Central Asia.',
    },
    category: 'architecture',
    date: '2017-06-10',
    holder: 'Казахстан',
    location: 'Астана',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    featured: true,
  },
  // Дополнительные примеры записей, чтобы каждая категория была представлена хотя бы одним рекордом
  {
    id: '6',
    title: {
      kk: 'Қазақстанның ең үлкен аймағы',
      ru: 'Крупнейший регион Казахстана',
      en: 'Largest Region of Kazakhstan',
    },
    description: {
      kk: 'Маңғыстау және Атырау облыстары ерекше табиғи байлықтарымен ерекшеленеді.',
      ru: 'Мангистауская и Атырауская области выделяются своими уникальными природными ресурсами.',
      en: 'Mangystau and Atyrau regions stand out with their unique natural resources.',
    },
    category: 'population',
    date: '2020-01-01',
    holder: 'Статистический комитет РК',
    location: 'Западный Казахстан',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db511aa?w=800',
  },
  {
    id: '7',
    title: {
      kk: 'Ең ірі инвестициялық жоба',
      ru: 'Крупнейший инвестиционный проект',
      en: 'Largest Investment Project',
    },
    description: {
      kk: 'Қазақстанда іске асқан ірі инфрақұрылымдық жобалар экономиканың дамуына серпін берді.',
      ru: 'Крупные инфраструктурные проекты в Казахстане дали мощный импульс развитию экономики.',
      en: 'Major infrastructure projects in Kazakhstan have boosted economic development.',
    },
    category: 'economy',
    date: '2019-05-20',
    holder: 'Министерство экономики РК',
    location: 'Астана',
    image: 'https://images.unsplash.com/photo-1581091870622-7c2dfcd212d0?w=800',
  },
  {
    id: '8',
    title: {
      kk: 'Ең ұзақ парламенттік сессия',
      ru: 'Самая продолжительная парламентская сессия',
      en: 'Longest Parliamentary Session',
    },
    description: {
      kk: 'Қазақстан Парламентінің рекордтық ұзақ сессиясы бірқатар маңызды реформалармен есте қалды.',
      ru: 'Рекордно долгая сессия Парламента Казахстана запомнилась рядом важных реформ.',
      en: 'A record-long session of the Parliament of Kazakhstan was marked by key reforms.',
    },
    category: 'politics',
    date: '2018-11-10',
    holder: 'Парламент Республики Казахстан',
    location: 'Астана',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  },
  {
    id: '9',
    title: {
      kk: 'Ең ірі құқықтық реформа',
      ru: 'Крупнейшая правовая реформа',
      en: 'Largest Legal Reform',
    },
    description: {
      kk: 'Қазақстандағы құқықтық жүйені жаңғыртуға бағытталған ауқымды реформа.',
      ru: 'Масштабная реформа, направленная на модернизацию правовой системы Казахстана.',
      en: 'A large-scale reform aimed at modernizing Kazakhstan’s legal system.',
    },
    category: 'law',
    date: '2015-07-01',
    holder: 'Министерство юстиции РК',
    location: 'Қазақстан',
    image: 'https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?w=800',
  },
  {
    id: '10',
    title: {
      kk: 'Теңіз жағалауындағы ең ұзын жаяу жүргіншілер аймағы',
      ru: 'Самая длинная пешеходная набережная',
      en: 'Longest Pedestrian Seafront',
    },
    description: {
      kk: 'Каспий теңізі жағалауындағы жаяу жүргіншілер аймағы туристер арасында танымал.',
      ru: 'Пешеходная набережная на берегу Каспийского моря популярна среди туристов.',
      en: 'The pedestrian seafront on the Caspian Sea coast is popular among tourists.',
    },
    category: 'tourism',
    date: '2021-06-15',
    holder: 'Туристический центр Актау',
    location: 'Ақтау',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
  },
  {
    id: '11',
    title: {
      kk: 'Ең ірі университет кампусы',
      ru: 'Крупнейший университетский кампус',
      en: 'Largest University Campus',
    },
    description: {
      kk: 'Қазақстандағы университет кампусы ауданы мен студенттер саны бойынша рекорд орнатты.',
      ru: 'Университетский кампус в Казахстане установил рекорд по площади и количеству студентов.',
      en: 'A university campus in Kazakhstan set a record in area and number of students.',
    },
    category: 'education',
    date: '2016-09-01',
    holder: 'Университет Казахстана',
    location: 'Алматы',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
  },
  {
    id: '12',
    title: {
      kk: 'Ең ірі медициналық орталық',
      ru: 'Крупнейший медицинский центр',
      en: 'Largest Medical Center',
    },
    description: {
      kk: 'Көпсалалы медициналық орталық бір күнде ең көп науқасты қабылдау рекордын орнатты.',
      ru: 'Многопрофильный медицинский центр установил рекорд по количеству пациентов в день.',
      en: 'A multidisciplinary medical center set a record for patients served per day.',
    },
    category: 'healthcare',
    date: '2022-03-10',
    holder: 'Республикалық медициналық орталық',
    location: 'Астана',
    image: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800',
  },
];

export const mockApplications: Application[] = [
  {
    id: 'app1',
    title: 'Самый длинный национальный флаг',
    description: 'Флаг Казахстана длиной 1000 метров был развернут в Алматы.',
    category: 'culture',
    date: '2024-12-01',
    holder: 'Патриоты Казахстана',
    location: 'Алматы',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    status: 'pending',
    submittedAt: '2024-01-15',
    submitterEmail: 'patriot@example.com',
  },
  {
    id: 'app2',
    title: 'Рекорд по шахматам',
    description: 'Одновременная игра на 100 досках.',
    category: 'sports',
    date: '2024-11-20',
    holder: 'Дархан Жумабеков',
    location: 'Нур-Султан',
    image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
    status: 'pending',
    submittedAt: '2024-01-14',
    submitterEmail: 'chess@example.com',
  },
];
