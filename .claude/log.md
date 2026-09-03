# LOG

> 최신 수정 내역이 위에 위치. 형식: 날짜 · 시간 · 내용

---

## 2026-09-03 (13)

### · AI 어드바이저 — 응답 속도 개선(15초 → thinking 낮춤 + 도구 병렬 실행)

> 실사용 피드백: "나쁘진 않은데 대답하는 데 15초 걸린다."

- **원인**: `gemini-3.7-flash`가 기본으로 "medium" 수준 thinking(추론)을 켜고 도는 모델 — 공식 문서 확인 결과(`ai.google.dev` WebFetch) `generationConfig.thinking_level`로 조절 가능하고, flash 계열은 기본이 medium이라 단순 조회+답변 같은 작업에도 불필요한 추론 시간이 붙고 있었음. 우리 도구들은 깊은 추론이 필요 없는 구조화 조회라 `thinking_level: 'minimal'`로 낮춤
  - 필드 케이싱은 이 프로젝트에서 이미 검증된 관례를 따름 — `generationConfig`는 카멜케이스, 그 안의 값 키(`response_mime_type`/`response_schema`처럼)는 스네이크케이스인 걸 ai-settlement에서 이미 확인했어서 `thinking_level`도 스네이크케이스로 통일
- **부가 수정**: 모델이 한 턴에 여러 도구를 동시에 요청하는 경우(예: 이번 달/지난 달 비교) 순차 `for await` 대신 `Promise.all`로 병렬 실행하도록 변경 — 지금까지는 있어도 안 써지던 최적화
- 재배포 완료, 무인증 curl 호출 401 확인(함수 정상 로드)

**검증**: 배포 후 게이트웨이 응답 확인. 실제 체감 속도 개선 여부는 실기기 재확인 필요.

## 2026-09-03 (12)

### · 세션 작업 전체 커밋 + 푸시

> 300ms 딜레이 조정 후 "아주 좋아 커밋하자"로 최종 확인. SMS 파이프라인(직전 세션분 포함, 그동안 미커밋 상태였음)부터 AI 어드바이저·탭 재구성·당겨서 새로고침까지 이번에 쌓인 작업을 전부 커밋.

- 파일들이 여러 기능에 걸쳐 서로 얽혀 있어서(같은 화면 파일을 SMS/AI 어드바이저/탭 재구성/새로고침이 전부 건드림) 기능별 커밋 분리 대신 하나의 커밋(`7b5feaa`)으로 묶음 — 커밋 메시지 본문에 4개 영역(SMS 자동입력/AI 어드바이저/내비게이션/당겨서 새로고침)을 각각 문단으로 설명
- `git add`는 변경된 파일을 전부 명시적으로 나열(`-A`/`.` 안 씀), 개인 데이터·시크릿 파일 섞여있지 않은지 스테이징 목록으로 확인 후 커밋
- `origin main`에 푸시 완료(`7d5cf09..7b5feaa`)

## 2026-09-03 (11)

### · 콘텐츠 페이드에 300ms 딜레이 추가

- `useRefreshFeedback`의 `fire()`에서 opacity 페이드 애니메이션만 `setTimeout(300)`으로 지연 시작(토스트 타이밍은 그대로) — 손을 뗀 직후 바로 튀지 않고 살짝 뜸을 들인 뒤 페이드되도록

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (10)

### · 새로고침 피드백 재작업 — 타이밍을 손 뗄 때로 지연 + 항상 보이는 페이드로 교체

> (9)를 실기기에서 확인해보니 "토스트 타이밍도 그대로고 랜더링 이벤트도 하나도 안 보인다"는 피드백. 둘 다 원인이 있었음.

**LayoutAnimation이 안 보인 이유**: `LayoutAnimation`은 실제로 레이아웃(위치/크기)이 달라질 때만 애니메이션되는데, 테스트 데이터가 새로고침 전후로 똑같으면(같은 거래 목록) 레이아웃도 똑같아서 아무것도 안 보이는 게 맞는 동작이었음 — "새로고침했다"는 신호를 데이터 변경 여부와 무관하게 매번 보장하는 용도로는 부적합했음.

**토스트 타이밍이 그대로였던 이유**: (9)에서 "네이티브 동작이라 못 바꾼다"고 설명했던 것 자체는 맞지만(임계값 통과 즉시 `onRefresh` 실행), 우리가 붙이는 **부가 피드백**(토스트/애니메이션)까지 그 타이밍을 그대로 따라갈 필요는 없었음 — 이 부분을 놓치고 있었음.

**해결**: `src/hooks/useRefreshFeedback.ts`(신규) — 데이터 로딩 완료와 "사용자가 손을 뗐는지"(ScrollView의 `onScrollBeginDrag`/`onScrollEndDrag`로 추적)를 모두 만족할 때만 완료 신호(토스트 + 페이드)를 발동. 로딩이 먼저 끝나도 아직 드래그 중이면 대기했다가 손을 떼는 순간(`onScrollEndDrag`) 발동. 완료 신호는 토스트뿐 아니라 콘텐츠 전체를 감싼 `Animated.View`의 opacity를 살짝 낮췄다 올리는 페이드(120ms→260ms)로 — 데이터가 실제로 바뀌었는지와 무관하게 매번 눈에 보임. 4개 화면(캘린더/리스트/대시보드/관리) 전부 이 훅으로 교체, 기존 로컬 `refreshing`/`justRefreshed` state와 개별 `onRefresh` 로직 제거

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과. 실기기 확인 필요.

## 2026-09-03 (9)

### · 새로고침 시 "손 뗄 때 시작" 커스텀은 보류, 대신 LayoutAnimation으로 갱신 느낌 추가

