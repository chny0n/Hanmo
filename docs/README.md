# 한모 문서 안내

[README](../README.md)는 프로젝트 소개와 디자인을, [아키텍처](architecture.md)는 **현재 유효한 제품·기술 설계의 단일 정본**을 맡습니다. 2026-11-23 정보처 서면 회신 이후 **실제 웹에서 졸업·학사 FAQ 페이지를 삭제**했습니다. 현행 SVG 8종과 BASIC 흐름도는 2026-11-23 코드 상태에 맞춘 **설명용 구성도**입니다. 실제 브라우저 스크린샷이나 학교 공식 자료는 아닙니다.

| 분류 | 문서 | 용도 |
|---|---|---|
| 현행 정책 | [아키텍처](architecture.md) | 구현 상태·설계·권리/검수/인수 게이트 |
| 진행 과제 | [미결 이슈](pending-issues.md) | 최신 실행 항목과 GitHub Issue 연결 |
| 학업 로직 | [학업 코어](academic-core.md) · [이식 대응표](academic-porting-map.md) | 계약·이식 경계 |
| 자료 권리 | [수집 검토 범위](academic-data-collection-scope.md) · [수명주기](academic-data-lifecycle-operations.md) · [인계](student-data-source-handoff.md) | 허가·검수·철회·운영 조건 |
| 개발 규칙 | [에이전트 운영](../agent.md) · [주석 지침](comment-guidelines.md) | 보호 영역·JavaScript/JSDoc·한국어 주석 |
| 디자인 참고 | [디자인 품질 신호 200개](ai-slop-vs-intentional-design-200-signals.md) | 에이전트·사람의 설계 검토 체크리스트이며 구현 정본이 아님 |
| 역사적 증거 | [PR #1–#5 감사 기록](pr-stack-review.md) | 2026-11-18 당시 기록. 현재 구현 상태를 설명하지 않음 |

## 그림 자료 상태

- **현재 사용 가능한 흐름도:** [BASIC 가상 404/정원 마감](images/hanmo-basic-flow-compact.svg). 모두 실제 학교 자료와 무관한 합성 연습입니다.
- **2026-11-23 현행화한 설명용 SVG 8종:** [한모 배너](images/hanmo-hero-hufs.svg), [경험](images/hanmo-experience-landscape.svg), [개요](images/hanmo-01-project-overview.svg), [페이지 지도](images/hanmo-02-page-map.svg), [자료 흐름](images/hanmo-03-data-flow.svg), [단계](images/hanmo-04-roadmap.svg), [기능 미리보기](images/hanmo-feature-preview.svg), [신뢰 경계](images/hanmo-trust-flow.svg). 삭제된 졸업·FAQ·문의처 페이지를 현재 학생 기능으로 표시하지 않습니다. SVG는 개념 설명이며 실제 화면/데이터 검수 인수가 아닙니다.
- **정본:** [아키텍처 §0](architecture.md) · [학생 웹 현황](academic-core.md) · [회신 전문](sources/2026-11-23-hufs-information-office-reply.txt). 학교 로고/엠블럼 및 공식 오인 요소는 전수 감사 대상입니다. `mode: disabled`를 유지합니다.

## 재현 가능한 검사

Node.js 22 환경에서 `npm ci` → `npm run check`를 실행합니다. 브라우저 테스트는 `npx playwright install chromium` → `npm run test:e2e`를 추가로 실행합니다. CI는 Chrome 계열 Chromium 자동 테스트이며 Windows Chrome/Edge·NVDA·200% 확대 등 실제 사용자 인수는 [Issue #72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72)에서 별도 관리합니다. PC 진단·반응속도·전략 신뢰성은 **공동 이슈 [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134)**(이의상·김채윤)로 추적합니다.

주석의 자연어 설명은 한국어, 코드와 식별자는 JavaScript/JSDoc으로 작성합니다. 기존 파일을 수정하기 전 [운영 규칙](../agent.md)에서 UI 동결 대상과 원개발자 승인 경계를 확인하세요.
