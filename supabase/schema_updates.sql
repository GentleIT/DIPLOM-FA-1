-- Таблица для сохранения inline-правок страниц сайта
create table if not exists public.page_content (
  path text primary key,
  html text not null,
  updated_at timestamptz default now()
);

-- Таблица для управления выпусками
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  pdf_url text not null,
  status text not null default 'archive' check (status in ('current', 'archive')),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Включаем RLS
alter table if exists public.page_content enable row level security;
alter table if exists public.issues enable row level security;

-- Политики для page_content
drop policy if exists "page_content_select_all" on public.page_content;
create policy "page_content_select_all"
on public.page_content
for select
to anon, authenticated
using (true);

drop policy if exists "page_content_write_auth" on public.page_content;
create policy "page_content_write_auth"
on public.page_content
for all
to authenticated
using (true)
with check (true);

-- Политики для issues
drop policy if exists "issues_select_all" on public.issues;
create policy "issues_select_all"
on public.issues
for select
to anon, authenticated
using (true);

drop policy if exists "issues_write_auth" on public.issues;
create policy "issues_write_auth"
on public.issues
for all
to authenticated
using (true)
with check (true);

-- Bucket для PDF выпусков (Storage)
insert into storage.buckets (id, name, public)
values ('issues-pdf', 'issues-pdf', true)
on conflict (id) do nothing;

-- Политики Storage для bucket issues-pdf
drop policy if exists "issues_pdf_read_all" on storage.objects;
create policy "issues_pdf_read_all"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'issues-pdf');

drop policy if exists "issues_pdf_write_auth" on storage.objects;
create policy "issues_pdf_write_auth"
on storage.objects
for all
to authenticated
using (bucket_id = 'issues-pdf')
with check (bucket_id = 'issues-pdf');
