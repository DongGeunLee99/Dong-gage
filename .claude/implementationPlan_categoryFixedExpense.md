# 카테고리 정리 + 고정지출/예산 재설계 — 전체 실행 계획표

> `categoryRestructure.md`(카테고리 중복 정리)와 `개인첨부/고정지출_예산_재설계안.md`(고정지출 재설계)를 합쳐서 진행 순서와 각 단계에서 뭘 바꾸는지 정리. 둘 다 진행하기로 확정.

## 로드맵

| Phase | 내용 | 의존관계 | 시작 가능 여부 |
| --- | --- | --- | --- |
| 1 | 카테고리 정리 (기타 소분류 비우기, 구독서비스 이동) | 없음 | **바로 가능** — SQL만, 코드 변경 없음 |
| 1b | 식비>카페 분리 | 카페 아이콘(Figma) | **결정 대기** — 진행 여부 + 아이콘 |
| 2 | 고정지출 스키마 재설계 (카테고리/상호명 연결) | Phase 1 완료 권장 | 결정 대기 (아래 확인사항 2개) |
| 3 | 소분류 "상세" 계층 + SMS 매칭 엔진 확장 | Phase 2 | Phase 2 이후 |
| 4 | 예산 설정 화면에 고정지출 편입 (카테고리>소분류>체크박스) | Phase 2, 3 | Phase 3 이후 |

**왜 이 순서인가**: 상세 계층(3)이 고정지출(2)의 매칭 로직을 그대로 확장한 버전이라 매칭 엔진을 한 번만 만들면 됨. 예산 UI 통합(4)은 2·3이 끝나 "고정지출에 카테고리가 있다"는 전제가 성립해야 의미가 생김.

---

## Phase 1 — 카테고리 정리 (지금 바로 실행 가능)

**변경 내용**
1. 기타(etc) 소분류 전부 비움
2. 쇼핑>구독서비스 → 주거·통신>구독서비스로 이동, 기존 거래 재분류

**코드 변경 없음** — 카테고리는 이미 Supabase에서 동적으로 불러오므로 SQL 한 번으로 끝남.

**실행 전 확인 필요**: 스키마 v2가 8월 데이터를 이미 재분류해놨지만, 그 이후(9월 SMS 자동입력 등)로 `category_key='etc'`인 거래가 새로 생겼을 수 있음 — 이 파일 맨 위 SELECT로 먼저 확인 후 실행 권장.

```sql
-- supabase/schema_v5_category_cleanup.sql (실행 전 아래 SELECT로 먼저 확인)

-- 1) 확인: 기타로 분류된 거래 중 재분류가 필요한 게 있는지
-- select id, date, memo, subcategory from transactions
--   where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and category_key = 'etc';
-- → 여가/취미·병원/의료·경조사·통신비·송금 중 하나라도 나오면 아래처럼 먼저 옮긴다:
-- update transactions set category_key = 'leisure', subcategory = '취미' where id = '...';
-- update transactions set category_key = 'health',  subcategory = '병원' where id = '...'; -- 또는 '약국'
-- update transactions set category_key = 'events',  subcategory = '경조사' where id = '...';
-- update transactions set category_key = 'housing', subcategory = '통신비' where id = '...';
-- update transactions set category_key = 'finance', subcategory = '송금' where id = '...';

-- 2) 기타 소분류 비우기
update public.categories set subcategories = '{}'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'etc';

-- 3) 구독서비스 이동
update public.categories set subcategories = array['의류','생활용품','온라인쇼핑','뷰티']
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'shopping';
update public.categories set subcategories = array['월세/관리비','공과금','통신비','구독서비스']
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and key = 'housing';
update public.transactions set category_key = 'housing', subcategory = '구독서비스'
  where user_id = '58a8f8f6-797b-46a1-ad70-79543353cd6c' and category_key = 'shopping' and subcategory = '구독서비스';
```

**검증**: SQL 실행 후 앱 재시작 → 관리 탭에서 기타 카테고리 소분류가 비어있는지, 주거·통신에 구독서비스가 있는지, 기존 구독서비스 거래 3건이 주거·통신으로 옮겨졌는지 확인.

---

## Phase 1b — 식비>카페 분리 — **완료 (SQL 실행만 남음)**

소분류 3개(일반카페/디저트카페/빵집·베이커리)로 확정, 코드 변경 완료:
- `src/constants/ledgerColors.ts` — `cafe: '#C9967A'` 추가
- `src/constants/categories.ts` — `COLOR_OPTIONS`에 `brown`, `ICON_OPTIONS`에 `cafe`(임시로 `EtcIcon`) 추가
- `supabase/schema_v5_category_cleanup.sql` — Phase 1(기타 비우기, 구독서비스 이동)과 합쳐서 작성 완료, **아직 미실행**