> "톡 진동과 함께 토스트가 뜨는데 아직 손을 올리고 있는 중"이라는 리포트로 원인 정정: `RefreshControl`은 원래 "손을 뗄 때"가 아니라 **당김 임계값을 넘는 순간** 네이티브가 `onRefresh`를 실행한다(그 "톡"도 iOS가 임계값 통과 시 주는 기본 햅틱). 데이터 조회가 빨라서 손을 떼기도 전에 새로고침이 끝나 토스트까지 뜨는 것 — 대부분의 앱이 실제로 이렇게 동작함(진짜 "릴리즈 시점"에만 시작하게 하려면 `RefreshControl`을 안 쓰고 당김 제스처를 직접 구현해야 해서 비용 대비 이득이 낮다고 판단, 보류로 정리)

- 대안으로 "화면이 새로 렌더링되는 느낌"을 제안 → 채택. `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)`을 `transactionsContext`/`categoriesContext`의 `refresh()`가 `setTransactions`/`setCategories` 직전에 호출하도록 추가 — 새 데이터로 교체될 때 리스트 항목들이 부드럽게 갱신되는 애니메이션이 자동으로 붙음(새 애니메이션 코드 작성 없이 RN 내장 기능)
- `src/app/_layout.tsx`에 Android 구형 아키텍처 대비 `UIManager.setLayoutAnimationEnabledExperimental(true)` 가드 추가(앱 시작 시 1회)
- 토스트는 그대로 유지(제거해 달라는 요청은 없었음) — LayoutAnimation과 병행

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (8)

### · 새로고침 토스트 위치 하향 + 빈 화면일 때 pull-to-refresh 안 되는 문제 수정

- 토스트 위치 `bottom: 38%` → `bottom: 15%`(화면 하단에 훨씬 가깝게)
- **거래가 적어 콘텐츠가 화면보다 짧으면 당길 여백이 없어 새로고침 제스처가 잘 안 먹히는 문제** — 4개 화면(`calendarStyles`/`listStyles`/`dashboardStyles`/`managementStyles`) 전부 `content`(ScrollView contentContainerStyle)에 `flexGrow: 1` 추가. 콘텐츠가 화면보다 짧을 때도 컨테이너가 뷰포트 전체 높이를 채우도록 만들어 항상 당길 여백이 생기게 하는 RN 표준 해법(Android에서 특히 필요). 정렬 방식(`justifyContent`)은 안 건드려서 기존 레이아웃 그대로 유지됨
- "손을 놓을 때 새로고침되게 해달라"는 요청은 코드 변경 없음 — `RefreshControl`은 원래 OS 기본 동작이 임계값 이상 당긴 뒤 **손을 뗄 때**(iOS `UIRefreshControl`/Android `SwipeRefreshLayout`) 발동하는 구조라 이미 그렇게 동작함. 사용자에게 확인 요청(실기기에서 여전히 다르게 느껴지면 어떤 지점이 다른지 알려달라고)

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (7)

### · 새로고침 완료 표시 — 상단 고정 텍스트 → 화면 하단 중앙 페이드 토스트

> (6)의 "새로고침 완료" 텍스트가 마음에 안 든다는 피드백 — "목업에서 데이터 들어오는 애니메이션 같은 거" 언급했다가, 텍스트로 할 거면 "투명도 주면서 가운데 아랫부분에 잠깐 보여줬다 슬며시 사라지게" 해달라는 구체적 스펙으로 정리.

- `RefreshToast`를 `Animated.Value` 기반 opacity 애니메이션으로 재작성 — 나타날 땐 220ms로 빠르게, 사라질 땐 500ms로 천천히(요청한 "슬며시"). `visible`이 꺼지자마자 언마운트하면 사라지는 애니메이션이 재생될 시간이 없어서, 컴포넌트는 항상 마운트해두고 opacity만 토글하는 방식으로 구현
- 위치를 ScrollView 콘텐츠 맨 위(스크롤하면 같이 밀려 올라감) → 화면 root의 `position: absolute, bottom: 38%, alignSelf 가운데`로 이동 — 스크롤 위치와 무관하게 항상 화면 하단 중앙에 뜨는 오버레이. 반투명 검은 알약(`rgba(21,19,15,0.8)`) + 흰 텍스트로, 테마 색상과 무관하게 항상 같은 톤(일반적인 토스트 UI 관례)
- `colors` prop 제거(더 이상 테마색을 안 써서 불필요) — 4개 화면 모두 `<RefreshToast visible={justRefreshed} label={...} />`로 단순화

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (6)

### · Pull-to-Refresh — 관리 탭에도 추가 + 완료 토스트

> "리스트, 설정에서는 안 보인다"는 리포트. 리스트는 코드 재확인 결과 (5)에서 이미 정상 연결돼 있었음(직전 테스트 타이밍 이슈로 추정, 재확인 필요). 관리(구 설정) 탭은 (5)에서 아예 빠뜨렸던 게 확인돼 이번에 추가 — 이걸로 4탭 전부 적용됨. 관리 탭은 카테고리만 서버 데이터라 `refreshCategories()`만 호출(budgets/고정지출은 로컬 상태, todo 참고).

**"스피너가 도는 중인지 다 불러온 건지 구분이 안 된다" 문제**: 새로고침이 끝나면 1.5초간 "새로고침 완료" 텍스트를 잠깐 보여주는 방식으로 처리 — 앱에 이미 있던 "복사했어요!" 1500ms 토글 패턴(`aiSettlement`/`pendingReview`)과 동일한 방식이라 재사용에 가까움. `src/components/refreshToast.tsx`(신규, `RefreshToast`)를 4개 화면(캘린더/리스트/대시보드/관리) 공용으로 만들어 각 스크린의 `onRefresh` 완료 시점에 `justRefreshed` 상태를 잠깐 켬. i18n `common.refreshed` 3개 언어 추가

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과. 실기기 확인 필요(특히 리스트 탭이 정말 보이는지, 관리 탭 신규 동작).

