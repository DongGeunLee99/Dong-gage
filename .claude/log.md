# LOG

> 최신 수정 내역이 위에 위치. 형식: 날짜 · 시간 · 내용

---

## 2026-08-31 (12)

### · 색상 정의를 `LedgerColors` 하나로 완전 통합

> "그럼 하나로 합치자" — (11)에서 발견한 이중 정의 문제를 `fixed` 외 나머지도 전부 정리.

- `themePalettes.ts`에서 `sharedSemantic`(income/expense/food/transport/shopping/etc/selectedDay)과 `ColorPalette` 타입의 해당 필드를 전부 삭제. `ColorPalette`는 이제 진짜 테마별로 달라지는 중립색(bg/card/ink/muted/line 등)만 남음
  - `transport`/`shopping`/`etc`는 `colors.X` 형태로 쓰는 곳이 애초에 전혀 없어서(전부 `LedgerColors` 경유) 삭제해도 영향 없음을 grep으로 확인
  - `income`/`expense`/`selectedDay`는 `LedgerColors`와 값이 완전히 같아서(둘 다 처음부터 동일값) 교체해도 시각적 변화 없음
  - `food`는 딱 한 군데(`dashboardStyles.ts`의 `budgetCatRemainWarn`, 예산 초과 경고색으로 food의 주황을 재사용하던 곳)에서만 `colors.food`로 쓰이고 있었는데, 이건 원래 값(진한 주황 `#EB6834`)이라 파스텔화가 안 돼 있었음 — `LedgerColors.food`(파스텔 `#F19571`)로 교체되면서 이 경고색도 같이 파스텔톤이 됨. 나머지 파스텔화 흐름과 일관되게 맞춘 것이라 의도된 부작용
- `colors.income`/`colors.expense`/`colors.selectedDay`/`colors.food`를 쓰던 12개 파일을 `LedgerColors.X`로 일괄 치환(sed) 후, 각 파일에 `LedgerColors` import 추가(스타일 파일 8개는 기존 `LedgerFonts` import에 병합, 화면 파일 4개는 새로 추가)
- 결과: 카테고리/시맨틱 색상 12개(`income`/`expense`/`food`/`transport`/`shopping`/`fixed`/`etc`/`housing`/`health`/`leisure`/`events`/`finance`/`selectedDay`) 전부 `LedgerColors.ts` 한 곳에서만 정의됨

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과. (중간에 `expo-doctor`가 원인불명으로 두 번 실패했는데, 알고 보니 이전 작업에서 bash 세션 cwd가 `src/`에 머물러 있던 게 원인 — `cd`로 프로젝트 루트로 돌아오니 바로 해결. 코드 문제 아니었음)

## 2026-08-31 (11)

### · 고정지출 색상 이중 정의 통합 + 라벤더로 변경

> 사용자가 "고정지출 토글 활성 색이 훨씬 진한 보라색"이라고 해서 찾아보니, `LedgerColors.fixed`(내가 계속 조정하던 것)와는 별개로 `themePalettes.ts`의 `ColorPalette.fixed`(`#4A3AA7`, 4개 테마 공유, 한 번도 안 건드림)가 따로 존재 — `management.tsx`의 고정지출 토글만 이 두 번째 값을 참조하고 있었음. 사용자가 "고정지출도 ledgerColors.ts 걸 쓰는 게 좋겠다"고 해서 통합.

- `src/app/(tabs)/management.tsx:91` — `colors.fixed` → `LedgerColors.fixed` (import 추가)
- `src/constants/themePalettes.ts` — `ColorPalette` 타입과 `sharedSemantic`에서 이제 안 쓰는 `fixed` 필드 제거 (다른 참조 없음을 grep으로 확인 후 삭제)
- `src/constants/ledgerColors.ts`의 `fixed`를 라벤더 톤으로 변경: `#9991CD` → `#A489D2`(H262 S45% L68%, 흰 아이콘 대비 2.97)
- **참고**: `income`/`expense`/`food`/`transport`/`shopping`/`etc`/`selectedDay` 6개는 여전히 `LedgerColors`와 `themePalettes.ts`의 `sharedSemantic` 양쪽에 각각 정의되어 있고(현재는 값이 갈라져 있음), `housing`/`health`/`leisure`/`events`/`finance` 5개는 `LedgerColors`에만 있음. 사용자가 원하면 나머지도 `LedgerColors` 하나로 통합 가능 — 이번엔 요청받은 `fixed`만 처리

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-08-31 (10)

