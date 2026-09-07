-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- budgets/fixed-expenses를 로컬 메모리 상태에서 Supabase로 이전한다.
-- 기존 코드에 하드코딩되어 있던 기본값을 그대로 시드해서, 이전 직후에도
-- 사용자가 이전에 봤던 예산/고정지출 값이 그대로 보이게 한다.

create table public.budgets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  overall_budget integer not null default 0
);

alter table public.budgets enable row level security;

create policy "Users manage their own budget"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.category_budgets (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_key text not null,
  amount integer not null,
  primary key (user_id, category_key)
);

alter table public.category_budgets enable row level security;

create policy "Users manage their own category budgets"
  on public.category_budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.fixed_expenses (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount integer not null,
  day_of_month integer not null,
  is_on boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.fixed_expenses enable row level security;

create policy "Users manage their own fixed expenses"
  on public.fixed_expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 기존 하드코딩 기본값 시드 (budgetsContext.tsx / fixedExpensesContext.tsx 참고)
insert into public.budgets (user_id, overall_budget) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 1000000);

insert into public.category_budgets (user_id, category_key, amount) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'food', 800000),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'transport', 200000);

insert into public.fixed_expenses (id, user_id, name, amount, day_of_month, is_on, sort_order) values
  ('rent', '58a8f8f6-797b-46a1-ad70-79543353cd6c', '월세', 700000, 25, true, 0),
  ('phone', '58a8f8f6-797b-46a1-ad70-79543353cd6c', '통신비', 55000, 25, true, 1),
  ('netflix', '58a8f8f6-797b-46a1-ad70-79543353cd6c', '넷플릭스 구독', 13500, 5, true, 2),
  ('gym', '58a8f8f6-797b-46a1-ad70-79543353cd6c', '헬스장', 89000, 1, false, 3);