## 2026-09-03 (5)

### · 당겨서 새로고침(Pull-to-Refresh) 추가

> 캘린더·리스트·대시보드가 화면 진입 시 한 번만 데이터를 불러오고 그 이후엔 자동 갱신이 없어서, 앱을 켜둔 채로 SMS가 들어와도 반영이 안 되는 문제가 있었음(검토 대기만 예외적으로 `refreshPending` 보유). 모바일 웹에서 흔한 pull-to-refresh 패턴 제안 → 채택.

- `transactionsContext`/`categoriesContext`에 각각 `refresh()`(Promise 반환, 확정 거래/카테고리만 재조회) 추가. 기존 `refreshPending`도 프라미스를 반환하도록 살짝 변경(`.then` 체인을 `await`로 바꿔 값을 반환) — 세 개를 `Promise.all`로 한 번에 기다릴 수 있게
- 캘린더/리스트/대시보드 3개 ScrollView에 `RefreshControl` 연결. 캘린더는 검토대기 배지도 갱신해야 해서 `refreshTransactions`+`refreshCategories`+`refreshPending` 셋 다, 리스트/대시보드는 `refreshTransactions`+`refreshCategories`만 호출
- budgets/fixed-expenses는 로컬 상태라 새로고침 대상에서 제외(서버에 없음, todo의 Supabase 이전 검토 항목과 연결)

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (4)

### · 헤더 아이콘 버튼 3개에 텍스트 라벨 추가

> (3)에서 버튼을 넓혔더니 아이콘만 있어서 빈 공간이 어색하다는 취지로 "버튼 크기에 맞게 텍스트를 넣어달라"는 요청.

- `iconBtn`(calendar/list/dashboard 3곳)을 `flexDirection: 'row'` + `gap: 5` + `paddingHorizontal: 8`로 바꾸고 아이콘(18px로 축소) 옆에 짧은 라벨 텍스트를 추가. 새 `iconBtnText` 스타일(11.5px bold) 3개 스타일 파일에 동일하게 추가
- 라벨: 캘린더="검토대기"(`calendar.reviewButton`), 리스트="정산하기"(`list.settleButton`), 대시보드="AI 상담"(`dashboard.aiButton`) — 112px 폭에 맞춰 3~4자로 짧게 잡음. 3개 언어 번역 추가(en: Review/Settle/Ask AI, ja: 確認/精算/AI相談)

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (3)

### · 헤더 아이콘 버튼 3개(캘린더/리스트/대시보드) 원형 → 가로로 넓은 사각형

> (2)에서 버튼 배치를 탭마다 1개로 줄였는데도 "버튼이 너무 작다"는 피드백. 세로는 32px 그대로 두고 가로만 32→112px(3.5배)로 넓히고, 원형(`borderRadius: 16`)이던 걸 사각형(`borderRadius: 10`)으로 변경. `calendarStyles.ts`/`listStyles.ts`/`dashboardStyles.ts`의 `iconBtn` 3곳 동일하게 수정 — 아이콘은 그대로 중앙 정렬이라 버튼 안 빈 공간이 늘어나는 형태(터치 영역 확대 목적)

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-03 (2)

### · 탭바 5개 → 4개 병합, 헤더 아이콘 버튼 재배치, 탭 라벨 텍스트 제거

> AI 어드바이저를 리스트 헤더에 넣고 보니 리스트 탭에 아이콘 버튼이 3개(검토대기/AI 어드바이저/AI 정산)까지 쌓여서 사용자가 "버튼 3개를 밖으로 빼야 할 것 같다"고 지적. 겸사겸사 관리/설정 탭 병합도 요청해서 전체 IA를 다시 정리.

**탭 구조 변경**
- `settings` 탭을 `management` 탭에 병합 — 캘린더/리스트/대시보드/관리 4탭으로 축소. `src/app/(tabs)/settings.tsx`·`src/styles/settingsStyles.ts` 삭제, 내용은 `management.tsx`에 섹션으로 이어붙임(예산/고정지출/카테고리 — 기존 관리, 언어/테마/계정/SMS연동 — 기존 설정). 스타일은 `managementStyles.ts` 하나로 합침(두 파일이 거의 동일한 토큰을 쓰고 있어서 병합 비용이 낮았음)
- `tabs.settings` i18n 키, `SettingsTabIcon`(더 이상 쓰는 곳 없음) 삭제

**헤더 아이콘 버튼 재배치 — 탭마다 최대 1개**
- 검토대기(Inbox): 캘린더 헤더에만 유지 (원래 캘린더·리스트·대시보드 3곳에 중복으로 있던 것 — 9/2에 "눈에 잘 띄게" 일부러 3곳에 뒀던 결정이었지만, 이번 정리로 앱 첫 진입 탭인 캘린더 한 곳으로 축소)
- AI 어드바이저(Chat): 리스트 → 대시보드로 이동 (분석/조언 성격이 통계 화면과 맞음)
- AI 정산(Sparkle): 리스트에 그대로 유지 (거래 골라 정산하는 흐름과 맞음)
- 결과: 리스트=정산 버튼 1개, 대시보드=AI 버튼 1개, 캘린더=검토대기 버튼 1개, 관리=버튼 없음. `listStyles.ts`/`dashboardStyles.ts`에서 안 쓰게 된 `pendingBadge`/`pendingBadgeText` 삭제

