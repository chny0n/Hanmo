# 한모 문서 안내

[README](../README.md)는 프로젝트 소개와 디자인을, [아키텍처](architecture.md)는 **현재 유효한 제품·기술 설계의 단일 정본**을 맡습니다. README에 사용된 일러스트와 설명용 SVG는 **실제 `main`의 화면·데이터 경계·BASIC 돌발상황·JS/JSDoc 이관 상태**와 함께 갱신합니다. 시각화는 화면 캡처나 공식 학사정보 승인 증거가 아닙니다.

| 분류 | 문서 | 용도 |
|---|---|---|
| 현행 정책 | [아키텍처](architecture.md) | 구현 상태·설계·권리/검수/인수 게이트 |
| 진행 과제 | [미결 이슈](pending-issues.md) | 최신 실행 항목과 GitHub Issue 연결 |
| 학업 로직 | [학업 코어](academic-core.md) · [이식 대응표](academic-porting-map.md) | 계약·이식 경계 |
| 자료 권리 | [수집 검토 범위](academic-data-collection-scope.md) · [수명주기](academic-data-lifecycle-operations.md) · [인계](student-data-source-handoff.md) | 허가·검수·철회·운영 조건 |
| 대외 소통 | [학사 지원 부서 설명](academic-support-center-brief.md) | 학교 검토 요청용 비공식 초안 |
| 개발 규칙 | [에이전트 운영](../agent.md) · [주석 지침](comment-guidelines.md) | 보호 영역·JavaScript/JSDoc·한국어 주석 |
| 디자인 참고 | [디자인 품질 신호 200개](ai-slop-vs-intentional-design-200-signals.md) | 에이전트·사람의 설계 검토 체크리스트이며 구현 정본이 아님 |
| 역사적 증거 | [PR #1–#5 감사 기록](pr-stack-review.md) | 2026-11-18 당시 기록. 현재 구현 상태를 설명하지 않음 |

## 현행 구조·기능 SVG (2026-11-23)

학생용 UI 경로와 합성 시나리오를 설명하는 **소스 SVG 9개**를 현재 아키텍처에 맞춰 갱신했습니다. `img/`의 브랜드/원작 SVG 자산은 변경하지 않았습니다.

- **README 노출:** [프로젝트 배너](images/hanmo-hero-hufs.svg) · [화면/연습 경험](images/hanmo-experience-landscape.svg) · [BASIC RECONNECT/CAPACITY](images/hanmo-basic-flow-compact.svg)
- **설계 자료:** [01 개요](images/hanmo-01-project-overview.svg) · [02 7개 학업 화면 지도](images/hanmo-02-page-map.svg) · [03 승인 데이터 경계](images/hanmo-03-data-flow.svg) · [04 JS/JSDoc·Supabase 로드맵](images/hanmo-04-roadmap.svg) · [기능 구성도](images/hanmo-feature-preview.svg) · [자료 신뢰 흐름](images/hanmo-trust-flow.svg)

그림에서 공식 학사자료 연결은 **예정·검수 이후 경로**이며, 현재 `data/academic-source-config.json`은 `mode: disabled`입니다. 이 파일들은 UI 기준선에 포함된 실제 웹페이지나 학교 시스템의 스크린샷을 대신하지 않습니다.
## 재현 가능한 검사

Node.js 22 환경에서 `npm ci` → `npm run check`를 실행합니다. 브라우저 테스트는 `npx playwright install chromium` → `npm run test:e2e`를 추가로 실행합니다. CI는 Chrome 계열 Chromium 자동 테스트이며 Windows Chrome/Edge·NVDA·200% 확대 등 실제 사용자 인수는 [Issue #72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72)에서 별도 관리합니다.

주석의 자연어 설명은 한국어, 코드와 식별자는 JavaScript/JSDoc으로 작성합니다. 기존 파일을 수정하기 전 [운영 규칙](../agent.md)에서 UI 동결 대상과 원개발자 승인 경계를 확인하세요.
