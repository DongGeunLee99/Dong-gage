# LOG

> 최신 수정 내역이 위에 위치. 형식: 날짜 · 시간 · 내용

---

## 2026-08-31 (1)

### · 카카오 로그인 버그 수정 + Supabase 데이터 연동 + 카테고리 확장

> 지난 세션에서 카카오 로그인까지 구현해뒀는데, 실제 기기 테스트에서 연쇄적으로 버그가 터져서 하루 종일 디버깅 + 실데이터 이전 작업.

**1) 카카오 로그인 "잘못된 요청"(KOE205) 수정**
- `src/store/auth-context.tsx` — `signInWithOAuth` 옵션에 `scopes: 'profile_nickname'` 추가
  - 원인: Supabase의 Kakao 프로바이더가 기본적으로 `account_email`을 요청 스코프에 포함하는데, 개인(비즈니스 미인증) 카카오 앱은 이메일 동의항목 자체가 없어서 카카오 서버가 요청을 거부 ([supabase/auth#36878](https://github.com/supabase/auth/issues/36878) 알려진 이슈)
  - 이후 사용자가 카카오 콘솔에서 비즈니스 앱 전환으로 이메일 문제 자체를 해결

**2) 로그인 성공 후 `localhost` 리다이렉트 실패 수정**
- 원인: Expo Go 개발 모드의 `exp://<로컬 IP>:8081/...` 형태 리다이렉트 URI를 Supabase의 Redirect URLs 허용 목록이 제대로 매칭하지 못하는 알려진 버그 ([supabase/auth#2039](https://github.com/supabase/auth/issues/2039))
- 해결: `npx expo start --tunnel`로 전환 — 안정적인 호스트명 기반 URL(`exp://xxxx.exp.direct/...`)을 Redirect URLs에 등록
- 참고: `useProxy`/`auth.expo.io` 프록시는 SDK 48부터 보안 이슈로 deprecated되어 사용 안 함

**3) Supabase에 실데이터 연동 (기존엔 카테고리/거래내역 둘 다 로컬 메모리 상태, 앱 재시작하면 초기화되던 상태)**
- `supabase/schema.sql` (신규) — `categories`/`transactions` 테이블 생성, RLS로 로그인 계정 본인 것만 접근하도록 제한, 기본 카테고리 4개 + 8월 실사용 거래내역 등록
- `src/store/categories-context.tsx`, `src/store/transactions-context.tsx` — 로컬 `useState` 하드코딩 → Supabase 연동으로 전면 재작성 (화면에서 쓰는 API는 그대로 유지, `addTransaction`은 optimistic update)
- 사용자가 제공한 `8월 테스트.xlsx`(뱅킹 앱에서 export한 실제 8월 지출/이체 내역, 123행) 분석 후 임포트
  - 88건은 계좌간 이체(자동이체/충전)라 지출이 아니므로 임포트 대상에서 제외 (사용자 확인: "이체는 나중에 문자 자동입력 붙일 때 다시 생각")
  - 무신사 90,805원 결제가 카카오페이머니/카카오페이 간편결제 양쪽에 중복 로그되어 있던 것 1건 제거
  - 최종 34건 임포트, 엑셀 카테고리를 기존 4개(식비/교통/쇼핑/기타)에 매핑, 서브카테고리 4개(대리운전/구독서비스/통신비/송금) 신규 추가

**4) 카테고리 4개 → 9개로 확장**
- 공여사들(노션 가계부)·윤슬 가계부(머니키퍼) 두 참고 사이트의 카테고리 체계를 참고해 5개 신규 추가: 주거·통신 / 건강 / 여가·문화 / 경조사·비정기 / 금융
- `supabase/schema_v2_more_categories.sql` (신규) — 카테고리 5개 추가 + 기존 34건 중 "기타"에 몰아넣었던 5건(의료 2·통신비 1·송금 2) 재분류
- 아이콘: 사용자가 `react-icons`(웹 전용 라이브러리라 RN에서 동작 안 함) 제안 → `@expo/vector-icons`(Ionicons)로 대체 설치, `src/components/icons.tsx`에 `HousingIcon`/`HealthIcon`/`LeisureIcon`/`EventsIcon`/`FinanceIcon` 5개 추가, `src/constants/categories.ts`·`ledger-colors.ts`에 색상 5개 추가
  - 기존 4개는 손그림 SVG, 신규 5개는 라이브러리 아이콘이라 스타일이 다름 — 추후 통일 필요 ([todo](todo.md) 참고)

**검증**: 매 단계마다 `tsc --noEmit`, `expo export -p ios`(임시 디렉터리로 빌드 후 삭제), `expo-doctor` 통과 확인.
