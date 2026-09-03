-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- 문자(SMS) 자동입력 파이프라인용 스키마.
--   1) transactions에 검토 상태/출처/원본 문자 컬럼 추가
--   2) iOS 단축어가 쓸 인제스트 토큰 테이블 추가
-- 기존 행은 전부 status='confirmed', source='manual'로 남는다.

alter table public.transactions
  add column if not exists status text not null default 'confirmed'
    check (status in ('confirmed', 'pending_review')),
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'sms')),
  add column if not exists raw_message text;

create index if not exists transactions_user_status_idx
  on public.transactions (user_id, status);

-- iOS 단축어는 로그인 세션이 없어서 JWT를 못 만든다. 앱에서 발급한 이 토큰을
-- 헤더에 실어 보내면 Edge Function이 service_role로 user_id를 찾아 대신 저장한다.
-- 토큰은 DB에서 만든다(pgcrypto). 앱은 user_id만 넣고 생성된 값을 돌려받는다.
create table if not exists public.sms_ingest_tokens (
  token text primary key default encode(gen_random_bytes(24), 'hex'),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- create table if not exists는 테이블이 이미 있으면 통째로 건너뛴다. 먼저 만들어둔
-- 테이블에는 위 default가 안 붙으므로 여기서 다시 보장한다(재실행해도 안전).
alter table public.sms_ingest_tokens
  alter column token set default encode(gen_random_bytes(24), 'hex');

alter table public.sms_ingest_tokens enable row level security;

-- 앱(로그인 사용자)은 자기 토큰만 보고 지운다. Edge Function은 service_role로
-- 접근하므로 이 정책을 우회한다.
create policy "Users manage their own ingest tokens"
  on public.sms_ingest_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
