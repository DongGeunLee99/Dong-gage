-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- 고정지출에 카테고리/상호명을 연결해서 SMS 자동입력과 예산 집계에 자연스럽게
-- 편입되게 한다 (.claude/implementationPlan_categoryFixedExpense.md Phase 2 참고).
--
-- day_of_month는 더 이상 "확정 결제일"이 아니라 알림용 예상일이라 expected_day로
-- 이름을 바꾸고 nullable로 만든다. 계좌이체(월세 등)는 merchant_name을 비워두면
-- SMS 자동매칭을 시도하지 않고 기존처럼 사람이 수동으로 거래를 기록한다
-- (AGENTS.md "지출 입력 경로는 카드 SMS + 수기 입력만" 참고).

alter table public.fixed_expenses
  add column if not exists category_key text,
  add column if not exists subcategory text,
  add column if not exists merchant_name text;

alter table public.fixed_expenses rename column day_of_month to expected_day;
alter table public.fixed_expenses alter column expected_day drop not null;

-- 기존 4개 행 카테고리 채우기 (월세/넷플릭스/헬스장 상호명은 실제 문자 확인 후 앱에서 채워넣기)
update public.fixed_expenses set category_key = 'housing', subcategory = '월세/관리비'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and id = 'rent';
update public.fixed_expenses set category_key = 'housing', subcategory = '통신비', merchant_name = 'LGUPLUS'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and id = 'phone';
update public.fixed_expenses set category_key = 'housing', subcategory = '구독서비스'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and id = 'netflix';
update public.fixed_expenses set category_key = 'health', subcategory = '운동'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and id = 'gym';

alter table public.fixed_expenses alter column category_key set not null;

-- 이번 달 실제로 SMS 매칭됐는지 추적 (고정지출 하나가 달마다 다른 거래에 매칭되므로 별도 테이블)
create table public.fixed_expense_matches (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id text not null references public.fixed_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  year_month text not null, -- 'YYYY-MM'
  matched_transaction_id uuid references public.transactions(id) on delete set null,
  matched_date date not null,
  created_at timestamptz not null default now(),
  unique (fixed_expense_id, year_month)
);

alter table public.fixed_expense_matches enable row level security;

create policy "Users manage their own fixed expense matches"
  on public.fixed_expense_matches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
