# Hanmo Develop

[한모](https://github.com/dlacked/Hanmo)의 기존 모의수강신청(BASIC / TIME / SELECT)을 보호하면서, 한국외국어대학교 학생이 **수강계획부터 졸업까지** 활용할 수 있는 **비공식 학업 플랫폼**을 단계적으로 확장합니다. 취업·채용·NCS 기능과 실제 수강신청 자동화는 범위 밖입니다.

## 4단계 개발 구조

| 단계 | 구현 기술 | 목표 및 책임 |
|---|---|---|
| **1단계 · 독립 학업 플랫폼** | **TypeScript 계산 코어 + 정적 HTML/CSS** (배포 시 JavaScript 빌드) | 별도 `degree-rescue/` 화면·강의·학칙·학점·공지·학사일정 기능 개발 및 검증. 기존 한모 파일 변경 금지 |
| **2단계 · 모의수강신청 시나리오** | **기존 JavaScript + HTML/CSS** | 원개발자 **사전 승인 후**, 기존 BASIC/TIME/SELECT 화면에 선택형 수강실패·대체과목·재접속 시나리오 추가 |
| **3단계 · Supabase 실연동** | **TypeScript/JavaScript 병행** + 승인된 Supabase DB/API | 우리 팀은 DB·수집·검수·보안·운영 **설계·인계**. 실제 프로젝트 개설·통합·운영은 **임창용 님과 책임·권한·비용 협의 후** 담당 운영자가 수행 |
| **4단계 · JavaScript 유지보수 소스 통일** | **정적 HTML/CSS + JavaScript/JSDoc** | **3단계의 실제 DB 연동과 제품 안정화 검증 완료 후** 1단계 TypeScript 원본을 기능 동등한 JavaScript로 순차 이관 |

**1·2단계는 Supabase 없이 독립 실행**되어야 합니다. 3단계 설계 문서 인계와 3단계 실제 제품 통합 완료는 별개입니다. 4단계는 실통합·보안·브라우저 회귀검증을 통과한 뒤에만 진행합니다.

## 구조와 개발 원칙

- 기존 한모의 `index.html`, `html/`, `js/`, `css/`, `img/`, `CNAME`은 **1단계에서 수정하지 않습니다**.
- 2단계 시나리오는 **기존 HTML·JavaScript 소스에 직접 구현**하고 React/TypeScript 도입을 요구하지 않습니다.
- 1단계 화면은 정적 HTML/CSS를 사용합니다. TypeScript 원본은 빌드 시 일반 JavaScript로 변환합니다.
- 합성 모의신청 상태는 학생의 실제 신청·취득학점과 분리하고, 확인되지 않은 학사정보는 공식 확정으로 표시하지 않습니다.
- 원본 한모 병합·배포, 기존 화면 변경, Supabase 실운영에는 각각 책임자의 승인 절차가 필요합니다.

## 기준 문서

**[docs/architecture.md](docs/architecture.md)**가 현재 유효한 제품·기술 설계와 마지막의 **미결 사항 / GitHub Issue**를 관리합니다. 이슈는 미확정 설계를 결정·검증하기 위한 작업 단위이며, 이슈 생성만으로 구현·병합·운영 승인이 완료되지 않습니다.

현재 신규 학업 기능은 별도 개발 PR에 있으며, 공식 강의·학칙 정본과 Supabase 실연동은 미완료 상태입니다.

원본 프로젝트: [dlacked/Hanmo](https://github.com/dlacked/Hanmo) · 라이선스: [GPL-3.0](LICENSE). 이식 코드와 학사자료의 재배포 권리는 공개 병합 전에 별도 확인합니다.
