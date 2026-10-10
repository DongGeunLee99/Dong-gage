# AI 채팅 데이터 조작 — "합치기" 프로토타입 계획

> 작성 2026-10-10. 상태: **계획만 확정 전(결정 A·B 대기), 코드 미착수.**
> 사용자가 "AI처럼 채팅으로 가계부 데이터를 조작(나누기/합치기/재분류 등)하고 싶다"고 해서 논의한 결과.
> 우선 **"합치기" 하나만 프로토타입** → 검증되면 같은 틀로 나머지 액션 확장.
> LLM은 지금 Gemini 무료 티어 유지, **상용화 가능성 보이면 그때 유료 AI API로 교체**(이 구조 그대로, Edge Function의 모델 호출부만 교체).

## 배경 — 이미 있는 것 (재활용)
- **AI 어드바이저**(`src/app/aiAdvisor.tsx` + `supabase/functions/ai-advisor/index.ts`): 자연어 채팅으로 가계부를 여러 번 조회해 답하는 Gemini **tool-calling 루프**. 지금은 **읽기 전용** 도구만(getCategoryTotals / comparePeriods / searchTransactions). 호출자 JWT를 PostgREST에 넘겨 **RLS로 본인 데이터만** 접근.
  - 채팅 클라이언트 구조: `messages: {role, text}[]` + `supabase.functions.invoke('ai-advisor', { history, message, today, language })` → 응답 `{ text }`를 모델 버블로 렌더.
- **AI 정산**(`ai-settlement`): 거래를 사람 수로 나눔(지금은 "오늘" 거래만 — 범위 확장은 별도 todo).
- **쓰기 액션 전부 존재**(`src/store/transactionsContext.tsx`): `addTransaction` / `updateTransaction` / `deleteTransaction` / `bulkDelete` / `bulkUpdateFields` / `bulkUpdateCategory`. 전부 **실패 토스트 + DB 롤백**(2026-10-10 Phase 1) 적용됨.

→ "읽는 채팅"은 완성돼 있고, 여기에 **쓰기 도구 + 실행 전 확인(채팅 안 카드)**만 얹으면 됨.

## 핵심 안전 원칙
**서버는 제안만, 실행은 클라이언트가 사용자 확인 후.**
Edge Function은 "합칠 후보를 찾아 제안"하는 **읽기 전용 도구**만 추가(서버에서 직접 삭제/생성하지 않음). 실제 쓰기는 채팅 안 **확인 카드**를 탭했을 때만 클라이언트가 수행(토스트+롤백 경로 재사용). LLM이 대상을 잘못 집어도 사용자가 눈으로 보고 승인해야 실행됨 — 과거 "도희네집 데이터 유실" 같은 사고 방지.

## 대화 흐름(예)
```
나:  어제 뽑기 지출 하나로 합쳐줘
AI:  (proposeMerge 호출 → 어제+'뽑기' 12건 조회) "12건 찾았어요, 합계 48,000원. 하나로 합칠까요?"
     [확인 카드] 12건 → 1건 · 여가>뽑기 · "뽑기" · 10/09 · 48,000원   [합치기] [취소]
나:  (합치기 탭) → 원본 12건 삭제 + 1건 생성 → "합쳤어요" 토스트 + 완료 메시지
```
애매하면 AI가 되물음("어느 카테고리로?", "A가 2번 찍혔는데 둘 다 포함?").

## 생성/수정 파일 (신규 3 · 수정 3)
| 파일 | 변경 |
| --- | --- |
| `supabase/functions/ai-advisor/index.ts` | **`proposeMerge` 도구 추가**(읽기 전용): 기간/상호명/카테고리로 후보를 찾아 **id 목록 + 합계 + 제안 1건(날짜·카테고리·상호명·금액=합계)** 반환. 응답에 마지막 proposeMerge 결과를 `pendingAction`으로 실어 보냄. 시스템 프롬프트에 "제안만, 실제 합치기는 사용자가 카드 버튼으로 실행" 명시 |
| `src/store/transactionsContext.tsx` | **`mergeTransactions(deleteIds, create)`** 신규 — `addTransaction(create)` + `bulkDelete(deleteIds)`를 묶어 실행(토스트 1회), 실패 롤백 |
| `src/app/aiAdvisor.tsx` | 응답의 `pendingAction` 처리 → 해당 메시지에 확인 카드 렌더. `ChatMessage`에 `action?` 추가. 확인 시 `mergeTransactions` 호출 → 결과 메시지/토스트, 카드 비활성화 |
| `src/components/mergeProposalCard.tsx` (신규) | 채팅 안 확인 카드(미리보기 + 합치기/취소) |
| `src/styles/mergeProposalCardStyles.ts` (신규) | 카드 스타일(`createStyles(colors)`) |
| i18n `ko/en/ja` | 카드 라벨(합치기/취소/"N건→1건" 등) |

## 결정 2가지 (착수 전 사용자 확인 필요)
**A. 합쳐질 1건의 값**
- (추천) **서버 자동 산정**(금액=합계, 날짜=후보 같은 날이면 그 날/아니면 최신, 카테고리·상호명=최빈값) → 카드에서 그대로 확인만. 세부 편집은 나중 확장.
- 대안: 카드에서 날짜/카테고리/상호명 직접 수정 후 합치기.

**B. 안전 제약**
- (추천) **같은 타입(지출끼리/수입끼리)만**, 후보 0건이면 카드 없이 "없어요", **10건 이상 삭제 시 카드에 경고 강조**.
- 대안: 제약 최소화(위험↑, 비권장).

## 검증 / 배포 / 한계
- `tsc --noEmit` / `expo export -p ios`(임시) / `expo-doctor`
- **웹에서 1차 검증 가능**: 확인 카드 UI·합치기 버튼 흐름(가짜 `pendingAction`으로 렌더/실행). 단 **실제 AI 응답은 로그인+Gemini 필요**라 그 부분은 기기에서 확인.
- **Edge Function 배포는 사용자**: `supabase functions deploy ai-advisor` (Claude가 배포 못 함).

## 범위 선긋기
이번엔 **"합치기" 액션 하나만.** "나누기/재분류/삭제"는 이 틀(제안 도구 + 확인 카드 + 클라 실행)이 검증되면 같은 패턴으로 확장. AGENTS.md의 "자동 감지/자동화 금지"는 *이체 자동 분류* 같은 걸 막는 규칙이라, **사람이 직접 명령·확인하는 이 조작과는 무관**.