**탭바 라벨(텍스트) 제거** — "메뉴에 텍스트 빼서 화면을 넓게 쓰자"는 요청으로 `tabBarShowLabel: false` 추가, 아이콘만 남김. 라벨이 없어져서 탭바 높이도 `insets.top + 56` → `insets.top + 46`으로 축소, `tabsLayoutStyles.ts`의 이제 안 쓰는 `tabLabel` 스타일 삭제하고 `tabItem`을 아이콘 중앙 정렬로 변경

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과. 실기기에서 4탭 레이아웃·버튼 위치 확인은 아직 안 함.

## 2026-09-03 (1)

### · "AI 가계부 도우미" — 자연어 질의 + tool-calling 1차 구현 (배포 전)

> SMS 파이프라인은 사용자가 실사용 QC 중("sms 잘 되고 있어")이라 다음 주제로 넘어감. "AI 좀 별로네" 이후 미뤄뒀던 [[AI 활용처 재검토]] 논의를 여러 턴에 걸쳐 진행 — 카드 추천(실시간 혜택 DB 없음, 리스크 큼)·SMS 카테고리 추론·영수증 OCR·자연어 질의 등을 비교한 끝에, "클로드 코드처럼 데이터를 스스로 조회하며 조언하는" 자연어 질의를 1순위로 선택. Claude API 사용 가능 여부도 논의(Claude.ai/Claude Code 구독과 API는 별도 상품·별도 과금이라는 점 설명) → 우선 지금 쓰는 Gemini 무료 티어를 유지하고, 힘들어지면 그때 Claude API로 전환하기로 결정

**아키텍처 — LLM이 스스로 여러 번 조회하는 tool-calling 루프**
- `supabase/functions/ai-advisor/index.ts` (신규): Gemini function calling(`tools: [{ functionDeclarations }]`)으로 3개 읽기 전용 도구를 선언 — `getCategoryTotals`(기간별 카테고리 합계), `comparePeriods`(두 기간 비교), `searchTransactions`(조건별 거래 검색). 모델이 `functionCall`을 반환하면 실행 후 `functionResponse`를 다시 넣어주는 루프를 최대 6회 반복, 함수 호출 없이 텍스트만 오면 종료. 모델 폴백 체인(`gemini-3.7-flash` → `3.5-flash` → `2.5-flash`)과 모델당 25s 타임아웃은 ai-settlement와 동일하게 재사용
- **budgets 예산 도구는 v1에서 뺌** — `budgets-context`/`fixed-expenses-context`가 아직 Supabase가 아니라 로컬 메모리 상태([[budgets-context-supabase-이전-검토]], todo 참고)라 Edge Function에서 서버 쿼리로 조회할 수 없음. 나중에 이 둘을 Supabase로 옮기면 예산 대비 도구 추가 가능
- **인증 방식이 기존 두 함수와 다름** — sms-ingest(service role, 토큰으로 사용자 식별)도 ai-settlement(DB 미접근)도 아니고, 로그인된 사용자가 직접 호출하는 상황이라 호출자의 JWT를 그대로 PostgREST에 넘겨 RLS로 본인 데이터만 보이게 함(`Authorization` 헤더 포워딩 + `apikey`는 anon key). service role을 안 쓰므로 사용자 식별 로직이 따로 필요 없음
- Gemini function calling의 정확한 요청/응답 스키마(`functionDeclarations`의 파라미터 타입은 소문자 `object`/`string`, `contents`의 함수 결과 턴은 `role: "user"`)는 프로젝트에 처음 쓰는 기능이라 추측 대신 `ai.google.dev` 공식 문서를 WebFetch로 확인 후 구현

**클라이언트**
- `src/app/aiAdvisor.tsx` (신규, `AiAdvisorModal`) — 멀티턴 채팅 UI(말풍선 리스트 + 하단 입력창). 클라이언트는 `{role, text}[]` 형태의 대화 이력만 들고 있다가 매 질문마다 Edge Function에 전체 이력 + 새 메시지 + 오늘 날짜(`TODAY.dateStr`) + 언어를 보내는 무상태(stateless) 방식(ai-settlement와 동일 패턴) — 함수 호출 왕복 내역은 서버 쪽에서만 돌고 클라이언트 이력에는 안 쌓임
- 첫 진입 시 안내 문구 + 예시 질문 3개(칩 형태, 탭하면 바로 전송)를 보여줘서 뭘 물어볼 수 있는지 힌트 제공
- `src/components/icons.tsx`에 `ChatIcon`(말풍선+점 세 개, 기존 손그림 라인아트 스타일) 추가
- `src/app/(tabs)/list.tsx` 헤더에 진입 버튼 추가(AI 정산 버튼 옆) — 사용자가 "우선 진행한 다음 UI 보고 배치 조정하자"고 해서 위치는 잠정 배치, 실기기 확인 후 재배치 가능
- `src/app/_layout.tsx`에 `aiAdvisor` 모달 라우트 등록, i18n 3개 언어(ko/en/ja) 번역 추가

**배포 완료**: Supabase CLI가 이미 로그인·프로젝트 연결(household-ledger) 상태였고 GEMINI_API_KEY도 이미 설정돼 있어서 세션 내에서 바로 `supabase functions deploy ai-advisor` 실행. 무인증 curl 호출 시 401(게이트웨이가 verify_jwt로 정상 거부) 확인 — 함수 자체는 정상 응답.

