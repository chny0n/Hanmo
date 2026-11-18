# 한모 1차 · 아키텍처 정렬 이식/미이식 명세

**기준:** 2026-11-18 · [main 아키텍처](../../docs/architecture.md).

## 원칙

- 현재 브랜치는 `degree-rescue/` 안의 **브라우저 정적 TypeScript/HTML/CSS**만 다룹니다. 기존 한모 `index.html`, `html/`, `css/`, `js/`, `img/`, `CNAME`는 그대로 유지합니다.
- **비실행 옛 원본 235개**를 이 저장소에서 보존할 실무 필요성이 낮고 재배포 권리가 미확정이므로 `legacy-academic/`을 제거했습니다. 아카이브 검증을 빌드 조건으로 강제하지 않습니다.
- 아래의 실제 이식 TypeScript와 합성 회귀 테스트만 유지합니다. 소스가 있음 ≠ 학교 실데이터·학생용 UI·승인·출시가 완료됨입니다.

## 즉시 집중할 재사용 자산

| 학생 가치 | 유지 코드 | 출시 전 남은 조건 |
|---|---|---|
| 강의 개설 전망 | `core/forecast/offering.ts`, `scenario.ts`, `rolling-origin.ts`, 관련 테스트 | 충분한 과거 학기 자료·개설 정본·모델 평가, 확률 과장 금지 |
| 학사행사 시기 예측 | `core/campus-assist/activities.ts`, `activity-intake.ts` | 과거 학과/전공별 공식 공지 이력·수정/취소 관리·예상 구간 UX |
| 근거 중심 FAQ | `core/campus-assist/faq*.ts`, 엄격한 계약 `contracts/campus-assist/index.ts` | 검증된 FAQ 문단 DB, 출처 주석 UI, 적용 대상/날짜 불명확 시 답변 보류 |
| 전공 선택형 중요공지 | 학사 일정 필터/스키마는 후속 PR #4, 근거 신뢰 경계는 #5에서 추가 | 공식 공지별 전공/캠퍼스/학번 적용 구간의 운영 검수 |
| WIS 저장본 검색 보조 | `core/academics/wis-timetable.ts`, `faculty-directory.ts`, `faculty-search.ts`, `catalog.html` | 직접 저장한 자료·표시명일 뿐 공식 교수 명부·자동 동기화가 아님 |

## 계산 코어 유지, 학생용 대표 기능 보류

- `academics/ledger.ts`, `double-major.ts`, `major-what-if.ts`, `rule-diff.ts` 등은 **학번별 규정 적용·졸업 계산 기반**으로 유지. 개인 성적/수강내역의 안전한 일괄 로드와 정본 RulePack 없이는 졸업 위험 진단/What-if를 공식 판단처럼 제공하지 않습니다.
- `academics/plan.ts`, `study-plan.ts`는 내부 충돌 검사 코어일 뿐, 에브리타임과 중복되는 **독립 시간표 편집기**를 만들지 않습니다.
- 교환학생 정책 판정 로직은 FAQ 경계에서 필요한 일부 코어만 보존하며, 개인 적격성/준비 점검 서비스는 제공하지 않습니다.
- 학칙 개정 비교 코어는 입학년도별 규정 판본 관리용으로 보존하고 대표 차별점/홍보 기능으로 내세우지 않습니다.

## 제거 또는 이관한 코드/자료

- React 화면, Fastify/PostgreSQL 서버, 비실행 대량 아카이브, 서버 인증/개인 학업 CSV, HUFSAbility 개인 계정 메뉴 미러.
- 고용·경력 활동 증빙 연결 코드와 관련 계약/테스트.
- 개인 학업데이터가 없으면 동작시킬 수 없는 교환학생 준비/전공 What-if **뷰 전용** 파일 및 테스트.
- 중복 개발 계획 문서: 현재의 main 아키텍처만 기준.

## 검증·안전

`npm run check` = TypeScript 타입 검사 + Vitest 회귀 + ESBuild 번들 + 정적 스테이징; PR #2에서 추가한 `assert-additive-only`는 기존 한모 파일 변경을 차단합니다. 사용자가 업로드한 JSON의 SOURCE_REVIEWED 등 검증 상태는 운영 승인이 아닙니다. 이수데이터 원문·학교 로그인·SSO를 자동 수집하지 않습니다.

**출시 전 게이트:** 공공 학사자료 사용권, 기여 원본의 GPL-3.0 호환성/재배포 허가, 학교 데이터 검수 및 실브라우저 E2E, 원개발자 승인. 모든 이전 아카이브 파일은 Git 커밋 이력에서 여전히 접근 가능할 수 있어 HEAD 삭제만으로 비공개화되지 않습니다.
