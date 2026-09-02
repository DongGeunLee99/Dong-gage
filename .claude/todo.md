# TODO — 나중에 할 일

> 완료 항목은 [log.md](log.md) 참고.

---

## 미완료

- [ ] **카테고리 로딩 간헐적 실패 (`PGRST303: JWT issued at future`)** — 가끔 `categoriesContext`의 Supabase fetch가 실패하면서 카테고리 아이콘이 안 보이는 현상 발생. Supabase JWT의 `iat`(발급 시각)이 서버 기준으로 미래라 거부되는 것 — 기기 시계 오차 또는 세션 토큰 갱신 타이밍 문제로 추정. 간헐적이라 재현 조건부터 특정 필요. 발생 시 `supabase.auth.refreshSession()`으로 재시도하는 로직 추가하는 방안 검토
- [ ] **AI 정산 — 앱 UI에서 실기기 검증** — 배포된 함수 자체는 curl로 200 확인했지만(`log.md` 2026-09-02 참고), 앱의 "AI로 채우기" 버튼을 통한 실제 플로우는 Expo Go에서 아직 안 눌러봄. 로딩 상태 표시, 실패 시 Alert 문구, 채워진 뒤 칩/예외 카드가 제대로 갱신되는지 확인 필요
- [ ] **AI 정산 — 거래 검색 범위 확장** — 지금은 "오늘" 거래만 후보로 보여줌(`TODAY` 상수 기준). 어제 야근 회식처럼 날짜가 걸치는 경우나 여러 날에 걸친 정산은 아직 처리 못 함
- [ ] **iOS Icon Composer(`assets/expo.icon`) 재도입 검토** — SDK 54의 새 iOS 아이콘 포맷(레이어/그라데이션/틴트 지원)인데, `icon.json` 스키마가 공식 문서에 상세히 설명되어 있지 않고 보통 Xcode의 Icon Composer 앱으로 만든다. 지금은 리스크를 피하려고 `ios.icon`을 평범한 PNG(`icon.png`)로 되돌려둠. 나중에 iOS 전용 다이나믹 아이콘이 필요해지면 Icon Composer 앱으로 직접 만들어서 교체
- [ ] **웹(Expo web) SSR 크래시** — `npx expo start --web`/`expo export -p web` 실행 시 서버사이드 렌더링 단계에서 `ReferenceError: window is not defined` (Supabase `auth-js`가 세션 복구 시 `AsyncStorage.getItem`을 호출하는데, `app.json`의 `web.output: "static"`이 라우트를 Node 환경에서 프리렌더링하면서 발생). 웹 배포 계획이 생기면 해결 필요 — `supabase.ts`의 `AsyncStorage` storage를 SSR 환경에서 no-op으로 우회하거나, 해당 라우트를 client-only로 전환
- [ ] **"이체(계좌간 전환)" 거래 처리 방식 결정** — 8월 데이터 임포트 시 88건 전부 제외함. 문자 자동입력 붙일 때 다시 설계하기로 함
- [ ] **SMS 자동입력 파이프라인** — iOS 단축어 → Supabase Edge Function → `pending_review` 상태로 저장하는 흐름, 초기 설계만 해두고 미착수
- [ ] **budgets-context / fixed-expenses-context도 Supabase로 이전할지 검토** — 지금은 categories/transactions만 이전됨, 이 둘은 여전히 로컬 메모리 상태(앱 재시작하면 초기화)
- [ ] Expo Go 개발 중 카카오 로그인 테스트하려면 매번 `npx expo start --tunnel`로 켜야 함 (일반 모드는 `exp://<로컬IP>` 리다이렉트가 Supabase 허용 목록과 매칭 안 되는 알려진 버그)

---

## 완료

<!-- 완료 시 여기로 이동, 날짜와 함께 -->

- [x] **앱 아이콘(홈 화면/스플래시) 제작** — 2026-08-31: 사용자가 새싹(sprout) 모양 아이콘(`assets/images/icon-source.svg`)을 선택, sharp로 iOS/Android/web/스플래시용 PNG 일괄 생성. iOS는 신형 Icon Composer 번들(`assets/expo.icon`) 대신 평범한 PNG로 단순화(스키마 문서 미비로 리스크 회피, todo에 재검토 항목 남김). 스플래시/Android 배경색을 기존 파란색(`#208AEF`/`#E6F4FE`)에서 흰색으로 통일
- [x] **새 카테고리 아이콘 손그림 재작업** — 2026-08-31: 주거·통신/건강/여가·문화/경조사·비정기/금융 5개를 기존 식비/교통/쇼핑/기타와 같은 손그림 SVG 스타일(20x20 viewBox, `stroke` 기반, `strokeWidth 1.7`)로 재작업. `@expo/vector-icons`(Ionicons) 의존 제거 — iOS 번들 크기 약 380KB 감소. 웹 프리뷰가 SSR 버그로 막혀 있어 기기(Expo Go)에서 육안 확인 필요
- [x] **Git 저장소 초기화** — 2026-08-31: 이후 작업분(카테고리/거래 Supabase 이전, tabs 네비게이션, i18n 등) 전부 커밋 완료. `8월 테스트.xlsx`(개인 실 데이터)는 gitignore 처리