**스코프 가드 보강 (배포 후 사용자 질문으로 발견)**: "도쿄 날씨 어때?" 같은 가계부 무관 질문을 던지면 어떻게 되냐는 질문에, 당시 프롬프트엔 범위 제한이 전혀 없어서 Gemini가 학습 지식으로 (부정확하게) 답할 위험이 있음을 확인. 시스템 프롬프트에 "답할 수 있는/없는 범위" 명시 섹션 추가:
- 날씨·뉴스·환율·번역·코딩 등 가계부 무관 질문은 답 시도 없이 짧게 안내 후 예시 질문 제안하도록 지시
- **예산 질문도 별도로 막음** — budgets 도구가 없어서(위 참고) 예산 관련 질문에 숫자를 지어낼 위험이 있었는데, "예산 기능 미지원"이라고 솔직히 답하도록 명시
- 프롬프트 인젝션("이전 지시 무시해" 등) 방어 문구도 추가
재배포 완료.

**남은 단계**: 실기기(로그인 상태)에서 실제 대화 확인 → UI 배치 조정

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과 + 배포 후 게이트웨이 응답 확인. 실기기에서의 실제 대화 동작은 아직 미검증.

## 2026-09-02 (3)

### · 검토 UI 배치 조정, 상호명 수정, 오늘 날짜 수정, todo 정리

- **오늘 날짜 하드코딩 제거** — `transactionsContext`의 `TODAY`가 `{ year: 2026, month: 8, day: 30 }` 고정값이라 앱을 켜면 캘린더가 항상 8월 30일에 포커스됐다. 8월 데이터로 개발하던 시절 값이 남은 것. 앱 시작 시 기기 날짜를 계산하도록 변경 — 캘린더 포커스·새 거래 기본 날짜·AI 정산의 "오늘 거래" 후보가 전부 이 값을 본다. 모듈 로드 시 1회 계산이라 앱을 켜둔 채 자정을 넘기면 다음 실행 때 갱신됨
- **검토 대기 진입점 위치 3번 바뀜** — ① 대시보드 카드 배너 → ② 하단 전역 바 → ③ 헤더 아이콘 버튼 + 숫자 뱃지(최종). ②는 기기마다 `insets.bottom`(홈 인디케이터 여백)이 달라 아래 빈 공간이 크게 보인다는 피드백으로 폐기. ③은 캘린더·리스트·대시보드 헤더에 기존 아이콘 버튼(32px 원형)과 같은 스타일로 배치, 대기 건 0이면 버튼 자체를 숨김. `InboxIcon` 신규 추가
- **검토 화면에서 상호명 수정 가능** — 이체로 들어온 건("카카오페이")을 "회식 술값"처럼 고쳐서 추가할 수 있어야 한다는 요구. 상호명을 `TextInput`으로 바꾸고 수정값은 승인 시점에만 저장(삭제하거나 화면을 닫으면 원래대로). 거래 편집 모달(`modal.tsx`) 재사용도 검토했으나 그 모달이 확정 거래만 조회하도록 돼 있어 수정 범위가 커져서 검토 화면 안에서 해결
- **죽어 있던 필터 버튼 제거** — 캘린더·리스트 헤더의 필터 아이콘 버튼은 `onPress`가 없는 껍데기였다. 버튼과 `FilterIcon` 컴포넌트 모두 삭제, 캘린더의 `filterBtn` 스타일은 검토 버튼이 재사용하므로 `iconBtn`으로 이름 변경
- **todo에서 2건 제거(완료가 아니라 추적 중단)** — 사용자 요청으로 아래 두 항목을 todo에서 뺐다. 나중에 다시 필요해질 수 있어 내용만 여기 남긴다:
  - *카테고리 로딩 간헐적 실패 (`PGRST303: JWT issued at future`)* — `categoriesContext`의 Supabase fetch가 가끔 실패해 카테고리 아이콘이 안 보이던 현상. JWT의 `iat`가 서버 기준 미래라 거부되는 것으로, 기기 시계 오차 또는 토큰 갱신 타이밍 문제로 추정했었다. 재발하면 `supabase.auth.refreshSession()` 후 재시도하는 방향으로 검토
  - *웹(Expo web) SSR 크래시* — `expo start --web`/`export -p web`에서 `ReferenceError: window is not defined`. `app.json`의 `web.output: "static"`이 라우트를 Node에서 프리렌더링하는데 Supabase `auth-js`가 세션 복구 시 `AsyncStorage.getItem`을 호출해서 발생. 웹 배포를 하게 되면 `supabase.ts`의 storage를 SSR에서 no-op으로 우회하거나 해당 라우트를 client-only로 전환

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-02 (2)

### · 문자(SMS) 자동입력 파이프라인 — 앱/서버 구현 (스키마 미적용, 미배포)

> todo의 "SMS 자동입력 파이프라인" 착수. 사용자가 카카오뱅크 입출금 문자 스크린샷(`개인첨부/sns.png`, gitignore 대상)을 제공.

**문자 판정 방식 — 온점 규칙 대신 구조 매칭.** 사용자는 "결제 문자엔 온점(`.`)이 없고 알림 문자는 길다"는 규칙을 제안했는데, 반례가 있어서 채택하지 않음 — 8월 임포트 데이터의 `ALIPAY CONNECT PTE. LTD`처럼 가맹점명에 온점이 들어가는 결제가 실제로 존재한다. 대신 문자 전체를 정규식 한 방으로 구조 매칭한다(`[카카오뱅크]` → `이름(4자리)` → `MM/DD HH:MM` → `출금|입금 N원` → 가맹점 → `잔액 N원`). 자동이체 등록/ATM 한도/인증서 재발급 같은 알림 문자는 이 구조를 못 맞춰 자연히 걸러짐. 로컬 테스트 9케이스(결제 2·이체 2·입금 1·온점 포함 1·알림 3) 전부 기대대로 통과
- 연도가 없는 형식(`09/01`)이라 수신 시점(KST) 기준으로 채우되 12월↔1월 경계만 연도를 옮김. Edge 런타임이 UTC라 `Date.now() + 9h`로 한국 날짜를 계산

