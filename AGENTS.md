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