### · 고정지출 색상 살짝 밝게 조정

- `src/constants/ledgerColors.ts`의 `fixed`(고정지출) `#8075C1` → `#9991CD` (흰색 20% 블렌드). 흰 아이콘 대비 2.89로 여전히 또렷함

## 2026-08-31 (9)

### · 앱 아이콘(새싹) 제작 — SVG 1개에서 전체 플랫폼 PNG 자동 생성

> 사용자가 캡처해온 아이콘 후보 10개 중 새싹(sprout) 모양을 선택하고, 직접 만든 `icon-sprout.svg`(흰 라운드 카드 + 코랄 라인아트 새싹, 128x128)를 제공. "빌드해야 하면 진행해줘"라는 요청으로 실제 앱 아이콘 에셋 파이프라인까지 진행.

**1) SVG → PNG 변환 도구 확보**
- 로컬에 SVG 래스터라이저(rsvg-convert/inkscape/imagemagick/`sharp`)가 전혀 없어서, 프로젝트 `package.json`은 건드리지 않고 스크래치패드 디렉터리에 별도로 `npm install sharp` — 프로젝트 의존성/락파일에 영향 없이 격리
- (시도했다 접은 방법: `claude-in-chrome`으로 HTML을 렌더링해 스크린샷하는 방식 — `file://` URL은 확장 보안 정책상 열 수 없어 로컬 서버를 띄우려 했으나 사용자가 중단시킴. sharp로 직접 SVG를 래스터라이즈하는 게 훨씬 간단하고 정확해서 이 방식으로 전환)

**2) SVG 3종 파생 + 사이즈별 렌더링**
- 원본(카드+테두리+코랄 글리프) → `icon.png`(1024) / `favicon.png`(256)
- 글리프만(투명 배경, 코랄) → `android-icon-foreground.png`(1024, 세이프존 내 이미 28~32%로 안전) / `splash-icon.png`(512)
- 글리프만(투명 배경, 흰색) → `android-icon-monochrome.png`(1024) — Android 13+ 테마 아이콘용, 알파 채널만 사용되므로 흰색이라 미리보기에선 안 보이는 게 정상 (`sharp().stats()`로 알파 채널에 실제 도형이 있는지 확인)
- 배경 단색 흰색 1024x1024 → `android-icon-background.png`
- 렌더링 시 `density = 72 * (targetPx / viewBoxSize)`로 맞춰서 확대 시 흐려지지 않게 처리

**3) `app.json` 정리**
- `ios.icon`: 신형 Icon Composer 번들(`./assets/expo.icon`) → 평범한 PNG(`./assets/images/icon.png`)로 단순화. SDK 54의 새 iOS 아이콘 포맷은 `icon.json` 스키마가 공식 문서에 없고 보통 Xcode Icon Composer 앱으로 만드는 것이라, 손으로 흉내 내다 잘못된 스키마로 빌드를 깨뜨릴 위험이 있어 회피 — 안 쓰는 `assets/expo.icon` 디렉터리 삭제, todo에 재검토 항목 기록
- 스플래시 배경색 `#208AEF`(파랑) → `#FFFFFF`, Android adaptiveIcon `backgroundColor` `#E6F4FE`(연파랑) → `#FFFFFF` — 새 코랄/흰색 아이콘과 안 어울리던 기존 파란 배경을 통일
- `icon-source.svg`(원본)는 저장소 루트에서 `assets/images/`로 이동해 보관 — 나중에 다시 렌더링할 때 필요

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-08-31 (8)