**추가/변경 파일**
- `supabase/schema_v3_sms_ingest.sql` (신규) — `transactions`에 `status`(confirmed/pending_review)·`source`(manual/sms)·`raw_message` 추가, `sms_ingest_tokens` 테이블(토큰 기본값은 pgcrypto `gen_random_bytes(24)`) + RLS
- `supabase/functions/sms-ingest/{parse.ts,index.ts}` (신규) — 토큰으로 사용자 식별 → 파싱 → 카테고리 추론 → `pending_review`로 저장. 같은 (날짜·시각·금액·가맹점) 건이 있으면 중복으로 보고 skip. supabase-js 없이 PostgREST를 fetch로 직접 호출(의존성 0, 배포 리스크 최소화)
- `src/store/transactionsContext.tsx` — **가계부 조회에 `status='confirmed'` 필터 추가**(이걸 빠뜨리면 검토 전 건이 그대로 가계부에 섞인다). `pendingTransactions` 상태와 `approvePending`/`rejectPending`/`refreshPending` 추가, 둘 다 optimistic update + 실패 시 롤백
- `src/app/pendingReview.tsx` + `src/styles/pendingReviewStyles.ts` (신규) — 검토 목록 모달. 건별로 카테고리 재지정(기존 `categoryPicker` 모달과 `categoryPickerBridge` 재사용) 후 추가/삭제
- `src/app/(tabs)/dashboard.tsx` — 대기 건이 있을 때만 상단에 건수 배너 표시(사용자 선택: 상시 탭 대신 배너 + 전용 화면)
- `src/hooks/useSmsIngestToken.ts` (신규) — 토큰 조회/발급. Provider 없는 훅이라 `useXxx.ts` 컨벤션 적용. `expo-crypto`가 없어서 토큰 생성은 DB 기본값에 위임
- `src/app/(tabs)/settings.tsx` — "문자 연동" 섹션(토큰 발급/재발급/복사). 발급 시 클립보드에 자동 복사
- i18n 키 ko/en/ja 추가(`pendingReview.*`, `dashboard.pendingReviewBanner`, `settings.sms*`)

**카테고리 추론**: 사용자 결정대로 "같은 가맹점의 가장 최근 confirmed 거래" 카테고리를 물려준다(정확 일치 → 부분 일치(ilike) → 없으면 `etc`). Gemini는 쓰지 않음. 이체·충전(카카오페이/저금통) 문자도 거르지 않고 전부 저장 후 사람이 판단 — 이걸로 todo의 "이체 처리 방식 결정" 항목도 정리됨

**남은 단계**: ① 사용자가 `schema_v3_sms_ingest.sql`을 SQL Editor에서 실행 ② `supabase functions deploy sms-ingest --no-verify-jwt`(단축어는 JWT를 못 만들어서 JWT 검증 끄고 배포해야 함) ③ 앱에서 토큰 발급 ④ iOS 단축어 자동화 작성 ⑤ 실기기 검증

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 통과 + 파서 로컬 테스트 9/9. 배포·실기기 동작은 미검증.

## 2026-09-02 (1)

### · AI 정산 — 자연어 LLM 연동 (Gemini, 미배포)

> todo의 "AI 정산 — 실제 LLM 연동" 착수. LLM은 상시 무료 티어가 있는 Google Gemini API로 선택(Anthropic/OpenAI는 상시 무료 티어 없음).

- `supabase/functions/ai-settlement/index.ts` 신규: 클라이언트가 `{ text, participants, rounds }`(rounds는 이미 선택된 거래의 id/label/total)를 보내면, Gemini(`gemini-3.7-flash`, `response_schema`로 구조화 출력 강제)에 프롬프트를 던져 `{ participants, rounds: [{ id, attendees, extras }] }`를 받아 그대로 반환. 계산 로직(`calculateSettlement`)은 건드리지 않고 폼 상태만 채우는 방식 — todo에 적어둔 설계 의도 그대로 구현
  - "1차/2차..." 같은 순서 표현은 클라이언트가 보낸 rounds 배열 순서에 그대로 대응하도록 프롬프트에 명시
  - round id는 클라이언트가 보낸 값만 신뢰(응답에서 모르는 id는 필터링) — 모델이 id를 지어내는 경우 방지
  - JWT 검증은 Supabase Edge Function 기본값(verify_jwt) 그대로 사용 — 로그인 안 하면 호출 불가
- `src/app/aiSettlement.tsx`: 참가자 목록 채운 뒤 나오는 화면에 "AI로 채우기" 자연어 입력창 + 버튼 추가. `supabase.functions.invoke('ai-settlement', ...)` 호출 후 응답으로 `participants`/`attendeesByTx`/`extrasByTx` state를 채움. 실패 시 `Alert.alert`
- i18n 키 8개(`aiFillLabel` 등) ko/en/ja 추가, `aiSettlementStyles.ts`에 `aiInput`/`aiFillBtn` 스타일 추가
- `tsconfig.json`에 `supabase/functions` exclude 추가 — Deno 런타임 전역(`Deno.serve` 등)이 RN 앱의 tsc 검사에 걸려서 타입 에러 발생하던 것 회피 (별도 런타임이라 프로젝트 tsconfig 대상이 아님)

**배포 완료** (사용자가 `supabase login`/`link`/`secrets set` 실행, 함수 배포 및 검증은 세션 내에서 진행):
```
supabase link --project-ref frolpdeoogpnhbkmsdzc
supabase secrets set GEMINI_API_KEY=<AI Studio 발급 키>
supabase functions deploy ai-settlement
```

