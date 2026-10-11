import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'kk' | 'ru' | 'en';

interface Translations {
  [key: string]: {
    kk: string;
    ru: string;
    en: string;
  };
}

const translations: Translations = {
  siteName: {
    kk: 'ҚАЭ',
    ru: 'КИнЭС',
    en: 'KIES',
  },
  siteFullName: {
    kk: 'Қазақстан ақпараттық-энциклопедиялық анықтамалығы',
    ru: 'Казахстанский информационно-энциклопедический справочник',
    en: 'Kazakhstan Information-Encyclopedic Reference',
  },
  home: {
    kk: 'Басты бет',
    ru: 'Главная',
    en: 'Home',
  },
  records: {
    kk: 'Рекордтар',
    ru: 'Рекорды',
    en: 'Records',
  },
  submitRecord: {
    kk: 'Өтінім беру',
    ru: 'Подать заявку',
    en: 'Submit Record',
  },
  admin: {
    kk: 'Әкімші',
    ru: 'Админ',
    en: 'Admin',
  },
  search: {
    kk: 'Іздеу...',
    ru: 'Поиск...',
    en: 'Search...',
  },
  allCategories: {
    kk: 'Барлық санаттар',
    ru: 'Все категории',
    en: 'All Categories',
  },
  geography: {
    kk: 'География',
    ru: 'География',
    en: 'Geography',
  },
  population: {
    kk: 'Халық саны',
    ru: 'Народонаселение',
    en: 'Population',
  },
  economy: {
    kk: 'Экономика және бизнес',
    ru: 'Экономика и бизнес',
    en: 'Economy and Business',
  },
  politics: {
    kk: 'Саясат',
    ru: 'Политика',
    en: 'Politics',
  },
  law: {
    kk: 'Құқық',
    ru: 'Право',
    en: 'Law',
  },
  tourism: {
    kk: 'Туризм',
    ru: 'Туризм',
    en: 'Tourism',
  },
  education: {
    kk: 'Білім',
    ru: 'Образование',
    en: 'Education',
  },
  science: {
    kk: 'Ғылым',
    ru: 'Наука',
    en: 'Science',
  },
  healthcare: {
    kk: 'Денсаулық сақтау',
    ru: 'Здравоохранение',
    en: 'Healthcare',
  },
  culture: {
    kk: 'Мәдениет және өнер',
    ru: 'Культура и искусство',
    en: 'Culture and Arts',
  },
  architecture: {
    kk: 'Сәулет және қала құрылысы',
    ru: 'Архитектура и градостроительство',
    en: 'Architecture and Urban Planning',
  },
  sports: {
    kk: 'Спорт',
    ru: 'Спорт',
    en: 'Sports',
  },
  recordName: {
    kk: 'Рекорд атауы',
    ru: 'Название рекорда',
    en: 'Record Name',
  },
  recordDate: {
    kk: 'Рекорд күні',
    ru: 'Дата рекорда',
    en: 'Record Date',
  },
  category: {
    kk: 'Санат',
    ru: 'Категория',
    en: 'Category',
  },
  description: {
    kk: 'Сипаттама',
    ru: 'Описание',
    en: 'Description',
  },
  image: {
    kk: 'Сурет',
    ru: 'Изображение',
    en: 'Image',
  },
  submit: {
    kk: 'Жіберу',
    ru: 'Отправить',
    en: 'Submit',
  },
  cancel: {
    kk: 'Болдырмау',
    ru: 'Отмена',
    en: 'Cancel',
  },
  applications: {
    kk: 'Өтінімдер',
    ru: 'Заявки',
    en: 'Applications',
  },
  manageRecords: {
    kk: 'Рекордтарды басқару',
    ru: 'Управление рекордами',
    en: 'Manage Records',
  },
  approve: {
    kk: 'Мақұлдау',
    ru: 'Одобрить',
    en: 'Approve',
  },
  reject: {
    kk: 'Қабылдамау',
    ru: 'Отклонить',
    en: 'Reject',
  },
  edit: {
    kk: 'Өңдеу',
    ru: 'Редактировать',
    en: 'Edit',
  },
  delete: {
    kk: 'Жою',
    ru: 'Удалить',
    en: 'Delete',
  },
  aiAssistant: {
    kk: 'AI Көмекші',
    ru: 'AI Ассистент',
    en: 'AI Assistant',
  },
  askQuestion: {
    kk: 'Сұрақ қойыңыз...',
    ru: 'Задайте вопрос...',
    en: 'Ask a question...',
  },
  welcomeMessage: {
    kk: 'Қазақстанның рекордтарына қош келдіңіз!',
    ru: 'Добро пожаловать в мир рекордов Казахстана!',
    en: 'Welcome to the world of Kazakhstan records!',
  },
  discoverRecords: {
    kk: 'Рекордтарды ашыңыз',
    ru: 'Откройте для себя рекорды',
    en: 'Discover Records',
  },
  previousPage: {
    kk: 'Алдыңғы бет',
    ru: 'Предыдущая страница',
    en: 'Previous Page',
  },
  nextPage: {
    kk: 'Келесі бет',
    ru: 'Следующая страница',
    en: 'Next Page',
  },
  status: {
    kk: 'Мәртебесі',
    ru: 'Статус',
    en: 'Status',
  },
  pending: {
    kk: 'Күтуде',
    ru: 'На рассмотрении',
    en: 'Pending',
  },
  approved: {
    kk: 'Мақұлданды',
    ru: 'Одобрено',
    en: 'Approved',
  },
  rejected: {
    kk: 'Қабылданбады',
    ru: 'Отклонено',
    en: 'Rejected',
  },
  holder: {
    kk: 'Рекорд иесі',
    ru: 'Рекордсмен',
    en: 'Record Holder',
  },
  location: {
    kk: 'Орналасқан жері',
    ru: 'Местоположение',
    en: 'Location',
  },
  editorialBoard: {
    kk: 'Редакциялық алқа',
    ru: 'Редакционная коллегия',
    en: 'Editorial Board',
  },
  about: {
    kk: 'Біз туралы',
    ru: 'О нас',
    en: 'About',
  },
  archive: {
    kk: 'Мұрағат',
    ru: 'Архив',
    en: 'Archive',
  },
  currentIssue: {
    kk: 'Ағымдағы шығарылым',
    ru: 'Текущий выпуск',
    en: 'Current Issue',
  },
  recordsOfKazakhstan: {
    kk: 'Қазақстанның рекордтары',
    ru: 'Рекорды Казахстана',
    en: 'Records of Kazakhstan',
  },
  uniqueAchievements: {
    kk: 'Барлық санаттар бойынша бірегей жетістіктер',
    ru: 'Уникальные достижения по всем категориям',
    en: 'Unique achievements across all categories',
  },
  moreDetails: {
    kk: 'Толығырақ',
    ru: 'Подробнее',
    en: 'More Details',
  },
  bookTitle: {
    kk: 'Қазақстан рекордтар кітабы',
    ru: 'Казахстанская книга рекордов',
    en: 'Kazakhstan Book of Records',
  },
  bookDescription1: {
    kk: 'Қазақстан рекордтар кітабы, сонымен қатар Қазақстан Ақпараттық-энциклопедиялық анықтамалығы (ҚАЭ) — адамдардың рекордтық жетістіктері, бірегей табиғи құбылыстар, мәдениет, саясат, сәулет, спорт және Қазақстан Республикасының туризм саласындағы керемет жетістіктер туралы ақпаратты қамтитын анықтамалық.',
    ru: 'Казахстанская книга рекордов, также Казахстанский Информационно-энциклопедический справочник (КИнЭС) — справочник, содержащий информацию о рекордных достижениях людей, уникальных природных явлениях, выдающихся достижениях в культуре, политике, архитектуре, спорте и туризме Республики Казахстан.',
    en: 'Kazakhstan Book of Records, also Kazakhstan Information-Encyclopedic Reference (KIES) — a reference book containing information about record achievements of people, unique natural phenomena, outstanding achievements in culture, politics, architecture, sports and tourism of the Republic of Kazakhstan.',
  },
  bookDescription2: {
    kk: 'Авторлар өз мақсатын алғашқы істерді, әртүрлі қоғамдық құбылыстар мен оқиғалардың пайда болуының бастауын, рекордтарды бекіту, отандастар-қазақстандықтардың жетістіктерін мәңгілікке сақтау деп қойды. Анықтамалықтың негізгі объектілері — Қазақстанның адамдары, оқиғалары және байлықтары. Кітап екі тілде, қазақ және орыс тілдерінде басылады.',
    ru: 'Авторы ставят своей целью фиксировать пионерные дела, истоки становления разнообразных общественных явлений и событий, рекорды, увековечить достижения соотечественников-казахстанцев. Главные объекты справочника — люди, события и богатства Казахстана. Книга издаётся на двух языках, казахском и русском.',
    en: 'The authors set themselves the goal of recording pioneering deeds, the origins of various social phenomena and events, records, to perpetuate the achievements of compatriots-Kazakhstanis. The main objects of the reference book are people, events and riches of Kazakhstan. The book is published in two languages, Kazakh and Russian.',
  },
  bookDescription3: {
    kk: 'Осы тарихи кезеңде Қазақстан рекордтар кітабы Қазақстан Республикасындағы рекордтық жетістіктер туралы ең беделді энциклопедиялық басылымдардың бірі болып табылады.',
    ru: 'На данном исторически этапе, Казахстанская книга рекордов является одним из наиболее авторитетных энциклопедических изданий о рекордных достижениях в Республике Казахстан.',
    en: 'At this historical stage, the Kazakhstan Book of Records is one of the most authoritative encyclopedic publications about record achievements in the Republic of Kazakhstan.',
  },
  history: {
    kk: 'Тарих',
    ru: 'История',
    en: 'History',
  },
  historyText1: {
    kk: 'Алғаш рет 1999 жылы «Туран» университетінің қызметкерлерінің авторлық ұжымымен жарияланды. Идея «Туран» университетінің бірінші проректоры Қуаныш Тазабековке тиесілі. Жиырма жыл бұрын қазақстандықтардың өзіндік жетістіктерін кішкентай кітапшаға жазу идеясы пайда болды. Жылдар өткен соң бұл еңбек күрделі ақпараттық-энциклопедиялық анықтамалыққа — ҚАЭ-ға айналды.',
    ru: 'Впервые опубликована в 1999 году авторским коллективом сотрудников Университета «Туран». Идея принадлежала первому проректору университета «Туран» Куанышу Тазабекову. Двадцать лет назад возникла идея записать в небольшую книжку единственные в своем роде достижения казахстанцев. Спустя годы этот труд вырос до солидного информационно-энциклопедического справочника — КИнЭС.',
    en: 'First published in 1999 by the author team of Turan University staff. The idea belonged to the first vice-rector of Turan University Kuanysh Tazabekov. Twenty years ago, the idea arose to record the unique achievements of Kazakhstanis in a small book. Over the years, this work has grown into a solid information-encyclopedic reference book — KIES.',
  },
  historyText2: {
    kk: 'Қазақстан рекордтар кітабының беттерінде барлық жастағы қазақстандықтардың бірегей нәтижелері сипатталған: кейбіреулер 72 сағат ұйықтамады және алып шарф тоқыды, екіншісі барлығынан көбірек ауыр гиряны бір саусақпен көтерді, ал үшіншісі қолдарымен табақ арқылы шегелерді қақты. 2018 жылғы басылымда 600 беттен астам бетте 1600-ден астам факт тіркелген.',
    ru: 'На страницах Казахстанской книги рекордов описаны уникальные результаты казахстанцев всех возрастов: кто-то не спал 72 часа и связал гигантский шарф, другой поднял больше всех тяжеленную гирю одним пальцем, а третий забил гвозди голыми руками через сковородку. В издании 2018 года зафиксированно свыше 1 600 фактов на более чем 600 страницах.',
    en: 'The pages of the Kazakhstan Book of Records describe unique results of Kazakhstanis of all ages: someone did not sleep for 72 hours and knitted a giant scarf, another lifted the heaviest weight with one finger, and a third hammered nails with bare hands through a frying pan. The 2018 edition recorded over 1,600 facts on more than 600 pages.',
  },
  historyText3: {
    kk: 'Басылым жиілігі жыл сайын емес. Әдетте анықтамалықтың жаңартулары әр 2-4 жылда бір рет жарияланады. Рекордтарды тіркеу міндеті Рекордтарды тіркеу департаментінің директоры Бақытжан Тастулековтың мойнына жүктелген. Ол және құрамында шамамен 18 адамнан тұратын редакциялық алқа келесі басылымда ҚАЭ беттерін безендіре алатын фактілерді жинайды.',
    ru: 'Периодичность издания не ежегодная. Как правило обновления справочника публикуются каждые 2–4 года. Задача фиксировать уникумов лежит на плечах директора Департамента регистрации рекордов Бахытжана Тастулекова. Он и редакционная коллегия, в составе которой порядка 18 человек, собирают факты, способные украсить страницы КИнЭС при очередном издании.',
    en: 'The publication frequency is not annual. As a rule, updates to the reference book are published every 2-4 years. The task of recording unique people lies on the shoulders of the director of the Department of Record Registration Bakhtzhan Tastulekov. He and the editorial board, which consists of about 18 people, collect facts that can decorate the pages of KIES in the next edition.',
  },
  historyText4: {
    kk: 'Бақытжан Тастулековтың айтуы бойынша ҚАЭ мен Гиннесс рекордтар кітабының негізгі айырмашылығы мынада: мұнда абсурдты немесе денсаулыққа зиянды рекордтар тіркелмейді.',
    ru: 'По словам Бахытжана Тастулекова основное отличие КИнЭС от Книги рекордов Гиннесса в том, что здесь не фиксируются абсурдные или вредные для здоровья рекорды.',
    en: 'According to Bakhtzhan Tastulekov, the main difference between KIES and the Guinness Book of Records is that absurd or health-harming records are not recorded here.',
  },
  mainSections: {
    kk: 'Кітаптың негізгі бөлімдері',
    ru: 'Основные разделы Книги',
    en: 'Main Sections of the Book',
  },
  mainSectionsText: {
    kk: 'Тіркелетін рекордтар негізгі бөлімдерге кіретін санаттар бойынша бөлінеді. Бөлімдердің әрқайсысы тек бөлім тақырыбында аталған тақырыптың рекордтарын бекітеді. Кітапта барлығы 12 бөлім бар:',
    ru: 'Регистрируемые рекорды распределены по категориям, входящим в основные разделы. Каждый из разделов фиксирует рекорды только названной в заглавии раздела тематики. Всего в Книге 12 разделов:',
    en: 'Registered records are distributed by categories included in the main sections. Each section records records only of the topic named in the section title. There are 12 sections in total in the Book:',
  },
  slide1Title: {
    kk: 'Қазақстан тарихындағы ең жаңбырлы күн 2003 жылдың 12 шілдесі болып саналады.',
    ru: 'Самым дождливым днем в истории Казахстана считается 12 июля 2003г.',
    en: 'The rainiest day in Kazakhstan\'s history is considered July 12, 2003.',
  },
  slide1Desc: {
    kk: 'Алматы облысындағы Алғазы аралында бірден 106,1 миллиметр жауын-шашын түсті.',
    ru: 'На острове Алгазы в Алматинской области выпало сразу 106,1 миллиметра осадков.',
    en: 'On Algazy Island in Almaty Region, 106.1 millimeters of precipitation fell at once.',
  },
  slide2Title: {
    kk: '1897 жылы Қазақстанның ең ірі қаласы Орал қаласы болды',
    ru: 'Самым крупным городом Казахстана в 1897 г. был город Уральск',
    en: 'The largest city in Kazakhstan in 1897 was the city of Uralsk',
  },
  slide2Desc: {
    kk: '1897 жылы Оралда 36,4 мың адам тұрды.',
    ru: 'В 1897 году в Уральске проживало 36,4 тыс. человек.',
    en: 'In 1897, 36.4 thousand people lived in Uralsk.',
  },
  slide3Title: {
    kk: 'ТМД-да аналогы жоқ шлакты өңдеу кешені',
    ru: 'Комплекс по переработке шлака, не имеющий аналогов в СНГ',
    en: 'Slag processing complex with no analogues in the CIS',
  },
  slide3Desc: {
    kk: 'Ақсу ферроқорытпалар зауытында жұмыс істейді.',
    ru: 'Действует на Аксуском заводе ферросплавов.',
    en: 'Operates at the Aksu Ferroalloy Plant.',
  },
  slide4Title: {
    kk: 'Алғашқы жастар ұйымы «Жас Қазақ» социал-демократиялық бағытта',
    ru: 'Первая молодежная организация социал-демократического направления «Жас Қазақ»',
    en: 'First youth organization of social-democratic direction «Zhas Qazaq»',
  },
  slide4Desc: {
    kk: '1917 жылғы Ақпан төңкерісінен кейін Ақмолада құрылды.',
    ru: 'Была создана после Февральской революции 1917 г. в Акмоле.',
    en: 'Was created after the February Revolution of 1917 in Akmola.',
  },
  slide5Title: {
    kk: '2024 жылдың 1 қаңтарынан бастап жеке кәсіпкерлер үшін міндеттеме пайда болды',
    ru: 'С 1 января 2024 г. у бездействующих индивидуальных предпринимателей возникло обязательство',
    en: 'From January 1, 2024, inactive individual entrepreneurs have an obligation',
  },
  slide5Desc: {
    kk: 'Жалпы декларациялау бойынша жаңа салық есебі беру (250.00 нысаны).',
    ru: 'По предоставлению новой налоговой отчетности по всеобщему декларированию (форма 250.00).',
    en: 'To provide new tax reporting on general declaration (form 250.00).',
  },
  slide6Title: {
    kk: 'Қазақстандағы алғашқы туристер жиналысы',
    ru: 'Первый в Казахстане слет туристов',
    en: 'First tourist gathering in Kazakhstan',
  },
  slide6Desc: {
    kk: '1938 жылы Алма-Ата қаласының маңындағы Көк-жайлау таулы үстіртінде өтті. Онда шамамен 200 адам қатысты.',
    ru: 'Состоялся в 1938г. на плато Кок-жайляу в окрестностях г. Алма-Аты. В нем приняли участие около 200 человек.',
    en: 'Took place in 1938 on the Kok-Zhaylau plateau near Almaty. About 200 people participated.',
  },
  slide7Title: {
    kk: 'Ең алғашқы ежелгі педагогикалық еңбек — қазақ зерттеушісі Юсуф Баласағұнидің кітабы',
    ru: 'Самым первым древним педагогическим трудом является книга казахского исследователя Юсуфа Баласагуни',
    en: 'The very first ancient pedagogical work is the book by Kazakh researcher Yusuf Balasaguni',
  },
  slide7Desc: {
    kk: '«Құтадғу біліг» (XI ғ.).',
    ru: '«Кутадгу билиг» (XI в.).',
    en: '\"Kutadgu Bilig\" (11th century).',
  },
  slide8Title: {
    kk: 'Өмірбек Оспанов (1906–1993)',
    ru: 'Умирбек Успанов (1906–1993)',
    en: 'Umirbek Uspanov (1906–1993)',
  },
  slide8Desc: {
    kk: 'Қазақстандағы топырақтану ғылымының негізін қалаушы.',
    ru: 'Основоположник науки почвоведения в Казахстане.',
    en: 'Founder of soil science in Kazakhstan.',
  },
  slide9Title: {
    kk: 'Қазақстандағы алғашқы тіс емдеу кабинеті',
    ru: 'Первый в Казахстане зубоврачебный кабинет',
    en: 'First dental office in Kazakhstan',
  },
  slide9Desc: {
    kk: '1897 жылы ашылды.',
    ru: 'Был открыт в 1897 г.',
    en: 'Was opened in 1897.',
  },
  slide10Title: {
    kk: 'Қазақстанның алғашқы әйел-кәсіби жазушысы',
    ru: 'Первая женщина-профессиональный писатель Казахстана',
    en: 'First female professional writer of Kazakhstan',
  },
  slide10Desc: {
    kk: 'Мәриям Хакимжанова (1906–1995).',
    ru: 'Мариям Хакимжанова (1906–1995).',
    en: 'Mariyam Khakimzhanova (1906–1995).',
  },
  slide11Title: {
    kk: 'Айша бибі кесенесі',
    ru: 'Мавзолей Айша биби',
    en: 'Mausoleum of Aisha Bibi',
  },
  slide11Desc: {
    kk: 'XI–XII ғасырлардағы ең танымал сәулет ескерткіштерінің бірі.',
    ru: 'Один из самых известных памятников архитектуры XI–XII вв.',
    en: 'One of the most famous architectural monuments of the 11th–12th centuries.',
  },
  slide12Title: {
    kk: 'Евгений Кадяйкин',
    ru: 'Евгений Кадяйкин',
    en: 'Yevgeny Kadyaykin',
  },
  slide12Desc: {
    kk: 'Жеңіл атлет, Қазақстанның алғашқы олимпиадалық спортшысы.',
    ru: 'Легкоатлет, первый казахстанский олимпиец.',
    en: 'Track and field athlete, first Kazakhstani Olympian.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
