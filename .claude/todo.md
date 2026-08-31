# TODO — 나중에 할 일

> 완료 항목은 [log.md](log.md) 참고.

---

## 미완료

- [ ] **Git 저장소 초기화** — 지금 프로젝트가 git 저장소가 아님. `git init` + `.gitignore`(`.env`, `node_modules/` 등) 확인 후 초기 커밋
- [ ] **새 카테고리 아이콘 손그림 재작업** — 주거·통신/건강/여가·문화/경조사·비정기/금융 5개는 현재 `@expo/vector-icons`(Ionicons) 임시 사용 중. 기존 식비/교통/쇼핑/기타(손그림 SVG, `src/components/icons.tsx`)와 스타일이 달라서 통일 필요
- [ ] **앱 아이콘(홈 화면/스플래시) 제작** — 지금은 Expo 기본 템플릿 아이콘 그대로임 (`assets/images/icon.png`, `assets/expo.icon`, `assets/images/android-icon-*.png`). 실제 앱 아이덴티티에 맞는 아이콘으로 교체 필요
- [ ] **"이체(계좌간 전환)" 거래 처리 방식 결정** — 8월 데이터 임포트 시 88건 전부 제외함. 문자 자동입력 붙일 때 다시 설계하기로 함
- [ ] **SMS 자동입력 파이프라인** — iOS 단축어 → Supabase Edge Function → `pending_review` 상태로 저장하는 흐름, 초기 설계만 해두고 미착수
- [ ] **budgets-context / fixed-expenses-context도 Supabase로 이전할지 검토** — 지금은 categories/transactions만 이전됨, 이 둘은 여전히 로컬 메모리 상태(앱 재시작하면 초기화)
- [ ] Expo Go 개발 중 카카오 로그인 테스트하려면 매번 `npx expo start --tunnel`로 켜야 함 (일반 모드는 `exp://<로컬IP>` 리다이렉트가 Supabase 허용 목록과 매칭 안 되는 알려진 버그)

---

## 완료

<!-- 완료 시 여기로 이동, 날짜와 함께 -->
