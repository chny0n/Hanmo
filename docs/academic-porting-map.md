# HUFS One AI → Hanmo 이식 및 JavaScript 전환 경계

2026-11-21 결정: **새 기능·테스트는 차수와 관계없이 JavaScript + JSDoc만 사용**합니다. TypeScript는 이전 HUFS One AI에서 이식할 때 사용한 과도기 원본과 현재 혼입돼 있는 TS의 이관 기준일 뿐, 신규 구현의 표준이 아닙니다.

| 과거 HUFS One AI 이식 계열 | 현재 코드 경로 | 앞으로의 처리 |
|---|---|---|
| `packages/core/src/academics/` | `js/academic/core/academics/` | 원본 계산/예외 보존 후 JS 이관 |
| `packages/core/src/forecast/` | `js/academic/core/forecast/` | 예측/보류 판정 보존 후 JS 이관 |
| `packages/contracts/src/academics/`, `packages/contracts/src/self/` | `js/academic/contracts/` | Zod/타입 계약 유지 후 JS 이관 |
| `apps/web/src/features/`의 순수 뷰 모델 | `js/academic/views/` | React 종속 부분은 제외, 뷰 모델·로컬 입력 동등성 후 JS |
| 이후 작성한 새 학업·검색·공지/NLP·학생 화면 코어 | `js/academic/core/campus-assist/`, `js/academic/app/` 등 | **기존 TS도 모두 이관 대상**. 상세 출처가 불명확한 파일은 Git 기록으로 확인 |
| 서버·LLM·인증/학생 개인 성적 파일 | 이식 금지 | 권리/개인정보 경계 유지 |

## 동결 및 마이그레이션

- 현재 UI/UX **58개 자산** 기준 SHA: [`da30a875`](https://github.com/ot4562-glitch/Hanmo_develop/commit/da30a87510f1cdac282600fa4e914da2585a6031). HTML/CSS/브라우저 UI 모드 재디자인은 별도 승인 필요.
- 현재 TypeScript **98개 중 테스트 42개**. 기존 파일은 이관 대기 목록으로만 허용, 신규 TS/TSX 생성과 기존 TS 코드 기능 확장은 금지.
- 작업 단위: 순수 TS 모듈·테스트 → **JS/JSDoc + `.test.js`**로 변환하고 동일 고정 입력·예외·출처/판본/스토리지·API 결과를 비교합니다. 출력 번들을 직접 편집하지 않습니다.
- **3차 실제 Supabase 연동과 무관하게 지금부터 코드 이전**을 진행합니다. **4차 최종 인수**는 실DB·권리·QA 인수 완료 이후로 구분합니다.

[현행 아키텍처](architecture.md) · [이관 #68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68) · [이관 #69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)