**알려진 이슈 — `gemini-3.7-flash` 503(UNAVAILABLE) 빈발**: 첫 배포 후 호출 테스트에서 최신 flash 모델이 무료 티어 과부하로 계속 503 반환("This model is currently experiencing high demand"), 3회 연속 실패 + 한 번은 Edge Function idle timeout(150s)까지 걸림. 대응:
- 모델 폴백 체인 도입 — `gemini-3.7-flash` → `gemini-3.5-flash` → `gemini-2.5-flash` 순으로 시도, 429/500/503일 때만 다음 모델로 넘어가고 그 외 에러(잘못된 키, 스키마 오류 등)는 즉시 실패시켜 무의미한 재시도 방지
- 모델당 `AbortSignal.timeout(25s)` — 한 모델이 늘어져서 함수 전체가 150s idle timeout에 걸리는 것 방지
- 재배포 후 실제 호출 성공(HTTP 200): "2차엔 민수 빠졌고, 3차 택시비 20000원은 철수한테만" → 2차 attendees에서 민수 제외 + 3차 extras에 택시비 20000/철수 정확히 채워짐

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과 + 배포된 함수 curl 호출 200 확인. 앱 UI에서의 실기기(Expo Go) 확인은 아직 안 함.

## 2026-09-01 (7)

### · AI 정산 — 포커스 시 수동 scrollTo로 키보드 위 여유 간격 추가 (재시도)

> `contentInset` 방식이 안 먹혀서, 포커스된 입력창 기준으로 직접 `scrollTo`를 호출하는 방식으로 재시도.

- `onScroll`로 현재 스크롤 Y좌표를 `scrollYRef`에 저장(`scrollEventThrottle={16}`)
- 참가자 입력/예외 라벨/예외 금액 3개 `TextInput`에 `onFocus={handleInputFocus}` 연결 — `automaticallyAdjustKeyboardInsets`의 자동 스크롤이 끝나길 250ms 기다린 뒤, 현재 위치에서 20px 더 스크롤(iOS만)
- 250ms 딜레이는 임의값 — 너무 빠르면 자동 스크롤과 겹쳐서 튈 수 있고, 너무 느리면 사용자가 이미 타이핑을 시작한 뒤에 화면이 움직여서 어색할 수 있음. 실기기 확인 필요

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-01 (6)

### · AI 정산 — 키보드 위 여유 간격 20px 추가 (효과 없어서 되돌림)

- 이중 보정 제거 후 딱 맞게 붙어서(간격 0) 답답하다고 해서, iOS `ScrollView`에 `contentInset={{ bottom: 20 }}` 추가해봤으나 사용자가 "변한 게 없다"고 확인 — `automaticallyAdjustKeyboardInsets`가 활성화된 상태에서는 수동 `contentInset`이 내부적으로 무시/덮어써지는 것으로 추정. 원상복구함. 간격을 늘리려면 다른 방법(예: 포커스 시 `scrollTo`로 수동 보정) 필요 — 다음에 요청 오면 그쪽으로 접근

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-01 (5)

### · AI 정산 — iOS 키보드 과도 상승 수정 (이중 보정 제거)

> "처음엔 적당했는데 automaticallyAdjustKeyboardInsets 추가하니 볼륨버튼 부근까지 올라간다"는 리포트. `KeyboardAvoidingView`(padding)와 `ScrollView`의 `automaticallyAdjustKeyboardInsets`가 iOS에서 동시에 키보드 높이만큼 보정하면서 두 배로 밀어올려진 것 — 수치 튜닝이 아니라 중복 로직 제거로 해결.

- iOS는 `KeyboardAvoidingView`의 `behavior`를 `undefined`로(사실상 비활성화), `ScrollView`의 `automaticallyAdjustKeyboardInsets` 하나만 남김 — 포커스된 입력창만 정밀하게 스크롤
- Android는 `automaticallyAdjustKeyboardInsets`가 없어서 `KeyboardAvoidingView behavior="height"` 그대로 유지
- `keyboardVerticalOffset`은 더 이상 안 씀 (behavior 비활성화 시 무의미해서 제거)

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-01 (4)

### · AI 정산 — 키보드 스크롤 보완 + 계산 후 결과로 자동 스크롤

> 사용자가 실기기에서 테스트하다 리포트한 이슈들. "JSX closing tag" / "Element type is invalid" 크래시는 확인해보니 현재 파일은 태그가 정상적으로 닫혀 있고 `tsc`/`expo export` 모두 통과 — 편집 도중 상태를 Metro가 캐시해서 보여준 것으로 추정, 코드 수정 없이 리로드 안내만 함. "JWT issued at future"로 카테고리/아이콘이 간헐적으로 안 불러와지는 문제는 원인(기기 시계 오차 추정)만 파악하고 재현이 간헐적이라 todo에 기록만 함(수정은 다음 세션에서 재현 조건 확인 후 진행).

- `KeyboardAvoidingView`에 `keyboardVerticalOffset` 추가, Android `behavior`도 `undefined` → `'height'`로 명시(윈도우 리사이즈에만 기대지 않도록)
- `ScrollView`에 `automaticallyAdjustKeyboardInsets` 추가 — iOS에서 포커스된 입력 필드를 키보드 위로 자동 스크롤
- `계산하기` 버튼 클릭 후 결과 카드가 생기면 `useEffect`로 `scrollRef.current?.scrollToEnd()` 호출해서 자동으로 결과가 보이는 위치까지 스크롤

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-01 (3)

### · AI 정산 예외 항목 UX 개선 + 키보드 가림 문제 수정

