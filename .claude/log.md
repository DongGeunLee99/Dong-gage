# LOG

> 최신 수정 내역이 위에 위치. 형식: 날짜 · 시간 · 내용

---

## 2026-08-31 (5)

### · 스타일을 `src/styles/`로 분리 + README "AI 협업 워크플로" 정리

> 사용자가 "createStyles가 컴포넌트 파일 밑에 붙어있는 게 마음에 안 든다"고 해서, 사용자의 다른 프로젝트([AI_Medimage_Care](https://github.com/DongGeunLee99/AI_Medimage_Care))가 `folder-structure.md`에 문서화해둔 "스타일은 컴포넌트 로직과 분리해 전용 폴더에 모은다" 원칙을 확인 후 이 프로젝트에 이식.

**1) 스타일 분리 리팩터링**
- `src/styles/` 신설, 화면/모달/레이아웃 11개 전부의 `createStyles(colors)`(+ `modal.tsx`/`management.tsx`의 `toggleStyles`)를 `src/styles/xxxStyles.ts`로 이동 (`budgetEditStyles.ts`, `transactionModalStyles.ts` 등)
- 각 컴포넌트 파일은 `import { createStyles } from '@/styles/xxxStyles'`로 가져다 쓰는 형태로 축소, 더 이상 쓰지 않는 `StyleSheet`/`LedgerFonts`/`ColorPalette` import 제거
- 뒤쪽 8개 파일은 서브에이전트(fork)에 위임 — 앞서 3개 파일(budgetEdit/categoryPicker/categoryEdit)에서 확립한 패턴을 프롬프트에 명시해서 넘김. `tsc --noEmit`/`expo-doctor`/`expo export -p ios` 전부 통과 확인
- `AGENTS.md`/`README.md`의 "디자인 패턴"·"네이밍 컨벤션"에 `src/styles/` 규칙 반영, "각 지침이 존재하는 이유" 표에 이 결정의 출처(사용자의 이전 프로젝트 관례) 명시

**2) README AI 섹션 이름 변경**
- "AI와 함께 개발하기" → "AI 협업 워크플로" (섹션 내용이 단순 소개가 아니라 지침→배경→사례→기록체계→검증까지 다루는 프로세스라 "워크플로"가 더 맞는다고 판단)
- README 최상단에 앱 버전 대신 런타임 버전 표기(`Expo SDK 54 · React Native 0.81 · React 19 · TypeScript 5.9`) — 사용자가 원한 건 `package.json` 버전이 아니라 플랫폼 버전이었음

**3) 개념 정리 (문서 반영은 안 함, 대화로만 정리)**
- 사용자가 "디자인 패턴 = 폴더 분류(백엔드/프론트엔드 등)"로 오해하고 있어서, GoF 디자인 패턴 / 아키텍처 패턴 / 애자일(방법론)이 서로 다른 축이라는 걸 설명. 우리 "디자인 패턴" 섹션도 사실 패턴(Context+Provider)·프레임워크 관례(파일 기반 라우팅)·코드 스타일 가이드(스타일 위치)가 섞여 있어서 섹션명이 부정확하다는 점을 짚었고, 사용자가 이름 개선을 원하면 다음에 반영하기로 함

## 2026-08-31 (4)

### · 파일명 컨벤션 kebab-case → camelCase 전환

> (3)에서 kebab-case로 문서화했는데, 사용자가 마음에 안 든다고 해서 camelCase/snake_case 중 선택하게 함 → camelCase로 결정 (JS/TS 생태계 관례, 기존 변수/함수 네이밍과 통일).

