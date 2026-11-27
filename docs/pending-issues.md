# 한모 · 현행 이슈와 PR 검토 상태

> **2026-11-26 확인:** [GitHub 열린 일반 이슈](https://github.com/ot4562-glitch/Hanmo_develop/issues?q=is%3Aissue+is%3Aopen) 27건. 각 이슈에서 담당자와 체크리스트를 확인합니다. 제품 기준은 [아키텍처](architecture.md), 작업 절차는 [AGENTS.md](../AGENTS.md)에 있습니다.

## 현행 실행 범위

- 학생용 전략 실험은 개시 직후 선착순 회차를 가정해 신청 순서와 모의실험 성공 비율을 계산합니다. [아키텍처 §5](architecture.md#5-전략-실험-신청-순서-추천)
- 학사 공지·달력은 한 화면의 탭이며 강의 검색은 미연결 상태입니다. 실제 학교 자료와 원격 텔레메트리는 비활성 상태입니다. [공개자료 운영 방침](public-data-operating-decision.md)
- #71·#72·#138은 [`c8caff2`](https://github.com/ot4562-glitch/Hanmo_develop/commit/c8caff2c877c78093e3c05409e68a4012c7e6776)의 Windows 자동 QA를 기록하고 닫혔습니다. 최대 SELECT 완료 표의 내부 스크롤, 물리 키 입력, NVDA 및 최종 후보 현장 인수는 [#125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125)에서 확인합니다. [#71 원본 연습 결과](https://github.com/ot4562-glitch/Hanmo_develop/issues/71#issuecomment-7160455697) · [#72 접근성 결과](https://github.com/ot4562-glitch/Hanmo_develop/issues/72#issuecomment-7160456967) · [#138 개발자 소개 결과](https://github.com/ot4562-glitch/Hanmo_develop/issues/138#issuecomment-7160458183)

## 현재 열린 이슈 (27건)

### 학생 UI·합성 연습·신뢰성

| 이슈 | 현재 작업 | GitHub 담당 | 상태 |
|---|---|---|---|
| [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39) | [검증][1차][P1][통합] 허용된 학생 웹·비공식 고지·자료 부족 표시 QA | `ot4562-glitch` | open |
| [#45](https://github.com/ot4562-glitch/Hanmo_develop/issues/45) | [구현][1차][P1][데이터] 내정보 직접 입력의 로컬 저장·삭제·손상 복구 검증 | `qamarrchae` | open |
| [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) | [구현][1차][P0][통합] 비공식 모의연습→공지 원문 링크·개설 집계 안내 흐름 완성 | `ot4562-glitch` | open |
| [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58) | [검증][1차][P1][통합] 비공식 달력·학교 일정 링크·마감 오인 방지 QA | `uisang2004-maker` | open |
| [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69) | [검증][4차][P2][통합] JS 로컬 저장·합성 계산·브라우저 회귀(졸업 UI 제외) | `ot4562-glitch` | open |
| [#127](https://github.com/ot4562-glitch/Hanmo_develop/issues/127) | [구현][1차][P2][통합] 검수된 공개 일정 달력 표시·원문 탐색 (선택 확장) | `uisang2004-maker` | open |
| [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134) | [검증][2차][P1][통합] PC 진단·반응속도 테스트·전략 실험 안정화 및 신뢰성 인수 | `qamarrchae`, `uisang2004-maker` | open |
| [#139](https://github.com/ot4562-glitch/Hanmo_develop/issues/139) | [검증][2차][P1][통합] 전략 실험 고정 모형의 합성 검증·민감도·성능 회귀 | `qamarrchae`, `uisang2004-maker` | open |
| [#140](https://github.com/ot4562-glitch/Hanmo_develop/issues/140) | [설계][2차][P2][데이터] 동의 기반 모의연습 검증 및 모수 보정 연구 계획 | `qamarrchae`, `uisang2004-maker` | open |

### 공지·개설 관측·안전한 검색

| 이슈 | 현재 작업 | GitHub 담당 | 상태 |
|---|---|---|---|
| [#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40) | [검증][1차][P1][NLP] 허용 공지 링크 검색·비식별 집계 안전성 골드셋 | `uisang2004-maker` | open |
| [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41) | [검증][1차][P0][데이터] 공개 공지·강의 개설 메타데이터의 서면 금지 필드·가공/결측 검증 | `qamarrchae` | open |
| [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42) | [구현][1차][P0][데이터] 공개 학사 메타데이터·개설 관측 검수 스냅샷 빌더 | `qamarrchae` | open |
| [#44](https://github.com/ot4562-glitch/Hanmo_develop/issues/44) | [구현][1차][P1][NLP] 공개 공지 최소 메타데이터·원문 링크 인덱스 안전화 | `uisang2004-maker` | open |
| [#46](https://github.com/ot4562-glitch/Hanmo_develop/issues/46) | [구현][1차][P1][NLP] 공개 공지 링크 메타데이터 추출의 오탐·금지 필드 차단 | `uisang2004-maker` | open |
| [#48](https://github.com/ot4562-glitch/Hanmo_develop/issues/48) | [구현][1차][P2][데이터] 공개 강의 개설 이력·추세 비교·비공식 전망 백테스트 | `qamarrchae` | open |
| [#51](https://github.com/ot4562-glitch/Hanmo_develop/issues/51) | [구현][1차][P1][NLP] 공개 공지 최소 주제 분류·정정/보류 표시 (개인화 제외) | `uisang2004-maker` | open |
| [#52](https://github.com/ot4562-glitch/Hanmo_develop/issues/52) | [검증][1차][P2][NLP] 합성 행사 날짜 코어 유효성·백테스트 검증 (서비스 연결 보류) | `uisang2004-maker` | open |
| [#53](https://github.com/ot4562-glitch/Hanmo_develop/issues/53) | [구현][1차][P1][NLP] 학사공지 메타 정밀검색·필터·오타·관련도 개선 | `uisang2004-maker` | open |
| [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68) | [검증][4차][P2][NLP] JS 검색·공지 코어 합성 동등성 및 금지 경로 격리 | `uisang2004-maker` | open |

### 정적 자료·선택적 Supabase·수집 제한

| 이슈 | 현재 작업 | GitHub 담당 | 상태 |
|---|---|---|---|
| [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64) | [구현][3차][P1][데이터] 공개 메타·개설 관측·비식별 집계 정적 스냅샷·Supabase 설계 | `qamarrchae` | open |
| [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65) | [구현][3차][P1][데이터] 공개 공지·개설 이력·행사 메타 읽기 및 정적 대체 | `qamarrchae` | open |
| [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66) | [구현][3차][P0][데이터] 정보처 수집 제한·전역 예산·오류 당일 차단 파이프라인 | `qamarrchae` | open |
| [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) | [검증][3차][P1][데이터] 김채윤의 정적 스냅샷·선택적 Supabase Free 직접 실습·인수 | `qamarrchae` | open |
| [#126](https://github.com/ot4562-glitch/Hanmo_develop/issues/126) | [구현][공통][P0][데이터] 공개 학사자료 긴급 OFF·철회·캐시·롤백 검증 | `ot4562-glitch` | open |

### 최종 품질·권리·인수

| 이슈 | 현재 작업 | GitHub 담당 | 상태 |
|---|---|---|---|
| [#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73) | [검증][공통][P0][통합] 학교 서면 이용 경계·공식 오인·공개 산출물·GPL 출시 감사 | `ot4562-glitch` | open |
| [#101](https://github.com/ot4562-glitch/Hanmo_develop/issues/101) | [검증][공통][P0][통합] JS/JSDoc 이관 후 허용 웹·타입·원본 동등성 최종 인수 | `ot4562-glitch` | open |
| [#125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125) | [검증][4차][P0][인수] 전체 개발 완료 후 원개발자 dlacked에게 소스·운영 인계 | `ot4562-glitch` | open |

## 후속 실행 순서

1. [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134)는 세 PC 도구와 공개 순서 추천 화면을 검증합니다. 과목 입력 경계, 가상 조건별 손실 계산, 중요 순위, 8과목 결과와 계산 기준 가시성을 확인합니다.
2. [#139](https://github.com/ot4562-glitch/Hanmo_develop/issues/139)는 내부 합성 엔진의 고정 시드·민감도·성능을 검증합니다. GitHub 본문의 Worker·MathML 항목은 이전 학생 화면을 가리킵니다.
3. [#140](https://github.com/ot4562-glitch/Hanmo_develop/issues/140)은 선택 연구 계획입니다. 자료 수집은 별도 승인 뒤 검토합니다.
4. #101 기능 동등성, #73 권리, #126 철회, #125 현장 QA와 최종 인수는 후보 SHA를 기준으로 기록합니다. 선택적 Supabase 실습은 #67의 기존 선행 요건에 따릅니다.

## 열려 있는 PR과 의존성

| PR | 작성자·현재 상태 | 검토 결론/남은 게이트 |
|---|---|---|
| [#120](https://github.com/ot4562-glitch/Hanmo_develop/pull/120) | 이의상, 미병합 | **REQUEST_CHANGES**: 날짜·NEEDS_REVIEW 차단 해결; CANDIDATE(사람 검수 전)에서 REAL_APPROVED 행사 승인 레코드 생성 가능. 합성 전용 제한 또는 검수 승인 계약 필요 |
| [#130](https://github.com/ot4562-glitch/Hanmo_develop/pull/130) | 이의상, 미병합 | **REQUEST_CHANGES**: 동일 ID 전체 보류 해결; REVIEWED의 임의 HTTPS URL과 공식 출처 ID 검증 누락. 검수 출처 계약 또는 실제 입력 보류 필요 |
| [#131](https://github.com/ot4562-glitch/Hanmo_develop/pull/131) | 이의상, 미병합 | **REQUEST_CHANGES**: 관측기간 행 검증·엄격 공개판 계약 해결; 미래 매니페스트 관측기간·동일 ID 중복 공개판 허용. #130 병합 후 최신 main diff/CI 필요 |
| [#93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93) | 본인, **Draft·미병합** | [#93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)은 [ace13a2](https://github.com/ot4562-glitch/Hanmo_develop/commit/ace13a2e4c4b19a5c947c071e64bb2b5e14bef90)에서 필수 JSON 배열 누락과 검수 후 후보 페이로드·해시·유효기한 등 변경을 차단하고 구형 인계 지침을 정정했습니다. [정적 및 격리 PostgreSQL 16 CI](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45562372757) 성공. Draft·미병합·독립 협업자 재검토 필요. 현행 최소 데이터 계약·출처 판본 불변성/동시 검수·실 Supabase 권리/운영 인수는 미완료이며 실제 학교 자료 OFF. |

병합 기준은 [AGENTS.md](../AGENTS.md#작업승인권리-경계)에 있습니다.

## 종료된 작업·역사적 설계와 최종 인수

- 역사적 설계 HMD-001~032는 GitHub [닫힌 이슈 검색](https://github.com/ot4562-glitch/Hanmo_develop/issues?q=is%3Aissue+is%3Aclosed)에서 버전 이력 확인; 현재 서비스 구현 근거로 오인하지 않습니다.
- 현재 취소된 **독립 문의처 #59**, **결과 공유/등급 제안 #132·#133**, 과거 FAQ·졸업·학칙/학생 판정 제안은 신규 구현을 하지 않습니다.
- 이전 합성 모델과 자동 검사의 기록은 [PR #141](https://github.com/ot4562-glitch/Hanmo_develop/pull/141)과 [2026-11-25 QA 보고서](qa/2026-11-25-full-qa.md)에서 확인합니다. 당시 `ba57b48`의 [Feature QA](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45562424316)는 통과했고 [Repository checks](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45562424365)는 취소로 종료됐습니다.
- `docs/README.md`의 역사 문서와 [아키텍처](architecture.md)의 현행 설계는 역할을 분리합니다. API 스키마·학교 규정·정책은 서면 직원 안내·잠정 운영 방침의 범위를 넘어 자동 활성화하지 않습니다.