- **× 텍스트가 곱셈처럼 보이는 문제** — 참가자 칩/예외 항목 삭제 버튼의 텍스트 `×`를 전부 아이콘(`CloseIcon`, 신규 추가)으로 교체, 작은 원형 배경(`chipRemoveBtn`)에 담아서 "삭제 버튼"임을 명확히 함
- **예외 항목이 불친절한 문제** — 예외 항목을 각각 독립된 카드(`extraCard`)로 감싸고, 상단에 "예외 항목 N" 라벨 + 삭제 버튼, 하단에 "누구한테 부과할까요?" 서브라벨을 추가. 카드 위에는 "체크한 사람에게만 이 금액이 추가로 나눠 부과돼요" 설명문 추가
- **추가 버튼이 텍스트 링크 같았던 문제** — "+ 예외 추가"를 `PlusIcon` + 텍스트가 든 pill 버튼으로 변경 (`addExtraBtn` 스타일 배경/패딩 추가)
- **입력 중인 칸이 키보드에 가려지는 문제** — 화면 최상위를 `View` → `KeyboardAvoidingView`(iOS는 `padding`, Android는 기본 동작)로 교체. 이 앱에 `KeyboardAvoidingView` 패턴이 없어서 새로 도입 (기존 `modal.tsx`는 `InputAccessoryView`만 사용 — 키보드 위 액세서리 바이지 내용을 밀어올리진 않음)
- 3개 언어 i18n 키 추가(`extraHint`/`extraItem`/`extraAppliesTo`), `extraLabelPlaceholder`/`addExtra` 문구도 카드 구조에 맞게 다듬음

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

## 2026-09-01 (2)

### · AI 정산 참가자 입력 — 스페이스로 여러 명 한번에 추가

> "N분의 1 빠른 계산기" 아이디어를 제안받았으나, 사용자가 AI 정산 모달로 이미 충분하다고 판단해 드롭. 대신 참가자 입력 UX를 개선.

- `handleAddParticipant`가 입력값을 공백(`\s+`) 기준으로 분리해 여러 이름을 한 번에 추가하도록 변경 (`"a b c d"` + 엔터 → 4명 개별 추가). 중복은 배치 내부/기존 목록 양쪽에서 제거
- 참가자 입력 섹션에 안내 문구(`participantHint`) 추가, 3개 언어 번역 포함

**검증**: `tsc --noEmit`, `expo-doctor`(18/18) 통과.

## 2026-09-01 (1)

### · "AI 정산" 기능 설계 + 1차 구현 (구조화 폼 버전, 실제 LLM 미연동)

> 사용자가 회식비 n분의 1 계산을 AI로 하고 싶다고 해서 여러 턴에 걸쳐 대화로 기능을 구체화. 최종 합의된 모델과 "일단 대충 만들어보자"는 요청으로 뼈대 구현까지 진행.

**설계 과정에서 정리된 것**
- 인풋: 완전 자유 텍스트가 아니라, 구조화된 폼(참가자 추가 + 차수별 참석자 체크 + 예외 항목)으로 결정. 이유: 돈 계산은 LLM이 직접 암산하면 위험하고, 애매한 자연어 파싱(인원수에 결제자 포함 여부 등)도 실수 여지가 큼
- 확인 UX: AI가 추정한 거래 목록을 사용자가 리스트에서 체크/해제하며 확인하는 방식. 톤은 사용자가 공유한 참고 스크린샷("~할까요?" 식 캐주얼한 질문형)을 참고하기로 함
- 출력: 도넛차트(금액 시각화) + 복사 가능한 정산 문구, 둘 다 제공하기로 결정
- 위치: 리스트 탭에 진입 버튼(필터 아이콘 옆), 화면은 기존 모달들과 같은 전체화면 모달 패턴 재사용
- 아키텍처 원칙: "LLM은 해석만, 계산은 결정론적 코드로" — 나중에 실제 자연어 입력을 붙일 때도 이번에 만든 데이터 구조(`SettlementRound`/`SettlementExtra`)를 그대로 채우기만 하면 되게 설계

**구현**
- `src/lib/settlement.ts` (신규) — `calculateSettlement()`: 차수별 총액에서 예외 항목을 빼고 참석자 수로 나눈 기본 분담금 + 예외 항목은 지정된 인원끼리만 나눔. `buildSettlementMessage()`: 캐주얼 톤 정산 문구 생성
- `src/app/aiSettlement.tsx` (신규, `AiSettlementModal`) — 오늘자 지출 거래 선택 → 참가자 추가(카테고리 소분류 추가와 같은 칩 UI 재사용) → 차수별 참석자/예외 체크 → 계산 → 결과(도넛차트는 `dashboard.tsx`의 기존 SVG 패턴 재사용 + 사람별 순위 리스트 + 복사 버튼)
- `expo-clipboard` 추가 (`npx expo install`로 SDK 호환 버전 설치)
- 아이콘 2개 추가: `SparkleIcon`(진입 버튼), `CopyIcon`(복사 버튼) — 기존 손그림 라인아트 스타일 유지
- `src/app/(tabs)/list.tsx` — 헤더에 정산 진입 버튼 추가(필터 아이콘 옆), `listStyles.ts`에 `headerActions` 행 스타일 추가
- `src/app/_layout.tsx`에 `aiSettlement` 모달 라우트 등록
- `i18n` 3개 언어(ko/en/ja) 전부에 `aiSettlement` 네임스페이스 번역 추가

**의도적으로 미룬 것 (todo에 기록)**
- 실제 자연어 입력 → AI가 폼을 채워주는 부분은 API 키/Edge Function 설정이 필요해서 이번엔 안 함. 지금은 사람이 직접 폼을 채움
- 거래 검색은 "오늘"로 한정 (`TODAY` 상수 기준), 날짜 걸치는 정산은 아직 미지원

**검증**: `tsc --noEmit`, `expo-doctor`(18/18), `expo export -p ios` 전부 통과.

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
