# 가계부 앱 (ledger-app)

`Expo SDK 54` · `React Native 0.81` · `React 19` · `TypeScript 5.9`

Expo(React Native) + Supabase로 만드는 개인용 가계부 앱입니다. 캘린더/리스트로 하루하루의 지출을 기록하고, 대시보드에서 카테고리별 지출을 한눈에 확인하고, 예산·고정지출·카테고리를 직접 관리할 수 있습니다.

## 주요 기능

- **캘린더** — 날짜별 지출/수입 기록 및 조회
- **리스트** — 거래내역을 목록으로 조회, 검색·필터
- **대시보드** — 카테고리별 지출 통계
- **관리** — 카테고리 / 예산 / 고정지출 편집
- **설정** — 다국어(한국어/영어/일본어), 라이트·다크 테마, 카카오 로그인

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| 프레임워크 | Expo (SDK 54) + Expo Router (file-based routing) |
| 언어 | TypeScript, React 19 / React Native 0.81 |
| 백엔드 | Supabase (Postgres + Auth + RLS) |
| 인증 | 카카오 로그인 (Supabase OAuth) |
| 상태관리 | React Context (`src/store`) |
| 다국어 | i18next / react-i18next |
| 네비게이션 | `@react-navigation/material-top-tabs` |

## 프로젝트 구조

```
src/
  app/                 화면 (Expo Router file-based routing)
    (tabs)/             캘린더 · 리스트 · 대시보드 · 관리 · 설정 탭
    budgetEdit.tsx, categoryEdit.tsx, categoryPicker.tsx, fixedExpenseEdit.tsx  편집/선택 모달
  components/          아이콘 등 공용 UI 컴포넌트
  constants/           카테고리 정의, 색상/테마 팔레트
  i18n/                다국어 리소스 (ko/en/ja)
  lib/                 Supabase 클라이언트
  store/               전역 상태 (auth, categories, transactions, budgets, fixed-expenses, settings, month)
  styles/               화면별 StyleSheet (xxxStyles.ts, 컴포넌트 파일과 분리)
supabase/              DB 스키마 (SQL)
.claude/               개발 진행 기록 (log.md, todo.md) — 아래 "AI 협업 워크플로" 참고
```

- `categories` / `transactions` — Supabase에 저장 (로그인 계정 기준 RLS)
- `budgets` / `fixed-expenses` — 아직 로컬 메모리 상태 (앱 재시작 시 초기화, Supabase 이전 검토 중)

## 아키텍처

- **상태관리** — Redux/Zustand 없이, 도메인별 React Context + Provider + 커스텀 훅(`src/store/xxxContext.tsx`, 예: `useAuth`, `useCategories`). `src/app/_layout.tsx`에서 Provider를 트리로 중첩해 조합한다.
- **라우팅** — Expo Router 파일 기반 라우팅. 탭은 `(tabs)/`, 모달/편집 화면은 `src/app/` 루트 개별 파일 + `_layout.tsx`의 `presentation: 'modal'`.
- **스타일** — 컴포넌트 파일과 분리해 `src/styles/xxxStyles.ts`에 모은다. 각 화면/모달은 `useMemo(() => createStyles(colors), [colors])`로 가져다 써서 테마 변경 시에만 재계산. 인라인 스타일 없음.
- **색상** — 카테고리/시맨틱 색(수입·지출·식비 등)은 `LedgerColors`(`src/constants/ledgerColors.ts`) 하나에만 정의. 테마별 `ColorPalette`(`useSettings().colors`)에는 진짜 테마마다 달라지는 중립색만 있다.

