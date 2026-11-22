# 한모 문서 안내

[README](../README.md)는 프로젝트 소개와 디자인을, [아키텍처](architecture.md)는 **현재 유효한 제품·기술 설계의 단일 정본**을 맡습니다. 원래 README 일러스트·화면 구성과 기존 문서들은 유지하며, 필요에 따라 좁은 범위만 수정합니다.

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

## 재현 가능한 검사

Node.js 22 환경에서 `npm ci` → `npm run check`를 실행합니다. 브라우저 테스트는 `npx playwright install chromium` → `npm run test:e2e`를 추가로 실행합니다. CI는 Chrome 계열 Chromium 자동 테스트이며 Windows Chrome/Edge·NVDA·200% 확대 등 실제 사용자 인수는 [Issue #72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72)에서 별도 관리합니다.

주석의 자연어 설명은 한국어, 코드와 식별자는 JavaScript/JSDoc으로 작성합니다. 기존 파일을 수정하기 전 [운영 규칙](../agent.md)에서 UI 동결 대상과 원개발자 승인 경계를 확인하세요.
