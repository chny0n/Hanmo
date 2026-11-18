# HUFS One AI → Hanmo: 수강·강의·졸업·교수 관련 자산 회수 원장
**조사일:** 2026-11-17 · **원본 기준:** `ot4562-glitch/HUFS-One-AI` main tree `081039076db6166b264aef56c1e043e0fa63540b` (archived) · **대상:** `Hanmo_develop` `feature/degree-rescue-academic-salvage`

## 범위·판정
학업 범위 밖의 경력·활동 증빙 링크 원본을 제외한 뒤, **순수 계산 코어 파일을 복사하는 것**, **실제 학생이 사용할 화면으로 만드는 것**, **한국외대 공식 실데이터가 연결되는 것**은 세 가지 서로 다른 완료 조건입니다. 아래 각 단계와 그 누락을 분명하게 기록합니다. 기존 한모 파일은 절대 수정하지 않고 독립 `degree-rescue/` 페이지만 추가합니다.

## 1. 원본에서 회수된 학사 핵심 파일 — 순수 로직

| 원본 | 이식 위치 (모두 `degree-rescue/src/` 아래) | 상태 |
|---|---|---|
| `packages/core/src/academics/ledger.ts` | `core/academics/ledger.ts` | 학점 원장·재수강·충족 여부 코어 회수 |
| `academics/course-equivalence.ts`, `course-identity.ts` | `core/academics/` | 교과목 동일성·대체 관계/원장 식별 코어 회수 |
| `academics/double-major.ts`, `major-what-if.ts` | `core/academics/` | 이중전공·변경 가정 계산 코어 회수 |
| `academics/plan.ts`, `study-plan.ts` | `core/academics/` | 한 학기 계획 제약 검사 회수. 다학기 최적화 엔진은 원본에 없음 |
| `academics/rule-approval.ts`, `rule-diff.ts` | `core/academics/` | 적용/변경 규칙의 승인·차이 검증 코어 회수 |
| `academics/notice-links.ts` | `core/academics/` | 학사 상태→공지 요건 연결 코어 회수 (공지 서비스는 미연결) |
| `academics/wis-timetable.ts`, `wis-timetable-csv.ts` | `core/academics/` | WIS 수동 저장 페이지 파서 및 CSV 변환 코어 회수 |
| `academics/index.ts` | `core/academics/index.ts` | 학사 API export 수정 이식 |
| `packages/core/src/forecast/offering.ts`, `scenario.ts`, `rolling-origin.ts`, `index.ts` | `core/forecast/` | 다음 학기 개설 전망·시나리오·과거 예측 평가 코어 회수 |

**판정:** `academics/`의 학업 범위에 남은 비테스트 TS 13개, `forecast/`의 원본 비테스트 TS 4개는 동일 파일명으로 회수했습니다. 보완 코드 `faculty-directory.ts`, `faculty-search.ts`, `curriculum-csv.ts`는 별도로 신규 작성하였습니다. 단, 단순 파일 존재는 기능·UI 완성 증거가 아닙니다.

## 2. 학사 데이터/계약과 React 화면

- `packages/contracts/src/academics/{index,vnext,double-major}.ts` 및 `packages/contracts/src/self/{major-what-if,study-plan-check}.ts`를 브라우저 전용 최소 계약으로 회수했습니다.
- `apps/web/src/features/graduation/graduationView.ts`, `plan-check/planCheckView.ts`, `double-major/doubleMajorView.ts`의 **React와 무관한 뷰 모델**을 `src/views/`로 이전했습니다.
- `apps/web/src/pages/graduationPage.tsx`, `apps/web/src/features/owner-academics/*`, `PlanCheckPanel.tsx`, `DoubleMajorPanel.tsx`, `OwnerExperienceCoursePanel.tsx` (한모 학업 영역에서 제외) 등은 React, 사용자 세션 및 서버 데이터 경계에 종속되어 **원본 JSX를 그대로 복사하지 않았습니다.** 대신 `degree-rescue/index.html`에 독립 시연 UI, `catalog.html`에 새 강의·교수 검색 UI를 추가했습니다.
- 현 시점의 `index.html`은 **가상 JSON 입력 기반 기능 시연**입니다. 학교 공식 학칙/학생 성적/강좌 DB가 없으므로 실학생용 졸업 판단·시간표 자동생성으로 과장하면 안 됩니다.

## 3. 원본에는 있었으나 서버 종속이므로 보류한 기능

| 원본 | 사유 | 가능한 후속 이식 |
|---|---|---|
| `apps/api/src/modules/academics/*` | Fastify/HTTP, PostgreSQL, 계정/권한/동의/학교 승인에 종속 | 순수 계산을 재사용해 브라우저 로컬 입력 어댑터 신규 작성 |
| `apps/api/src/modules/curriculum/permitted-curriculum.ts` | Node crypto/Papa.parse와 운영자 권리 등록·원격 수집 포함 | CSV의 검증 가능한 형식·중복 검사만 `core/academics/curriculum-csv.ts`로 분리; 실제 권리 승인 기능 미포함 |
| `apps/api/src/modules/profiles/owner-study-plan-check-http.ts`, `owner-major-what-if-http.ts` | 본인 로그인과 서버 측 데이터에 의존 | 사용자가 입력하는 비공식 로컬 계획만으로 분리 |
| `tools/collect_permitted_curriculum.mjs`, `tools/import_wis_timetable.mjs` | Node 실행/운영자 권한 전제 | 서버 없이 수동 저장 페이지→브라우저 CSV 다운로드 지원 |
| `packages/core/src/notices/*` | 일반 공지 코어, 학업/공지 연계는 아직 미구현 | 학사공지에 한해 별도 출처 검증 후 부분 이식 가능 |

