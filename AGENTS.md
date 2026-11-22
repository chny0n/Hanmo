# Agent instructions

이 저장소의 자동화·코딩 에이전트는 먼저 루트 [agent.md](agent.md)를 읽고 해당 운영 규칙을 따릅니다.

- **[docs/architecture.md](docs/architecture.md)는 현재 유효한 제품·기술 설계의 유일한 기준 문서**입니다. 변경 이력·폐기된 안을 누적하지 않으며, 결정되지 않은 설계는 문서 하단의 **미결 사항 / GitHub Issue**로 관리합니다.
- 확정된 **문서만** 고칠 때에는 별도 문서 PR을 만들지 않고 `main`에 직접 커밋합니다. 코드 변경은 별도의 PR·테스트·승인 규칙을 따릅니다.
- **주석 언어 강제(2026-11-21):** 모든 신규/수정 코드의 자연어 주석·JSDoc 설명은 **한국어로만 작성**. 영어로만 된 설명 주석 금지, 태그·식별자·표준 라이선스/지시문만 예외. [`docs/comment-guidelines.md`](docs/comment-guidelines.md) 및 CI 검사를 준수합니다.
- **새 언어 정책(2026-11-21):** UI는 역사적 동결 기준 `da30a87510f1cdac282600fa4e914da2585a6031`를 바탕으로, 사용자 승인된 후속 변경을 [현행 파일별 UI 기준선](scripts/baselines/ui-freeze.json)에 반영해 보호합니다. 차수와 무관하게 **새 기능·테스트는 JavaScript + JSDoc**로 작성하고, 신규 `.ts`/`.tsx` 파일과 기존 TS에 새 기능 추가를 금지합니다. 학업 코드 전체를 **JavaScript/JSDoc으로 통일**하고, `.ts`/`.tsx`/`.mts`/`.cts` 파일 추가를 CI에서 차단합니다. [PR #102](https://github.com/ot4562-glitch/Hanmo_develop/pull/102) 병합 이후 학업 소스와 테스트는 JavaScript와 JSDoc으로 유지합니다. **4차는 DB·실기기 등 최종 통합/운영 인수**로 남습니다. **2차 RECONNECT는 새 탭 기본 OFF·같은 탭 선택 유지, 접속 대기 두 설정(강의 기본 예·페이지 기본 아니오), 404 복구 후 대기 적용**을 포함합니다. **Supabase #93은 별도 Draft·main 미병합**으로 실제 운영 DB 연결과 구별합니다.
- **1단계 학업 코어 `js/academic/`, 학생용 화면 `html/`, 스타일 `css/`** 및 **원본 `practice.html`·`selectZone.html` 동작 변경 금지**, **2단계 원개발자 사전 승인**, **3단계 Supabase 소유·운영은 임창용 님과 협의**, **4단계 이전 구현과 동등성·회귀 검증**을 지킵니다.