### · 카테고리 색상, 더 밝은 파스텔(② 30% 블렌드)로 최종 변경

> (7)에서 16% 블렌드로 처음 적용했는데 사용자가 "칙칙하다"고 해서, 원인(흰 아이콘 대비를 지키려 노랑·초록 계열까지 다 같이 보수적으로 눌러놓은 것)을 설명하고 3가지 대안(16%/30%/색상별 대비 3.0 균일화)을 실제 원+흰 아이콘 렌더링으로 [비교 아티팩트](https://claude.ai/code/artifact/fbec931b-147b-4c00-ada1-2d6667db0863)로 만들어 제시 → 사용자가 "더 밝은 것"(30% 블렌드) 선택

- `src/constants/ledgerColors.ts` 10개 색상을 30% 블렌드 값으로 교체 (예: `food #EE8054` → `#F19571`)
- 기타(`#F2BD4D`)·경조사(`#AFB978`) 등 노랑·연두 계열은 흰 아이콘 대비가 1.7~2.1로 낮아짐 — 사용자가 밝기를 우선시해서 선택한 트레이드오프, 실기기에서 아이콘이 흐릿하면 알려달라고 안내 필요

## 2026-08-31 (7)

### · 카테고리 색상 10개 파스텔 톤으로 조정

- `src/constants/ledgerColors.ts`의 `food`/`transport`/`shopping`/`fixed`/`etc`/`housing`/`health`/`leisure`/`events`/`finance` 10개를 흰색 16% 블렌드로 소프트화 (예: `food #EB6834` → `#EE8054`)
- 아이콘 원/사각형 배경 위에 흰색 스트로크 아이콘이 올라가는 구조라(`iconCircle`/`iconSq` + `<meta.Icon color="#fff">`), 너무 밝히면 흰 아이콘 대비가 무너짐 — WCAG 대비비 계산(`node`로 relative luminance 계산) 확인해가며 원래 대비 대비 상대적으로 비슷한 비율(약 -15~20%)만 낮추는 선에서 블렌드 비율(16%) 결정
- `income`/`expense`/`selectedDay`는 손대지 않음 — 카테고리 장식색이 아니라 수입/지출/예산초과 등을 신호하는 기능색이라 채도를 낮추면 시각적 경고 기능이 약해질 수 있어서 제외 (사용자가 이것도 원하면 별도 요청 필요)

### · 신규 카테고리 5개 아이콘 손그림 재작업

- `src/components/icons.tsx`의 `HousingIcon`/`HealthIcon`/`LeisureIcon`/`EventsIcon`/`FinanceIcon`을 `@expo/vector-icons`(Ionicons) 대신 기존 식비/교통/쇼핑/기타와 같은 손그림 SVG 라인아트로 재작성 (20x20 viewBox, `stroke` 기반, `strokeWidth 1.7`, `strokeLinecap/Linejoin round`)
  - 주거·통신 → 지붕+벽+문 있는 집 모양
  - 건강 → 원 안에 십자
  - 여가·문화 → 8분음표 2개
  - 경조사·비정기 → 리본 달린 선물상자
  - 금융 → 겹친 동전 2개 (관리 탭의 지갑 아이콘과 겹치지 않게 구분)
- `icons.tsx`에서 `@expo/vector-icons` import 제거 → iOS 번들에서 Ionicons 폰트가 빠지면서 약 380KB 감소 확인 (`expo export -p ios` 전/후 비교: 4.14MB → 3.76MB)
- **미해결**: 브라우저에서 육안 확인을 시도했으나 `npx expo start --web`이 기존부터 있던 버그로 크래시함(`ReferenceError: window is not defined`, Supabase auth-js가 SSR 중 AsyncStorage 접근) — 이번 아이콘 작업과 무관한 별개 이슈라 `todo.md`에 기록만 하고 손대지 않음. 아이콘 자체는 `tsc`/`expo-doctor`/`expo export -p ios`로 빌드 성공만 확인했고, 실제 화면에서 어떻게 보이는지는 사용자가 기기(Expo Go)에서 확인 필요

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
