-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Creates categories/transactions tables, enables RLS scoped to the logged-in
-- user, seeds the default categories, and imports the August 2026 expense
-- history from "8월 테스트.xlsx" (계좌간 이체 88건은 임포트 대상에서 제외,
-- 무신사 90,805원 중복 로그 1건은 제거하여 34건만 반영).

create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  name text not null,
  color_id text not null,
  icon_id text not null,
  subcategories text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.categories enable row level security;

create policy "Users manage their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  time time not null,
  type text not null check (type in ('expense', 'income')),
  category_key text not null,
  subcategory text,
  amount integer not null,
  memo text,
  note text,
  tags text[] not null default '{}',
  excluded_from_budget boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index transactions_user_date_idx on public.transactions (user_id, date);

-- Default categories (기존 4개 + 이번 임포트로 추가된 서브카테고리 4개:
-- 교통>대리운전, 쇼핑>구독서비스, 기타>통신비, 기타>송금)
insert into public.categories (user_id, key, name, color_id, icon_id, subcategories, sort_order) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'food', '식비', 'orange', 'food', array['카페','배달','외식','마트/장보기','편의점'], 0),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'transport', '교통', 'aqua', 'transport', array['대중교통','주유','주차','택시','대리운전'], 1),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'shopping', '쇼핑', 'magenta', 'shopping', array['의류','생활용품','온라인쇼핑','뷰티','구독서비스'], 2),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'etc', '기타', 'yellow', 'etc', array['여가/취미','병원/의료','경조사','통신비','송금'], 3);

-- August 2026 expense history (34 rows; 계좌간 이체 88건 제외, 중복 1건 제거)
insert into public.transactions (user_id, date, time, type, category_key, subcategory, amount, memo) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-03', '13:46:27', 'expense', 'shopping', '뷰티', 20000, '유호뷰티클래스 상무점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-03', '14:27:26', 'expense', 'food', '마트/장보기', 27730, '주식회사 와이마트물류 본점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-03', '19:20:42', 'expense', 'shopping', '온라인쇼핑', 31300, 'Alipay Plus'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-05', '10:20:31', 'expense', 'food', '편의점', 4500, '씨유(CU)종원팰리스점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-05', '10:44:54', 'expense', 'etc', '병원/의료', 9300, '아이안과의원'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-05', '10:46:42', 'expense', 'etc', '병원/의료', 6700, '금호스타약국'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-12', '13:53:51', 'expense', 'shopping', '온라인쇼핑', 14296, 'ALIPAY CONNECT PTE. LTD'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-12', '16:05:10', 'expense', 'shopping', '온라인쇼핑', 13248, 'ALIPAY CONNECT PTE. LTD'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-14', '19:18:41', 'expense', 'food', '카페', 36400, '파리바게뜨 마재종원점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-15', '02:22:04', 'expense', 'food', '편의점', 8300, '무인지오 무인편의점 금호점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-15', '12:15:02', 'expense', 'etc', '송금', 9000, '송금 내역'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-16', '10:44:34', 'expense', 'transport', '주유', 30000, '서광주역주유소'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-17', '16:26:29', 'expense', 'etc', '송금', 75000, '송금 내역'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-17', '21:28:11', 'expense', 'shopping', '온라인쇼핑', 30685, '주식회사 카카오'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-18', '10:21:38', 'expense', 'shopping', '구독서비스', 31073, 'ANTHROPIC* CLAUDE SUB'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-18', '13:25:55', 'expense', 'food', '편의점', 4500, '씨유(CU)종원팰리스점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-20', '07:11:39', 'expense', 'etc', '통신비', 13900, 'LGUPLUS 통신요금자동이체'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-21', '19:03:44', 'expense', 'shopping', '뷰티', 20000, '유호뷰티클래스 상무점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-22', '20:34:23', 'expense', 'food', '배달', 29000, '요기요'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-24', '23:14:05', 'expense', 'shopping', '온라인쇼핑', 13500, 'KCP(통신판매)'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-24', '23:23:37', 'expense', 'transport', '대리운전', 16000, '주식회사 카카오모빌리티'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-24', '23:25:35', 'expense', 'food', '편의점', 4500, '씨유(CU)종원팰리스점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-25', '12:14:33', 'expense', 'shopping', '생활용품', 5500, '(주)씨앤비 광주지점'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-26', '08:46:28', 'expense', 'food', '배달', 19000, '(주)우아한형제들'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-26', '18:39:41', 'expense', 'transport', '주유', 50000, '돌고개주유소'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-27', '19:03:56', 'expense', 'shopping', '구독서비스', 525, '한국정보인증주식회사'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-29', '14:44:21', 'expense', 'shopping', '구독서비스', 46800, '네이버플러스멤버십'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-29', '14:52:27', 'expense', 'food', '배달', 11000, '요기요'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-29', '14:52:27', 'expense', 'food', '배달', 500, '요기요'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-29', '22:11:24', 'expense', 'shopping', '의류', 90805, '주식회사 무신사페이먼츠'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-30', '01:29:28', 'expense', 'shopping', '온라인쇼핑', 27040, 'ABLY'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-30', '01:43:12', 'expense', 'shopping', '온라인쇼핑', 67200, 'ABLY'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-30', '13:48:45', 'expense', 'food', '배달', 18000, '요기요'),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', '2026-08-30', '13:48:45', 'expense', 'food', '배달', 400, '요기요');