세부 네이밍 규칙과 각 패턴을 쓰는 이유는 아래 [AI 협업 워크플로](#ai-협업-워크플로)에서 다룹니다 — 사람과 AI 세션 모두 같은 문서를 기준으로 작업합니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env`를 만들고 Supabase 프로젝트 값을 채웁니다.

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Supabase 스키마 적용

Supabase SQL Editor에서 `supabase/schema.sql` → `supabase/schema_v2_more_categories.sql` 순서로 실행합니다.

### 4. 앱 실행

```bash
npx expo start
```

카카오 로그인은 Expo Go 개발 모드에서 `exp://<로컬IP>` 리다이렉트가 Supabase 허용 목록과 매칭되지 않는 알려진 버그가 있어, 로그인 테스트 시에는 `npx expo start --tunnel`로 실행해야 합니다.

## 개발 진행 기록

`.claude/log.md`(작업 내역), `.claude/todo.md`(할 일 목록)에 진행 상황을 기록하며 개발합니다. 이어서 작업할 내용은 `todo.md`를 확인하세요.

## AI 협업 워크플로

이 프로젝트는 [Claude Code](https://claude.com/claude-code)를 페어 프로그래머로 두고 개발합니다. 코드 수정 권한과 자율성을 주는 만큼, "AI가 무엇을 어떻게 판단하고 작업해야 하는가"를 저장소에 지침으로 박아두고, 모든 세션이 그 지침을 상속받도록 운영합니다. 아래는 실제로 리포지토리에 커밋되어 있는 지침 원문과, 그 지침이 만들어진 배경 및 실제 적용 사례입니다.

### 지침 구조

AI 도구(Claude Code, 혹은 [AGENTS.md](https://agents.md) 규격을 지원하는 다른 코딩 에이전트)는 세션을 시작할 때 아래 두 파일을 읽고 지침으로 삼습니다.

```
CLAUDE.md ─(@import)─▶ AGENTS.md
```

- **`AGENTS.md`** — 도구에 무관한 범용 지침(어떤 AI 코딩 에이전트를 쓰든 적용). 이 프로젝트의 기술적 제약과 작업 원칙을 담습니다.
- **`CLAUDE.md`** — Claude Code 전용 지침. `AGENTS.md`를 그대로 상속(`@AGENTS.md`)하고, 이 저장소 특유의 운영 파일 규칙을 추가합니다.

두 파일 모두 저장소에 커밋되어 있어 어떤 세션에서 열든, 어떤 사람이 이어받든 동일한 규칙 위에서 작업합니다.

#### `AGENTS.md` (범용 지침)

```
# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## 검증 없이 "완료"라고 하지 않기

작업 단계마다 아래를 통과시킨 뒤에만 완료로 간주한다:
- `npx tsc --noEmit`
- `npx expo export -p ios` (임시 디렉터리에 빌드 후 결과물 삭제 — 커밋하지 않음)
- `npx expo-doctor`

## 라이브러리 추가 전 React Native 호환 여부 확인

새 패키지를 넣기 전에 실제로 React Native/Expo 런타임에서 동작하는지 확인한다. 웹 전용 라이브러리(예: `react-icons`)는 RN에서 렌더링되지 않는다 — 아이콘류는 `@expo/vector-icons` 사용.

## 알려진 이슈는 근본 원인까지 찾아서 기록

에러를 우회하지 말고 원인을 규명한다. 외부 라이브러리/서비스의 알려진 버그면 이슈 트래커 링크까지 확인하고, 원인·재현조건·해결책을 `.claude/log.md`에 남겨 다음 세션에서 같은 문제를 반복 조사하지 않게 한다.

## 개인 데이터 보호

실 지출 내역이 담긴 엑셀/CSV 등 개인 데이터 원본 파일은 저장소에 커밋하지 않는다(`.gitignore` 처리). 그 내용을 분석·가공한 결과(코드, DB 시드 데이터)만 반영한다.

## 디자인 패턴

- **상태관리: 도메인별 Context + Provider + 커스텀 훅.** Redux/Zustand 등 전역 스토어 라이브러리를 쓰지 않는다. `src/store/xxxContext.tsx` 파일 하나당 `XxxProvider`와 `useXxx()` 훅 한 쌍만 export하고, `src/app/_layout.tsx`에서 Provider를 트리로 중첩해 조합한다. 새 전역 상태가 필요하면 이 패턴을 그대로 따른다.
- **라우팅: Expo Router 파일 기반 라우팅.** 탭 화면은 `src/app/(tabs)/`, 모달/편집 화면은 `src/app/` 루트에 개별 파일로 두고 `_layout.tsx`의 `Stack.Screen`에서 `presentation: 'modal'`을 지정한다.
- **스타일: `src/styles/`에 컴포넌트 로직과 분리해서 모은다.** 화면/모달/레이아웃 컴포넌트 하나당 `src/styles/xxxStyles.ts` 파일 하나에 `export function createStyles(colors: ColorPalette)`를 두고(테마 무관 정적 스타일이 있으면 같은 파일에 `export const toggleStyles`로 추가), 컴포넌트 파일에서는 `useMemo(() => createStyles(colors), [colors])`로 가져다 쓴다. 스타일 정의를 컴포넌트 파일 안에 두지 않는다.
- **데이터 소스 구분.** `categories`/`transactions`는 Supabase 연동(`addTransaction` 등은 optimistic update), `budgets`/`fixed-expenses`/`settings`/`month`는 로컬 상태(AsyncStorage 또는 메모리)다. 어떤 컨텍스트가 어디서 오는지 헷갈리면 `src/store/`의 각 파일 상단을 확인한다.
- **색상: 카테고리/시맨틱 색은 `LedgerColors`(`src/constants/ledgerColors.ts`) 하나에만 정의한다.** `ColorPalette`(`src/constants/themePalettes.ts`, `useSettings().colors`로 접근)는 테마마다 실제로 달라지는 중립색(bg/card/ink/muted/line 등)만 담는다. `income`/`expense`/`food`처럼 카테고리·시맨틱 색을 `ColorPalette`에 다시 추가하면 `LedgerColors`와 값이 갈라지는 이중 정의가 생긴다 — 새 색상은 항상 `LedgerColors`에 추가한다.

## 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 파일명 (컴포넌트 포함 전부) | camelCase | `budgetEdit.tsx`, `categoriesContext.tsx` |
| 컨텍스트 파일 | `xxxContext.tsx`, `XxxProvider` + `useXxx()` export | `authContext.tsx` → `AuthProvider`, `useAuth` |
| 훅 파일 (Provider 없이 훅만 있는 경우) | `useXxx.ts` | 신규 추가 시 적용. Provider가 딸린 훅은 `xxxContext.tsx` 규칙을 따른다(`useAuth`, `useCategories` 등) |
| 화면 컴포넌트 | 탭은 `XxxScreen`, 모달/편집 화면은 `XxxModal`, 레이아웃은 `XxxLayout` | `DashboardScreen`, `BudgetEditModal`, `TabsLayout` |
| 아이콘 컴포넌트 | `XxxIcon` | `ChevronLeftIcon`, `HousingIcon` |
| 스타일 파일 | `src/styles/xxxStyles.ts`, `createStyles(colors)` export (+선택적 `toggleStyles`) | `budgetEditStyles.ts`, `transactionModalStyles.ts` |
| 변수/함수 | camelCase | `formatYearMonth`, `signInWithKakao` |
| 타입/인터페이스 | PascalCase, Props는 `ComponentNameProps` | `CategoryMeta`, `IconProps`(공용 타입 예외) |
| 상수 — 디자인 토큰 네임스페이스(색상/폰트처럼 점 접근으로 쓰는 고정 세트) | PascalCase | `LedgerColors`, `LedgerFonts` |
| 상수 — 그 외 전부(옵션 목록, 매핑, 단일 값) | SCREAMING_SNAKE_CASE | `THEME_PALETTES`, `ICON_OPTIONS`, `INCOME_CATEGORY_KEY` |
| DB 테이블/컬럼 (Supabase) | snake_case | `category_key`, `sort_order` (SQL 관례 — 위 camelCase 규칙과 무관하게 유지) |

**예외 — Expo Router 예약 파일명은 그대로 둔다.** `_layout.tsx`, `(tabs)` 같은 그룹 폴더, `index.tsx`, `+not-found.tsx`는 프레임워크가 라우팅에 쓰는 특수 문법이라 어떤 네이밍 규칙도 적용하지 않는다. `src/app/` 안의 일반 화면 파일명은 그대로 URL 라우트 세그먼트가 되므로(`budgetEdit.tsx` → `/budgetEdit`), 이 파일들을 리네이밍하면 `router.push`/`Stack.Screen name`의 경로 문자열도 함께 바꿔야 한다.
```

#### `CLAUDE.md` (Claude Code 운영 규칙)

```
@AGENTS.md

## 작업 운영 파일

`.claude/` 폴더에 진행 상황 기록:
- `log.md` — 작업 내역 (무엇을 했는지, 왜 했는지, 원인/해결책까지 서술. 최신순 위)
- `todo.md` — 나중에 진행할 일 체크리스트 (완료 시 날짜와 함께 완료 섹션으로 이동, 삭제하지 않음)
```

### 각 지침이 존재하는 이유

| 지침 | 배경 |
| --- | --- |
| 버전 고정 문서 우선 확인 | Expo/React Native는 마이너 버전 단위로 API가 바뀐다. 모델의 사전학습 지식이 구버전 기준이면 존재하지 않는 API를 쓰거나 deprecated 패턴으로 코드를 짜게 되므로, 코드 작성 전 [v57 버전 고정 문서](https://docs.expo.dev/versions/v57.0.0/) 확인을 강제한다. |
| 검증 3종 세트 | 타입 에러(`tsc`), 실제 빌드 가능 여부(`expo export`), Expo 프로젝트 설정 정합성(`expo-doctor`) 중 하나라도 생략하면 "컴파일은 되는데 실행은 안 되는" 상태를 완료로 착각하기 쉽다. |
| RN 호환 여부 선확인 | `react-icons` 설치 시도 사례처럼, npm에 있다고 React Native에서 동작하는 건 아니다. 웹 전용 패키지를 설치했다가 되돌리는 시행착오를 방지한다. |
| 근본 원인 기록 | 카카오 로그인 `KOE205` 에러처럼 증상만 우회하면 다음 세션이 같은 원인을 처음부터 다시 조사하게 된다. |
| 개인 데이터 미커밋 | 실사용자의 실제 지출 내역은 민감 정보이므로, 분석에는 쓰되 저장소에는 결과물만 남긴다. |
| 디자인 패턴/네이밍 컨벤션 문서화 | AI에게 코드 수정 자율성을 줄수록 파일마다 다른 패턴(예: 어떤 상수는 PascalCase, 어떤 상수는 SCREAMING_SNAKE_CASE)을 쓰기 쉽다. 실제 코드베이스를 훑어 이미 지켜지고 있는 패턴을 규칙으로 못박아, 세션이 바뀌어도 스타일이 갈라지지 않게 한다. |
| 스타일을 `src/styles/`로 분리 | RN 기본값은 컴포넌트 파일 안에 스타일을 두는 것이지만, 사용자의 다른 프로젝트([AI_Medimage_Care](https://github.com/DongGeunLee99/AI_Medimage_Care))에서 스타일을 컴포넌트 로직과 분리해 전용 폴더에 모아온 관례를 이어받아 이 프로젝트에도 적용했다. |

### 기록 체계

- **`.claude/log.md`** — 세션마다 무엇을, 왜, 어떻게 했는지 서술형으로 기록. 단순 변경 요약이 아니라 원인 분석과 참고 링크까지 포함해, 다음 세션이 같은 조사를 반복하지 않게 하는 것이 목적.
- **`.claude/todo.md`** — 미완료/완료를 분리해 관리. 완료 항목은 지우지 않고 날짜와 함께 완료 섹션으로 이동시켜 이력을 남긴다.

### 검증 파이프라인

작업을 완료로 표시하기 전 다음을 매번 실행합니다.

```bash
npx tsc --noEmit          # 타입 체크
npx expo export -p ios    # 실제 빌드 가능 여부 (임시 디렉터리, 결과물 미커밋)
npx expo-doctor           # Expo 프로젝트 설정 정합성
```
