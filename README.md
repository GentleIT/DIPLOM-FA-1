# KINES (SQLite version)

## Что изменено

Проект мигрирован с Supabase на локальный backend + SQLite:

- API: `server/index.js` (Express)
- БД: `data/database.sqlite`
- Файлы загрузок: `public/uploads/`
- Авторизация админа: JWT (`/api/auth/*`)

Базу можно открывать в DB Browser for SQLite.

## Быстрый старт

1. Установить зависимости:
```sh
npm i
```
2. Настроить `.env`:
```env
PORT=3001
JWT_SECRET=replace-this-with-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin12345
```
3. Запустить API:
```sh
npm run dev:api
```
4. В отдельном терминале запустить фронтенд:
```sh
npm run dev
```

## Стартовый сид

Чтобы сразу заполнить проект стартовыми данными, выполните:
```sh
npm run seed
```

Скрипт добавляет:
- 1 admin (если еще нет);
- 1 current issue (если еще нет);
- 3 demo records (добавляет только отсутствующие).

## Ограничение размера файлов

Лимиты задаются в `.env`:
```env
MAX_IMAGE_UPLOAD_MB=10
MAX_PDF_UPLOAD_MB=200
```

При превышении лимита API вернет `413 File is too large`.

## Перенос и передача проекта

Для переноса достаточно передать:
- исходники проекта;
- `data/database.sqlite`;
- папку `public/uploads/`.

## Миграция данных из Supabase

1. В `.env` добавьте креды Supabase (на время миграции):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
Можно использовать `SUPABASE_ANON_KEY`, но лучше `SERVICE_ROLE_KEY`, чтобы не упереться в RLS.

2. Запустите миграцию:
```sh
npm run migrate:supabase
```

Что переносится:
- таблицы `records`, `applications`, `issues`, `page_content`;
- публичные файлы по URL (изображения и PDF) по возможности скачиваются в `public/uploads/`, а ссылки переписываются на локальные.
