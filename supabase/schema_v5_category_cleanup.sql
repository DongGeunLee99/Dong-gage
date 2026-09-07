-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- 카테고리 정리 (.claude/categoryRestructure.md 참고):
--   1) 기타 소분류 비우기 (전용 카테고리와 겹치던 것들)
--   2) 구독서비스: 쇼핑 → 주거·통신으로 이동
--   3) 식비에서 카페 분리, 새 카테고리로 독립 (소분류: 일반카페/디저트카페/빵집·베이커리)
-- 코드 변경은 색상/아이콘 placeholder(brown/EtcIcon)만 있고 나머지는 이 SQL로 끝난다.

-- 0) 실행 전 확인 권장 — 아래 SELECT로 "기타"에 재분류가 필요한 거래가 남아있는지 먼저 본다.
-- select id, date, memo, subcategory from public.transactions
--   where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and category_key = 'etc';
-- 여가/취미·병원/의료·경조사·통신비·송금 중 하나가 나오면 이 파일 실행 전에 먼저 옮긴다:
-- update public.transactions set category_key = 'leisure', subcategory = '취미'  where id = '...';
-- update public.transactions set category_key = 'health',  subcategory = '병원'  where id = '...'; -- 또는 '약국'
-- update public.transactions set category_key = 'events',  subcategory = '경조사' where id = '...';
-- update public.transactions set category_key = 'housing', subcategory = '통신비' where id = '...';
-- update public.transactions set category_key = 'finance', subcategory = '송금'  where id = '...';

-- 1) 기타 소분류 비우기
update public.categories set subcategories = '{}'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'etc';

-- 2) 구독서비스 이동 (쇼핑 → 주거·통신)
update public.categories set subcategories = array['의류','생활용품','온라인쇼핑','뷰티']
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'shopping';
update public.categories set subcategories = array['월세/관리비','공과금','통신비','구독서비스']
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'housing';
update public.transactions set category_key = 'housing', subcategory = '구독서비스'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and category_key = 'shopping' and subcategory = '구독서비스';

-- 3) 카페 분리
update public.categories set subcategories = array['배달','외식','마트/장보기','편의점']
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'food';

insert into public.categories (user_id, key, name, color_id, icon_id, subcategories, sort_order) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'cafe', '카페', 'brown', 'cafe', array['일반카페','디저트카페','빵집/베이커리'], 9);

-- 기존 식비>카페 거래는 전부 카페>일반카페로 옮김(과거 데이터엔 일반/디저트 구분이 없었음).
-- 디저트카페·빵집이었던 특정 건은 옮긴 뒤 앱에서 수동으로 소분류만 바꿔주면 됨.
update public.transactions set category_key = 'cafe', subcategory = '일반카페'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and category_key = 'food' and subcategory = '카페';