## 4. 교수·지도교수·학습·상담의 정확한 구분

- 원본 `wis-timetable.ts`에는 `담당교수` 열이 있으나 기존 구현은 **교수명을 버립니다**. 신규 `faculty-directory.ts`는 사람이 저장한 WIS 공식 강의시간표에서 **강의별 교수 표시명**만 추출합니다.
- 신규 `faculty-search.ts`와 `degree-rescue/catalog.html`에서는 강의명/학수번호/담당교수 표시명 검색이 가능합니다. **교수별 공식 인사 DB, 교수 연락처/평가, 재직 인증, 교수 면담 예약/지도교수 배정 정보는 원본에 완성된 데이터가 없습니다.**
- `reference/hufsability/feature_catalog.json`의 '교수(지도) 상담·신청'은 **외부 HUFSAbility 기능의 참고 목록**이며, 공식 연동 권한·학생 데이터가 아닙니다.
- `packages/core/src/feature-additions/mentors-v2.ts`와 `mentor-evaluation.ts`는 **취업/경력 멘토 추천**, 교수 정보 시스템이 아닙니다. 교수 DB로 속여 이식하지 않습니다.
- `packages/core/src/feature-additions/counseling-v2.ts`, `learning-v2.ts`는 **학교 상담기관 안내·비교과 학습 프로그램 추천**입니다. 수강신청/학위취득 자체를 계산하는 모듈이 아니므로 별도 옵션으로 보존하고, 학사 상담 경로에 한정하여 추후 검토합니다.
- `apps/web/src/features/counseling/OwnerCounselingPanel.tsx`는 서버 인증 및 기관 정보 연결이 없는 경우 NOT_CONNECTED입니다. **진짜 예약이나 교수 연결 기능은 아닙니다**.

## 5. 실제 데이터와 지표의 미완료 사항

- 다음 학기 개설 전망 코어는 **과거 같은 시즌 개설 k/n과 공식 확정 정보를 구분**합니다. 충분한 데이터 없는 경우 UNKNOWN/NEEDS_REVIEW. **k/n을 보정된 확률로 표시하지 않습니다.** 실제 백테스트 지표·공식 강의 이력 원장 확보가 필요합니다.
- 졸업요건 계산과 전공 시뮬레이션은 **학번·캠퍼스·전공·교육과정 판본별 독립 검수된 RulePack** 없이 실제 졸업 판정이 아닙니다.
- 시간표/계획 코어는 **한 학기 제약 검사**입니다. 사용자 목표인 '미래 2~4개 학기 최적화, 졸업 지연 위험, 미개설/수강 실패 최소 복구'는 **원본 자체에 없는 신규 기능**으로 개발해야 합니다.
- 교수/강좌/학칙 공공 원본의 재배포 권리·갱신일·완전성, 개설/시간표 변경, 강사 변경에 대한 지속 갱신 파이프라인이 없습니다.
- 원본 `csv/`의 **학생별 성적·이수 CSV와 Google Forms** 5개는 공개 이식 **금지**. 사용자 제공 로컬 데이터만 브라우저에서 처리하며 외부 서버에 자동 전송하지 않습니다.
- 비공개 HUFS One AI 팀 기여 코드의 공개 재배포 권한과 Hanmo GPL-3.0 호환성은 **병합·배포 전 사람 검토가 필요**합니다.

## 6. 검증·회귀 테스트

- 기존 한모의 `index.html`, `html/`, `js/`, `css/`, `CNAME`을 직접 변경하지 않습니다.
- 자동 CI는 `degree-rescue/package.json`의 `npm run check` (TypeScript 타입 검사, 원본 합성 회귀 테스트, ESBuild 정적 브라우저 번들, GitHub Pages용 전체 스테이징)로 확인합니다.
- `degree-rescue/scripts/assert-additive-only.mjs`가 GitHub `main` 대비 **원본 불변 + 추가 폴더로만** 변경했는지 검사합니다.
- 원본 학사 회귀 테스트 19개 중 18개와 개설 전망 테스트 4개를 회수했습니다. 남은 학사 테스트 1개 `notice-links.test.ts`는 별도 일반 공지 엔진에 종속되어 미이식입니다. 원본 학사 속성 기반 테스트와 별도 합성 fixture는 보존했습니다.

**현재 결론:** '순수 학사·개설 예측 핵심 로직'은 회수했고, 교수 표시명과 로컬 CSV 검색·변환 기능을 새로 만들었습니다. 그러나 **모든 학사 기능의 사용 가능 UI, 운영에 필요한 실데이터·권리·권한·수강 실패 복구**는 아직 완료되지 않았습니다. 

## 2026-11-18 아키텍처 범위 정리

- 원본 `experience-evidence.ts`와 `owner-experience-courses.ts` 및 활동/경력 증빙 연결 테스트를 PR에서 삭제했습니다. 수강 사실을 경력 활동에 연결하는 기능은 한모 학업/졸업 범위 밖입니다.
- 학사 코어의 졸업·전공 What-if·학칙 차이 계산은 향후 데이터 불러오기/규정 검증 전까지 개발자용 순수 계산 자산으로만 남깁니다.
- 1차 핵심은 개설 전망, 학사행사·중요공지 준비, 근거/출처 확인입니다. 기존 수강신청 위기 대응은 원개발자 승인 후 2차 별도 작업입니다.