- `src/app/`, `src/constants/`, `src/store/`의 kebab-case 파일 14개를 `git mv`로 camelCase 리네이밍 (`budget-edit.tsx`→`budgetEdit.tsx`, `auth-context.tsx`→`authContext.tsx` 등). `_layout.tsx`/`(tabs)` 같은 Expo Router 예약 파일명은 그대로 유지
- import 경로(`@/store/...`, `@/constants/...`)와 `router.push`/`Stack.Screen name`의 라우트 문자열(Expo Router는 파일명이 곧 URL 세그먼트)을 전수 grep 후 일괄 치환
- 리네이밍 직후 `tsc --noEmit`이 7개 파일에서 라우트 타입 불일치로 실패 → 원인은 소스가 아니라 `typedRoutes` 실험이 생성하는 `.expo/types/router.d.ts`(gitignore 대상)가 이전 파일명으로 캐시된 것. `npx expo start`로 재생성 후 통과 확인
- `AGENTS.md`/`README.md`의 네이밍 컨벤션 표를 camelCase로 갱신, "Expo Router 예약 파일명은 리네이밍 대상 아님" 예외 조항 추가

## 2026-08-31 (3)

### · 디자인 패턴 · 네이밍 컨벤션 문서화 + 죽은 코드 제거

> 사용자가 개인적으로 관리하는 Claude Code 활용 가이드(네이밍 컨벤션을 CLAUDE.md에 명시하라는 조언 포함)를 참고해, 실제 코드베이스에서 이미 지켜지고 있는 패턴을 규칙으로 명문화.

**1) 죽은 코드 제거**
- `src/constants/theme.ts`, `src/components/themed-text.tsx`, `src/components/themed-view.tsx`, `src/hooks/use-theme.ts`, `src/hooks/use-color-scheme.ts(.web.ts)` 삭제
  - Expo 기본 템플릿에서 온 파일들로, 실제 화면(`src/app/**`) 어디서도 import되지 않음을 grep으로 확인 후 제거
  - 진짜 테마 시스템은 `settings-context.tsx` + `theme-palettes.ts` + `ledger-colors.ts` 조합
  - 삭제 후 `tsc --noEmit`, `expo-doctor`, `expo export -p ios` 전부 통과 확인

**2) `AGENTS.md`에 디자인 패턴 · 네이밍 컨벤션 섹션 추가**
- 디자인 패턴: 도메인별 Context+Provider+훅 상태관리, Expo Router 파일 기반 라우팅, `createStyles(colors)` 스타일 패턴 — 새로 정한 게 아니라 이미 100% 지켜지던 패턴을 그대로 문서화
- 네이밍 컨벤션: 파일명 kebab-case, 화면 컴포넌트 `XxxScreen`/`XxxModal`/`XxxLayout`, 컨텍스트 `XxxProvider`+`useXxx`, 아이콘 `XxxIcon`, DB는 snake_case — 전부 실제 코드 grep으로 확인 후 확정
- 상수 네이밍만 유일하게 갈라져 있었음(`LedgerColors`/`LedgerFonts`는 PascalCase, `THEME_PALETTES` 등은 SCREAMING_SNAKE_CASE) → 사용자 확인 후 "디자인 토큰 네임스페이스만 PascalCase, 나머지는 SCREAMING_SNAKE_CASE"로 확정 (현재 상태와 이미 일치해서 리네이밍 불필요했음)

**3) `README.md`에 "AI와 함께 개발하기" 섹션 상세화**
- `AGENTS.md`/`CLAUDE.md` 원문 인용 + 지침별 배경(왜 이 규칙이 필요한지) + 실제 적용 사례(카카오 로그인 버그, 실데이터 임포트 검증, 이번 죽은 코드 제거) 추가
- "아키텍처" 섹션 신설: 사람 독자를 위해 상태관리/라우팅/스타일 패턴을 짧게 요약, 상세는 AI 섹션으로 링크

## 2026-08-31 (2)

### · Git 저장소 실제 반영 + README 초안 작성

- `git init` 이후 방치되어 있던 이후 작업분(Supabase 이전, tabs 네비게이션, i18n 등)을 전부 커밋. 개인 실 데이터 파일(`8월 테스트.xlsx`)은 `.gitignore` 처리 후 제외
- `README.md`를 프로젝트 소개 + "AI와 함께 개발하기" 섹션으로 재작성 (이후 (3)에서 상세화)
- `.env.example` 추가

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