**남은 것**: 사용자가 Figma에서 카페 아이콘 완성하면 `src/components/icons.tsx`에 `CafeIcon` 추가 + `categories.ts`의 `Icon: EtcIcon` → `Icon: CafeIcon`으로 한 줄만 교체(DB 변경 없음).

---

## Phase 2 — 고정지출 스키마 재설계

> `AGENTS.md`에 "지출 입력 경로는 카드 SMS + 수기 입력만" 원칙을 못박음 — 계좌이체 감지/자동화는 아예 설계 대상에서 제외. 그래서 고정지출 4개(월세/통신비/넷플릭스/헬스장) 중 어느 게 실제로 SMS로 오는지 미리 확인할 필요 없어짐:
> - 카드결제로 SMS가 오는 항목(통신비/넷플릭스/헬스장 등)은 상호명 매칭 자동화 대상
> - 계좌이체인 항목(월세 등)은 카테고리만 붙이고 자동매칭은 아예 시도하지 않음 — 매달 사람이 직접 거래로 기록하는 기존 방식 그대로 유지(이건 결함이 아니라 의도한 범위)

**남은 결정 사항**: Phase 1(카테고리 정리)을 먼저 끝내고 넘어갈지, 병행할지

**상태: 코드 작성 완료, SQL 실행 + Edge Function 재배포 필요**

**변경 내용 (확정되면 진행)**
- `fixed_expenses` 테이블에 `category_key`, `subcategory`, `merchant_name` 컬럼 추가, `day_of_month` → 알림용 예상일(`expected_day`, nullable)로 의미 변경
- 이번 달 매칭 상태 추적용 `fixed_expense_matches` 테이블 신규 (fixed_expense_id, year_month, matched_transaction_id, matched_date)
- `supabase/functions/sms-ingest/index.ts`의 `inferCategory` 앞단에 "상호명이 등록된 고정지출과 일치하는지" 체크 추가 — 일치하면 그 카테고리/소분류를 씌우고 `fixed_expense_matches`에 기록
- `src/store/fixedExpensesContext.tsx`, `src/app/fixedExpenseEdit.tsx` — 카테고리 선택 UI + 상호명 입력 필드 추가, `dayOfMonth`를 "예상일"로 문구/의미 변경

**영향 받는 파일 (대략)**: `supabase/schema_v6_*.sql`(신규), `supabase/functions/sms-ingest/index.ts`, `supabase/functions/sms-ingest/parse.ts`(필요 시), `src/store/fixedExpensesContext.tsx`, `src/app/fixedExpenseEdit.tsx`, `src/app/(tabs)/management.tsx` — 대략 6개 이상, i18n 3개 파일까지 포함하면 큰 작업 기준(수정 8개 이상)에 걸림 → 착수 전에 상세 계획표 한 번 더 제시 예정

---

## Phase 3 — 소분류 "상세" 계층 (Phase 2 이후)

- `subcategories: text[]`를 `subcategory_details` 테이블(category_key, subcategory, label, time_start, time_end, merchant_names)로 승격
- `sms-ingest`의 매칭 우선순위: **상세(상호명+시간대) → 고정지출(상호명) → 기존 최근-내역 매칭 → 기본값(기타)**
- `src/app/categoryEdit.tsx`에 소분류별 "상세" 추가 UI(시간대 선택 + 상호명 여러 개 입력) 신규
- 이것도 스키마+엣지함수+화면 여러 개 걸리는 큰 작업 — Phase 2 확정 후 별도 계획표

---

## Phase 4 — 예산 설정에 고정지출 편입 (Phase 2·3 이후)

- 예산 설정(카테고리별 화면, `budgetEdit.tsx`)에 그 카테고리의 소분류 목록을 보여주고, 소분류별 "고정지출" 체크박스 추가
- 체크하면 고정지출 입력 폼(제목/상호명/금액/예상일) 인라인으로 펼침
- 관리 탭의 별도 "고정지출" 섹션은 여기로 흡수(제거)

---

## 지금 답해주시면 되는 것

1. `supabase/schema_v5_category_cleanup.sql`을 Supabase SQL Editor에서 실행 — Phase 1 + 1b 전부 포함됨
2. 실행 전 파일 맨 위 주석의 SELECT로 "기타"에 재분류가 덜 된 거래가 남아있는지 먼저 확인 권장
3. Phase 2(고정지출 재설계)는 SQL 실행 후 상세 계획표 별도로 정리
