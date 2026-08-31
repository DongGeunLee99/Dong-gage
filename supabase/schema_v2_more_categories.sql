-- Run this after schema.sql, once, in the Supabase SQL Editor.
-- Adds 5 new top-level categories (주거·통신/건강/여가·문화/경조사·비정기/금융)
-- and reclassifies the 5 August transactions that were parked under "기타"
-- pending these categories existing.

insert into public.categories (user_id, key, name, color_id, icon_id, subcategories, sort_order) values
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'housing', '주거·통신', 'blue', 'housing', array['월세/관리비','공과금','통신비'], 4),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'health', '건강', 'teal', 'health', array['병원','약국','운동','건강검진'], 5),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'leisure', '여가·문화', 'purple', 'leisure', array['취미','여행','모임/약속','문화생활'], 6),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'events', '경조사·비정기', 'olive', 'events', array['경조사','세금/과태료','선물','수리비'], 7),
  ('58a8f8f6-797b-46a1-ad70-79543353cd6c', 'finance', '금융', 'navy', 'finance', array['송금','이자','보험','카드연회비'], 8);

-- 의료/건강 (약국·안과) 2건: 기타 > 병원/의료 → 건강 > 병원 or 약국
update public.transactions set category_key = 'health', subcategory = '약국'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and memo = '금호스타약국';
update public.transactions set category_key = 'health', subcategory = '병원'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and memo = '아이안과의원';

-- 주거/통신 (휴대폰) 1건: 기타 > 통신비 → 주거·통신 > 통신비
update public.transactions set category_key = 'housing', subcategory = '통신비'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and memo = 'LGUPLUS 통신요금자동이체';

-- 금융/은행 (송금 내역) 2건: 기타 > 송금 → 금융 > 송금
update public.transactions set category_key = 'finance', subcategory = '송금'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and memo = '송금 내역';
