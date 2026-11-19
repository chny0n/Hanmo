# 한모 미결 작업 명세 - GitHub Issues

이 문서는 [현행 architecture.md](architecture.md)에서 연결하는 기존 32개 설계 이슈의 작업 명세입니다. 기능 구현·권한 승인·배포의 진행 상태는 각 GitHub 이슈에서 확인합니다.

> **등록 완료:** 32개 추적 ID `HMD-001`~`HMD-032`는 GitHub Issues [#7~#38](https://github.com/ot4562-glitch/Hanmo_develop/issues)에 각각 등록됐습니다. 아래 제목·완료 조건은 실제 이슈에 연결돼 있으며, 개별 작업의 결정·완료 상태는 GitHub에서 관리합니다.

1차 확장 작업의 상세 조건은 [#39 화면 통합](https://github.com/ot4562-glitch/Hanmo_develop/issues/39), [#40 한국어 FAQ 평가](https://github.com/ot4562-glitch/Hanmo_develop/issues/40), [#41 검수 데이터·백테스트](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)에 있습니다.

우선순위: **P0** 진행 전 반드시 결정 · **P1** 해당 단계의 구현·검증에 필요 · **P2** 선택 확장/후속 단계.

## 미결 작업 목록

| ID | 우선순위 | 단계 | 개별 작업 |
|---|---|---|---|
| [HMD-001 · #7](https://github.com/ot4562-glitch/Hanmo_develop/issues/7) | P0 | 공통 | 1단계 필수 출시 기능과 후속 확장의 범위를 확정한다 |
| [HMD-003 · #9](https://github.com/ot4562-glitch/Hanmo_develop/issues/9) | P0 | 공통 | GPL-3.0과 이식 코드·학사 자료의 배포 권리를 검수한다 |
| [HMD-005 · #11](https://github.com/ot4562-glitch/Hanmo_develop/issues/11) | P0 | 1차 | 공식 학칙 RulePack과 판본별 졸업요건 검수 범위를 정한다 |
| [HMD-007 · #13](https://github.com/ot4562-glitch/Hanmo_develop/issues/13) | P1 | 1차 | 강의 개설 전망과 학사행사 예상 구간의 근거·보류 기준을 확정한다 |
| [HMD-009 · #15](https://github.com/ot4562-glitch/Hanmo_develop/issues/15) | P1 | 1차 | 근거 기반 FAQ와 상담 부서 연결의 채택·검증 범위를 정한다 |
| [HMD-011 · #17](https://github.com/ot4562-glitch/Hanmo_develop/issues/17) | P0 | 1차 | 학생 로컬 저장 스키마·키 네임스페이스·백업/복원·삭제 정책을 정한다 |
| [HMD-013 · #19](https://github.com/ot4562-glitch/Hanmo_develop/issues/19) | P0 | 2차 | 기존 BASIC/TIME/SELECT 기준 동작·키보드·타이머 회귀 테스트를 확보한다 |
| [HMD-014 · #20](https://github.com/ot4562-glitch/Hanmo_develop/issues/20) | P1 | 2차 | 마지막 과목 신청 실패 및 대체과목 선택 상태 머신을 설계한다 |
| [HMD-015 · #21](https://github.com/ot4562-glitch/Hanmo_develop/issues/21) | P1 | 2차 | 가상 연결 끊김·재접속·결과 불명 시나리오 상태 머신을 설계한다 |
| [HMD-016 · #22](https://github.com/ot4562-glitch/Hanmo_develop/issues/22) | P0 | 1·2차 | 학업 코어와 모의신청 간 과목 ID·상태 어댑터 계약을 확정한다 |
| [HMD-020 · #26](https://github.com/ot4562-glitch/Hanmo_develop/issues/26) | P1 | 검증 | PC 전용 지원 범위·접근성 및 모바일 안내 기준을 검증한다 |
| [HMD-021 · #27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27) | P0 | 데이터 | 공식 학사자료 수집 가능 범위·재사용 권리·출처 목록을 만든다 |
| [HMD-023 · #29](https://github.com/ot4562-glitch/Hanmo_develop/issues/29) | P0 | 3차 | Supabase Free 운영·관리 권한과 공동 장애 대응 인수를 검증한다 |
| [HMD-024 · #30](https://github.com/ot4562-glitch/Hanmo_develop/issues/30) | P1 | 3차 | Supabase 스키마·판본·스냅샷·마이그레이션 설계를 확정한다 |
| [HMD-025 · #31](https://github.com/ot4562-glitch/Hanmo_develop/issues/31) | P1 | 3차 | 허용된 공식 자료 수집·변경 감지·검수·정적 대체 흐름을 정의한다 |
| [HMD-026 · #32](https://github.com/ot4562-glitch/Hanmo_develop/issues/32) | P1 | 3차 | Supabase API·RLS·비밀키·브라우저 읽기 권한 보안을 정한다 |
| [HMD-028 · #34](https://github.com/ot4562-glitch/Hanmo_develop/issues/34) | P0 | 3차 | Supabase 실연동·운영 모니터링·복구를 포함한 3차 인수 시험을 정의한다 |
| [HMD-030 · #36](https://github.com/ot4562-glitch/Hanmo_develop/issues/36) | P2 | 4차 | JavaScript/JSDoc 정적 검사·TS 동등성·회귀 검증 및 완료 기준을 정한다 |
| [HMD-031 · #37](https://github.com/ot4562-glitch/Hanmo_develop/issues/37) | P0 | 2차 | 위기 대응 시나리오 다양성·난이도·조합형 훈련 체계 설계 |
| [HMD-032 · #38](https://github.com/ot4562-glitch/Hanmo_develop/issues/38) | P1 | 공통 | 한모 차별화 메시지·유사 서비스 비교·예측 안내 품질 기준 |

## 개별 이슈 명세

<a id="hmd-001"></a>
### HMD-001 · [P0][공통] 1단계 필수 출시 기능과 후속 확장의 범위를 확정한다

- **GitHub Issue:** [#7](https://github.com/ot4562-glitch/Hanmo_develop/issues/7) · 상태: 열림
- **재검토 결과:** 격리된 PR #5에서 학생 화면과 타입 검사·650개 테스트·정적 빌드를 확인했습니다. 권리가 확인된 공지·강의 스냅샷으로 성적표 없는 사용자 흐름과 정정·취소를 끝까지 재현하는 조건이 남았습니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §1.2, 4.8:** 성적표 없는 전공 → 공지 → 개설 전망으로 첫 출시 범위를 정했습니다. 검수 자료를 넣은 전체 학생 흐름과 정정·취소·자료 부족 화면 확인이 남았습니다.
- **연결 작업:** [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42) · [#51](https://github.com/ot4562-glitch/Hanmo_develop/issues/51) · [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39)
- **대상 단계:** 1차
- **문제/결정:** [현행 설계 §1.2](architecture.md#12-첫-학생용-출시-범위)의 첫 출시 범위를 기준으로 화면별 인수 조건과 후속 확장 범위를 구체화한다. 첫 흐름은 캠퍼스·전공 선택, 중요공지·원문 확인, 개설 이력 조회이며, 한국어 FAQ는 검증된 범위부터 연결한다. 개인별 졸업 진단은 이수 기록 입력과 RulePack 검증 후 확장한다.
- **완료 조건:**
  - [ ] 필수·선택·후속 기능을 현행 출시 범위와 대조하고 화면별 인수 조건 확정
  - [ ] 검수된 공통 스냅샷으로 성적표 없는 필수 흐름과 정정·취소·자료 부족 화면 검증
  - [ ] 범위 미확정 기능을 완성으로 표시하거나 일괄 병합하지 않음
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-002"></a>
### HMD-002 · [P0][공통] PR #1~#5에서 파일별 선별 병합·보존/제외 기준을 만든다

- **GitHub Issue:** [#8](https://github.com/ot4562-glitch/Hanmo_develop/issues/8) · 상태: 설계·증빙 확인 완료
- **재검토 결과:** PR #1~#5의 변경 파일 133건(변경 경로가 여러 PR에 나타나는 경우 포함)을 파일별로 분류했습니다. 각 PR 성공 검사와 최종 HEAD의 원본 경로 변경 0건을 확인했습니다. 공개·권리·원작자 승인 게이트는 별도로 적용합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §3.1:** 화면·실행 코어·테스트를 파일별로 선별하기로 했습니다. PR #1~#5의 실제 채택·수정·제외 표, 원본 비교, 승인과 CI 확인이 남았습니다.
- **연결 작업:** [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57)
- **대상 단계:** 1차
- **문제/결정:** 중첩 PR의 실행 코어·정적 UI·테스트·참조 소스와 아카이브를 분리해 파일 단위로 채택한다.
- **완료 조건:**
  - [ ] 파일별 채택/수정/제외 매트릭스와 이유 작성
  - [ ] 정적 사이트 배포에 React/Fastify/비학업 원본을 포함하지 않음
  - [ ] 기존 한모 원본 변경 0건 및 CI 재검증
  - [ ] 원개발자 승인 없는 병합·배포 금지
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-003"></a>
### HMD-003 · [P0][공통] GPL-3.0과 이식 코드·학사 자료의 배포 권리를 검수한다

- **GitHub Issue:** [#9](https://github.com/ot4562-glitch/Hanmo_develop/issues/9) · 상태: 열림
- **승인 상태:** 2026-11-18 사용자 확인으로 이식 코드 사용 승인을 기록했습니다. 기존 GPL-3.0 `LICENSE`와 이식 원본·변경 기록을 유지합니다.
- **현행 설계 §3.1, 6:** 학교 학사자료의 사용·재배포 회신은 #27에 연결합니다. 공개 묶음의 라이선스·변경 고지·크레딧과 학교 자료별 출처 대조가 남았습니다.
- **연결 작업:** [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27) · [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42)
- **대상 단계:** 공통
- **문제/결정:** 한모 GPL-3.0 고지 및 이식된 HUFS One AI 기여 코드의 원본별 재배포 허용 범위, 참고용 235개 아카이브 필요성을 확인한다.
- **완료 조건:**
  - [ ] 소스·테스트·데이터별 권리·기여자·출처 목록 작성
  - [ ] 권리 미확정 소스와 개인정보 포함 샘플의 공개 제외 기준 확정
  - [ ] 소스 제공/라이선스/수정 고지/개발자 크레딧 확인
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-004"></a>
### HMD-004 · [P0][1차] 학생용 학업 UI와 JSON 진단 UI를 분리한다

- **GitHub Issue:** [#10](https://github.com/ot4562-glitch/Hanmo_develop/issues/10) · 상태: 설계 결정 완료
- **현행 설계 §4.8:** 학생 화면 지도, 고급 JSON 진단 분리, 빈 값·형식 오류·권리 부족·규칙 충돌·갱신 필요 및 저장·삭제 안내를 확정했습니다.
- **연결 작업:** [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#63](https://github.com/ot4562-glitch/Hanmo_develop/issues/63)
- **대상 단계:** 1차
- **문제/결정:** 현재 JSON 중심 시연을 캠퍼스·입학년도·전공·취득학점·학사 일정이 연결된 일반 학생용 흐름으로 전환할 설계를 확정한다.
- **완료 조건:**
  - [ ] 프로필→현황→계획→공지·행동의 화면/탐색 지도 작성
  - [ ] JSON 직접 수정은 고급·진단으로 격리
  - [ ] 결측/오류/권리 미확인 상태와 로컬 저장·삭제 UX 정의
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-005"></a>
### HMD-005 · [P0][1차] 공식 학칙 RulePack과 판본별 졸업요건 검수 범위를 정한다

- **GitHub Issue:** [#11](https://github.com/ot4562-glitch/Hanmo_develop/issues/11) · 상태: 열림
- **재검토 결과:** PR #5의 학칙 승인·변경 비교 테스트를 확인했습니다. 캠퍼스·입학년도·전공별 학칙 정본과 독립 검수 표본이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.1–4.2:** 서울·글로벌캠퍼스, 2010학년도 입학생부터, 모든 전공으로 첫 적용 대상을 확정했습니다. 각 조합의 공식 원문·예외·소급 검수 표본, 독립 검수·승인이 남았습니다.
- **연결 작업:** [#47](https://github.com/ot4562-glitch/Hanmo_develop/issues/47)
- **대상 단계:** 1차
- **문제/결정:** 캠퍼스·학번·전공·이중전공/부전공·학적·비학점 조건에 대한 검수 우선 범위와 학칙 개정 처리 책임을 확정한다.
- **완료 조건:**
  - [ ] 우선 학번·학과·요건·원문 조항의 검수 범위 합의
  - [ ] RulePack 승인·개정 비교·소급·상태 보류와 회귀 사례 명시
  - [ ] 학교 정본 없이 졸업 승인으로 확정하지 않음
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-006"></a>
### HMD-006 · [P1][1차] WIS 수동 HTML/CSV의 강의·분반 가져오기와 CSV 내보내기 계약을 정한다

- **GitHub Issue:** [#12](https://github.com/ot4562-glitch/Hanmo_develop/issues/12) · 상태: 설계·증빙 확인 완료
- **재검토 결과:** PR #5의 WIS HTML 28건, CSV 내보내기 8건, CSV 가져오기 4건의 파서 회귀를 통과했습니다. 분반 식별, 빈 값, 중복과 충돌, 컬럼 오류 및 허용된 내보내기 필드를 확인했습니다. 학생용 CSV 화면 연결은 #43에서 추적합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.3:** 로컬 HTML·CSV 입력과 UTF-8 허용 필드 출력 계약을 채택했습니다. 실제 HTML·CSV 입력 실패, 빈 값·중복·분반 식별 회귀 증빙이 남았습니다.
- **연결 작업:** [#43](https://github.com/ot4562-glitch/Hanmo_develop/issues/43)
- **대상 단계:** 1차
- **문제/결정:** 강의 고유 ID, 학기별 분반, 교수 표시명과 소속 정본을 혼동하지 않는 입력·출력 형식이 필요하다.
- **완료 조건:**
  - [ ] 입력 출처·필드·식별자·빈 값·중복 오류 정의
  - [ ] 분반/동일 교과목을 추측해 합치지 않는 테스트
  - [ ] 내보내기 CSV 인코딩·컬럼·개인정보 제외 확정
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-007"></a>
### HMD-007 · [P1][1차] 강의 개설 전망과 학사행사 예상 구간의 근거·보류 기준을 확정한다

- **GitHub Issue:** [#13](https://github.com/ot4562-glitch/Hanmo_develop/issues/13) · 상태: 열림
- **재검토 결과:** 개설·행사 코어와 시점 재현 회귀는 통과했습니다. 실제 출처의 관측 범위와 판본을 갖춘 데이터로 평가하는 #41과 #48의 결과가 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.5:** 같은 시즌 관측 k/n과 최소 두 해의 행사 준비 구간, 공식 확정 우선 원칙을 채택했습니다. 권리·관측 범위가 검수된 이력과 시점 재현 백테스트가 남았습니다.
- **연결 작업:** [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41) · [#48](https://github.com/ot4562-glitch/Hanmo_develop/issues/48) · [#52](https://github.com/ot4562-glitch/Hanmo_develop/issues/52)
- **대상 단계:** 1차
- **문제/결정:** 과거 자료의 누락 학기를 미개설로 오해하거나 반복 행사 예상일을 공식 신청 마감으로 제시하지 않는다.
- **완료 조건:**
  - [ ] 관측 완전성·계절 분류·공식 확정 우선 규칙
  - [ ] 강의 개설 확률 표기에는 사전 검증·백테스트 요구
  - [ ] 학사행사 최소 2년 이력·분산 기준·불확실성 표시 검증
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-008"></a>
### HMD-008 · [P0][1차] 학사공지 대상·학생 마감·정정/취소·최대 2건 우선 노출 계약을 확정한다

- **GitHub Issue:** [#14](https://github.com/ot4562-glitch/Hanmo_develop/issues/14) · 상태: 설계 결정 완료
- **현행 설계 §4.4, 6:** 학생 적용 여부와 검수 상태를 분리하고, 한국시간 기준 7일 이내의 검수된 해당 학생 필수 공지를 최대 2건 고정합니다. 행정 마감·지난 마감·정정·취소·대상 미확인은 별도로 처리합니다.
- **연결 작업:** [#46](https://github.com/ot4562-glitch/Hanmo_develop/issues/46) · [#51](https://github.com/ot4562-glitch/Hanmo_develop/issues/51) · [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58)
- **대상 단계:** 1차
- **문제/결정:** 공지 제목만 있거나 사용자 JSON에 SOURCE_REVIEWED가 적혀 있으면 검수된 학생 D-day로 승격시키지 않는다.
- **완료 조건:**
  - [ ] 공지 판본/원문/취소·학생 마감/행정 마감 명확히 분리
  - [ ] 학생 조건 YES/NO/UNKNOWN·한국시간 기준 및 지난 마감 처리
  - [ ] 검수된 필수 공지만 2건 이내 고정·미확인 공지 별도 안내
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-009"></a>
### HMD-009 · [P1][1차] 근거 기반 FAQ와 상담 부서 연결의 채택·검증 범위를 정한다

- **GitHub Issue:** [#15](https://github.com/ot4562-glitch/Hanmo_develop/issues/15) · 상태: 열림
- **재검토 결과:** 검색·근거·판본 회귀는 합성 질문으로 통과했습니다. 재이용 승인된 실제 문단과 사람 검수 평가셋, 실제 판본의 근거 오류 0건 검증이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.6:** 추출형 한국어 FAQ와 학교 담당 부서 연결을 채택했습니다. 사용 허가와 사람 검수 평가셋, 근거 없는 숫자·마감 및 철회 판본 0건의 실제 검증이 남았습니다.
- **연결 작업:** [#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40) · [#44](https://github.com/ot4562-glitch/Hanmo_develop/issues/44) · [#53](https://github.com/ot4562-glitch/Hanmo_develop/issues/53) · [#54](https://github.com/ot4562-glitch/Hanmo_develop/issues/54) · [#59](https://github.com/ot4562-glitch/Hanmo_develop/issues/59)
- **대상 단계:** 1차
- **문제/결정:** BM25 검색, 출처 문단 인용, 최신 개정 판본과 부정/예외 문구를 보호하는 범위를 정한다.
- **완료 조건:**
  - [ ] FAQ 활용 권리·검수 판본·철회 상태 검증
  - [ ] 인용과 날짜/숫자/부정 조건의 왜곡 방지 테스트
  - [ ] 공식 상담 예약·답변·개인 자격 확정을 가장하지 않음
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-010"></a>
### HMD-010 · [P2][1차] 교환학생·국제학생 학업 준비는 선택형 확장 범위로 판단한다

- **GitHub Issue:** [#16](https://github.com/ot4562-glitch/Hanmo_develop/issues/16) · 상태: 설계 결정 완료
- **현행 설계 §4.7:** 다학기 계획과 개인 졸업 진단 뒤 서울·글로벌의 교환학생 준비와 국제학생 안내를 선택 확장합니다. 확인된 파견 범위와 영·중 번역 판본, 체크 무효화, 공식 확인 경계를 확정했습니다.
- **연결 작업:** [#60](https://github.com/ot4562-glitch/Hanmo_develop/issues/60) · [#61](https://github.com/ot4562-glitch/Hanmo_develop/issues/61)
- **대상 단계:** 1차
- **문제/결정:** 지원 언어·캠퍼스·파견 유형 및 번역본 판본 일치 여부를 검토한다. 진로/취업 기능은 제외한다.
- **완료 조건:**
  - [ ] 채택 여부 및 출시 후순위·대상 확정
  - [ ] 교환 정책·언어 성적·학점인정 공식 확인 경계
  - [ ] 번역 원문 revision 변경 시 안내·체크리스트 무효화
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-011"></a>
### HMD-011 · [P0][1차] 학생 로컬 저장 스키마·키 네임스페이스·백업/복원·삭제 정책을 정한다

- **GitHub Issue:** [#17](https://github.com/ot4562-glitch/Hanmo_develop/issues/17) · 상태: 열림
- **재검토 결과:** 현재 저장 키와 같은 탭의 요건 후보 전달 경계를 확인했습니다. 버전 있는 로컬 원장의 용량·보존과 백업·복원 실패를 확인할 #45가 남았습니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.8:** 분리된 로컬 저장·백업·복원·삭제를 채택했습니다. 용량·보존 한계 수치와 옛 자료 이전·복원 실패 시험이 남았습니다.
- **연결 작업:** [#45](https://github.com/ot4562-glitch/Hanmo_develop/issues/45)
- **대상 단계:** 1차
- **문제/결정:** 한모의 practiceSetter/subjectValue 등 기존 저장 상태와 학업 성적·계획 정보를 혼합하지 않는다.
- **완료 조건:**
  - [ ] 기존 한모 저장 키와 신규 학업 데이터 키 완전 분리
  - [ ] 스키마 버전·용량·만료·내보내기/복원·마이그레이션 결정
  - [ ] 공유 PC 및 개인정보 삭제·옵트인 동기화 여부 명시
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-012"></a>
### HMD-012 · [P0][2차] 원개발자 승인 범위와 기존 JavaScript 확장 지점을 합의한다

- **GitHub Issue:** [#18](https://github.com/ot4562-glitch/Hanmo_develop/issues/18) · 상태: 개발 승인·설계 완료
- **승인 상태:** 2026-11-18 사용자 확인으로 원개발자의 포크 내 고도화 개발 승인을 기록했습니다.
- **현행 설계 §5, 6.1:** `practice`의 진입, `selectZone`의 모의 신청·대기열, `result`의 결과 복기를 기존 HTML·JavaScript 확장 경계로 정했습니다. 원본 운영 사이트에 반영할 때는 별도 운영 승인·검증 절차를 적용합니다.
- **연결 작업:** [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49) · [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50) · [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62)
- **대상 단계:** 2차
- **문제/결정:** 기존 연습 페이지의 BASIC/TIME/SELECT에만 HTML·JavaScript로 시나리오를 붙인다.
- **완료 조건:**
  - [x] 포크 내 수정 범위와 UI·핸들러·운영 반영 승인 절차 기록
  - [x] 기존 practice.js/selectZone.js/result.js 연동 위치 검토
  - [x] 기존 HTML·JavaScript의 선택형 확장으로 설계
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-013"></a>
### HMD-013 · [P0][2차] 기존 BASIC/TIME/SELECT 기준 동작·키보드·타이머 회귀 테스트를 확보한다

- **GitHub Issue:** [#19](https://github.com/ot4562-glitch/Hanmo_develop/issues/19) · 상태: 열림
- **재검토 결과:** 본체 루트의 원본 보호 비교는 통과했습니다. 세 모드의 실제 조작 기준 기록과 새 시나리오 OFF에서의 전후 비교가 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §5, 6.1:** 세 기존 모드와 시나리오 OFF 회귀 기준을 채택했습니다. 실제 브라우저에서 재현 가능한 단계별 기준·결과 기록이 남았습니다.
- **연결 작업:** [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49) · [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50) · [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62)
- **대상 단계:** 2차
- **문제/결정:** 기존 한모의 정상 연습 플로우를 스냅샷/브라우저 테스트로 확보한 후 시나리오를 추가한다.
- **완료 조건:**
  - [ ] 각 모드의 시작·대기·입력·신청·결과·삭제 기준 기록
  - [ ] 시나리오 OFF에서 포커스·시간·클릭 결과 동일성 검증
  - [ ] 실제 기기/브라우저에서 재현 가능한 테스트 계획
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-014"></a>
### HMD-014 · [P1][2차] 마지막 과목 신청 실패 및 대체과목 선택 상태 머신을 설계한다

- **GitHub Issue:** [#20](https://github.com/ot4562-glitch/Hanmo_develop/issues/20) · 상태: 열림
- **재검토 결과:** PR #5의 전망 시나리오 단위 테스트는 모의수강신청의 마지막 과목 실패를 실행하지 않습니다. #49의 시드·대체 제약·종료 상태 시험이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §5.1:** 마지막 목표를 실패시키고 학생이 직접 대안과 대안 없음을 판단하는 흐름을 채택했습니다. 합성 ID·시드별 대체 제약 및 종료 결과 검증이 남았습니다.
- **연결 작업:** [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49)
- **대상 단계:** 2차
- **문제/결정:** 가상 정원 마감·대체 선택·충돌·대안 없음의 결과를 학생 조작으로 판정한다.
- **완료 조건:**
  - [ ] 합성 시나리오 ID·시드·마지막 과목 실패 규칙
  - [ ] 대체검색·학점/시간표/선수요건·중복 신청 검증
  - [ ] 대안 없음/대체 성공/실패·오류 종료 결과 분리
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-015"></a>
### HMD-015 · [P1][2차] 가상 연결 끊김·재접속·결과 불명 시나리오 상태 머신을 설계한다

- **GitHub Issue:** [#21](https://github.com/ot4562-glitch/Hanmo_develop/issues/21) · 상태: 열림
- **재검토 결과:** 현재 브랜치에서 가상 단절·재시도 실행 코드를 확인하지 못했습니다. #50의 성공·미신청·결과 불명과 중복 신청 방지 시험이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §5.2:** 첫 가상 단절은 신청 직후이며 복구 후 성공·미신청·결과 불명을 구분합니다. 재현 시드·대기열·재시도와 오류/실수 측정 검증이 남았습니다.
- **연결 작업:** [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50)
- **대상 단계:** 2차
- **문제/결정:** 실제 네트워크/학교 SSO를 끊거나 조작하지 않고 브라우저 안에서만 실패와 복구를 재현한다.
- **완료 조건:**
  - [ ] 단절 지점·대기열·재입장·재시도 상태 계약
  - [ ] 결과 불명 신청을 중복 성공 또는 자동 재신청하지 않음
  - [ ] 복구 시간·오류·실수 평가 및 시드 재현 검증
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-016"></a>
### HMD-016 · [P0][1·2차] 학업 코어와 모의신청 간 과목 ID·상태 어댑터 계약을 확정한다

- **GitHub Issue:** [#22](https://github.com/ot4562-glitch/Hanmo_develop/issues/22) · 상태: 열림
- **재검토 결과:** 계산에서 공지로 요건 후보만 전달하는 경계를 확인했습니다. 가상 과목과 실제 분반의 대응 표본 및 명시적 변환기의 입출력 회귀는 #62가 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §5:** 버전 있는 명시적 변환표와 미매핑 반환, 연습 기록 격리를 채택했습니다. 확인된 과목·분반 ID 표본과 JS 경계 입력·출력 시험이 남았습니다.
- **연결 작업:** [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62)
- **대상 단계:** 공통
- **문제/결정:** 서로 다른 과목 ID 체계와 분반을 명시적으로 매핑하고, 시뮬레이터의 합성 신청 결과가 이수 원장에 저장되지 않게 한다.
- **완료 조건:**
  - [ ] 가상 ID↔실제 과목·분반 ID 변환 규격 및 버전 정의
  - [ ] 직접 원장 공유·성적 복사·학교 시스템 전송 차단
  - [ ] 1차 TypeScript의 빌드 후 JS 경계와 2차 기존 JS 입력/출력 테스트
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-017"></a>
### HMD-017 · [P0][배포] 개발 미리보기와 GitHub Pages 운영 경로·CNAME 계약을 정한다

- **GitHub Issue:** [#23](https://github.com/ot4562-glitch/Hanmo_develop/issues/23) · 상태: 설계·증빙 확인 완료
- **재검토 결과:** Pages의 프로젝트 주소·워크플로 소스·커스텀 도메인 미연결 상태를 확인하고, 원본 도메인 및 개발 미리보기 경로를 분리했습니다. Edge에서 루트와 프로젝트 접두어의 학업 페이지·자산·새로고침·404 및 미리보기 CNAME 제외를 검증했습니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §3.1, 6.1:** CNAME 없는 별도 개발 미리보기와 운영 주소의 분리를 채택했습니다. 운영·미리보기 주소 및 경로·자산·새로고침·404 확인이 남았습니다.
- **연결 작업:** [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57)
- **대상 단계:** 1·2차
- **문제/결정:** 현재 stage-static.mjs는 미리보기에서 CNAME을 제거하며 기존 HTML에는 절대경로 이동이 있다. 프로젝트 경로와 실제 사용자 도메인을 별개로 검증해야 한다.
- **완료 조건:**
  - [ ] preview 경로와 운영/custom domain 배포 분리
  - [ ] 상대·절대 URL/이미지/스크립트 경로·404·새로고침 검사
  - [ ] 운영 루트와 CNAME 변경은 원개발자 승인 후 실행
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-018"></a>
### HMD-018 · [P1][배포] 기능 코드 PR 승인·릴리스 체크리스트·롤백 방법을 확정한다

- **GitHub Issue:** [#24](https://github.com/ot4562-glitch/Hanmo_develop/issues/24) · 상태: 설계 결정 완료
- **현행 설계 §6.1:** 작성자와 별도인 코드 검토, 원본 변경 승인, 미리보기, 운영 승인, 안정 태그/SHA 기록과 이전 배포본 또는 시나리오 비활성화로 복구하는 체크리스트를 확정했습니다.
- **연결 작업:** [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67)
- **대상 단계:** 공통
- **문제/결정:** 설계 직접 커밋과 달리 프로그램 PR의 CI 통과, 검수, 운영 배포 및 복구 승인을 분리한다.
- **완료 조건:**
  - [ ] 코드 PR 승인자·배포 책임·릴리스 게이트 명시
  - [ ] 1차 신규 기능 격리·2차 시나리오 OFF 플래그/롤백 경로
  - [ ] 태그·배포 검증·운영 장애 복구 체크리스트
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-019"></a>
### HMD-019 · [P1][검증] 단계별 CI와 브라우저 E2E 품질 게이트를 정의한다

- **GitHub Issue:** [#25](https://github.com/ot4562-glitch/Hanmo_develop/issues/25) · 상태: 설계 결정 완료
- **현행 설계 §6.1, 9:** 1차 빌드·권리·브라우저, 2차 순수 JS와 기존 모드 회귀, 3차 운영·권한·복구, 4차 차등 검사의 적용 범위를 확정했습니다.
- **연결 작업:** [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39) · [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) · [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)
- **대상 단계:** 공통
- **문제/결정:** 1차 TS 타입/테스트/번들과 2차 원본 JS 회귀 테스트를 독립 실행하고, Supabase 3차에는 API/보안 검사를 추가한다.
- **완료 조건:**
  - [ ] 1차 타입 검사·정적 빌드·권리/아카이브 검증 적용 범위
  - [ ] 2차 JS 단독 동작·기존 모드 회귀·접근성 검사
  - [ ] 3차 데이터·권한·실연동 E2E와 4차 동등성 검증 포함
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-020"></a>
### HMD-020 · [P1][검증] PC 전용 지원 범위·접근성 및 모바일 안내 기준을 검증한다

- **GitHub Issue:** [#26](https://github.com/ot4562-glitch/Hanmo_develop/issues/26) · 상태: 열림
- **기존 참고 기록:** 과거 Edge 390px 반응형 실험은 진행했으나 모바일 지원 결정은 폐기됐습니다. 2026-11-19부터 **PC 전용**을 제품 정책으로 적용하며 실제 화면낭독기와 PC 안내/달력 조작 검증은 남았습니다. [이전 시험 기록](pr-stack-review.md)
- **2026-11-19 확정 §4.8, 6.1:** 기존 BASIC/TIME/SELECT와 신규 학업 화면 모두 **PC 전용**입니다. Windows PC Chrome/Edge를 우선 검증하며 모바일·태블릿 지원을 출시 범위에서 제외합니다. PC에서 키보드·화면낭독기·달력과 작은 PC 창의 오류 처리, 비지원 기기 안내 시험은 남았습니다.
- **연결 작업:** [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39) · [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58)
- **대상 단계:** 1·2차
- **문제/결정:** 전체 한모를 PC 전용으로 통일하고 모바일·태블릿은 공식 지원하지 않습니다. 모바일 접속에는 PC 이용 안내를 제공하되 사용자 에이전트·창 너비만으로 정상 PC 접속을 오인 차단하지 않습니다.
- **완료 조건:**
  - [x] 1·2차 및 후속 전체 서비스의 **PC 전용 정책** 확정(2026-11-19 사용자 결정)
  - [ ] Windows PC Chrome/Edge에서 키보드·스크린리더·상태 알림·달력 조작 시험 기록
  - [ ] 모바일/태블릿 미지원 안내 및 작은 PC 창 예외 처리의 실제 화면·브라우저 검증
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-021"></a>
### HMD-021 · [P0][데이터] 공식 학사자료 수집 가능 범위·재사용 권리·출처 목록을 만든다

- **GitHub Issue:** [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27) · 상태: 열림
- **재검토 결과:** 학교 공개 공지·편람·강의시간표의 확인 경로와 후보 출처 목록을 확인했습니다. 재배포·정기 수집 허락과 담당 부서의 확인 기록은 확보가 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §6, 7.2:** 한국외대 학사종합지원센터에 공지·개설 이력·학칙·FAQ 원문의 링크, 인용·요약, 구조화 자료 배포, 자동 수집 허용 여부를 문의합니다. 자료별 관리 부서·원문 URL·회신을 적은 근거표가 남았습니다.
- **연결 작업:** [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41) · [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42) · [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66)
- **대상 단계:** 1·3차
- **문제/결정:** 학칙, 공지, 강의, 학사력의 공개 접근 권한과 자동 수집 허가를 출처별로 확인한다. 로그인·SSO 우회는 금지한다.
- **완료 조건:**
  - [ ] 출처별 원문 URL·관리부서·권리·갱신 가능성 표 작성
  - [ ] 수동 WIS 자료와 공식 검수 자료를 분리
  - [ ] 허가 없는 수집을 진행하지 않고 데이터 부재 시 정적 대체
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-022"></a>
### HMD-022 · [P0][데이터] 독립 학사자료 검수·승인·철회 권한 모델을 확정한다

- **GitHub Issue:** [#28](https://github.com/ot4562-glitch/Hanmo_develop/issues/28) · 상태: 설계 결정 완료
- **현행 설계 §6, 7.1–7.2:** 독립 검수자와 승인자를 분리하고, 원문 해시·개정·검수/승인·철회 기록 및 공지·FAQ 무효화와 구판 대체 요건을 확정했습니다.
- **연결 작업:** [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42) · [#44](https://github.com/ot4562-glitch/Hanmo_develop/issues/44) · [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64) · [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66)
- **대상 단계:** 1·3차
- **문제/결정:** 사용자 업로드나 생성 AI가 주장하는 SOURCE_REVIEWED를 공식 검수로 인정하지 않으며, 운영자 승인된 자산·서명을 기준으로 한다.
- **완료 조건:**
  - [ ] 작성자·검수자·승인자의 역할/기록·최소 분리 요건
  - [ ] 원문 해시·판본·승인 시점·권리 철회·재검토 기준
  - [ ] 정정·취소·충돌 시 이전 승인 판본 재사용 안전 규칙
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-023"></a>
### HMD-023 · [P0][3차] Supabase Free 운영·관리 권한과 공동 장애 대응 인수를 검증한다

- **GitHub Issue:** [#29](https://github.com/ot4562-glitch/Hanmo_develop/issues/29) · 상태: 열림
- **2026-11-19 결정:** Supabase는 **Free 플랜($0)만 사용**합니다. 임창용 님이 프로젝트 운영을 관리하고 장애는 개발팀이 함께 신속히 진단·복구합니다. 유료 업그레이드·애드온은 도입하지 않습니다. 실제 계정 권한, 수동 백업/복원과 장애 대응 연결 시험은 아직 남았습니다. [이전 시험 기록](pr-stack-review.md)
- **현행 설계 §7.1–7.6:** 임창용 님을 **Supabase 운영 담당 A/R**로 정하고 개발팀이 장애 공동 대응 R을 맡습니다(사용자 확인). 무료 용량·전송량 경고·원문 비저장·수동 백업·정적 대체 정책을 채택했으며 학교 자료 검수·실접근 권한·복원 시험은 별도입니다.
- **연결 작업:** [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64) · [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67)
- **대상 단계:** 3차
- **문제/결정:** 임창용 님은 Supabase Free 운영 관리, 개발팀은 장애 시 공동 진단·복구. DB/전송량이 한도를 넘으면 유료 전환 대신 자료/요청 축소와 허가된 정적 스냅샷 대체를 수행하고, 실접근/백업·검수 승인 책임은 운영 구축 시 구체화한다.
- **완료 조건:**
  - [x] **Free($0)만 사용**, **임창용 님 운영 관리**, **개발팀 공동 장애 대응** 정책 기록(2026-11-19)
  - [ ] 실제 프로젝트 소유 계정·관리자 접근·비밀키/오프사이트 백업·연락 채널·독립 자료 승인자 확인
  - [ ] DB/egress 수용량 표 및 무료 한도 경고·정적 대체·복원 실측 시험, 인계/실연동 완료 게이트 분리
  - [ ] 운영 도메인/학교 자료 사용 허가 조건·최종 실배포 책임 기록
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-024"></a>
### HMD-024 · [P1][3차] Supabase 스키마·판본·스냅샷·마이그레이션 설계를 확정한다

- **GitHub Issue:** [#30](https://github.com/ot4562-glitch/Hanmo_develop/issues/30) · 상태: 열림
- **재검토 결과:** 현재는 논리 관계와 PR #5의 정적 배포 구조까지 확인됩니다. 실연동용 SQL 키·인덱스·버전 전환·용량·백업 검증은 #64에 남아 있습니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §7.1, 7.3:** 과목·분반·개정·검수 기록을 분리하고 판본 묶음으로 읽습니다. 물리 스키마·키/인덱스·유효기간·마이그레이션·용량·백업 계약이 남았습니다.
- **연결 작업:** [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64)
- **대상 단계:** 3차
- **문제/결정:** courses/sections/teachings, rules, notices/revisions, source_reviews, data_snapshots 등을 구조화하고 규정·공지 변경으로 기존 계산을 STALE 처리한다.
- **완료 조건:**
  - [ ] 논리/물리 스키마·키·인덱스·유효기간·개정 체인
  - [ ] 읽기 스냅샷 판본과 데이터 갱신/충돌 테스트
  - [ ] SQL 마이그레이션·용량/비용/백업 설계
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-025"></a>
### HMD-025 · [P1][3차] 허용된 공식 자료 수집·변경 감지·검수·정적 대체 흐름을 정의한다

- **GitHub Issue:** [#31](https://github.com/ot4562-glitch/Hanmo_develop/issues/31) · 상태: 열림
- **재검토 결과:** 현재 랩에서 로컬 정적 응답을 확인했습니다. 허가된 출처별 실제 수집 주기·재시도 및 서버 실패 때 검수 스냅샷으로 전환하는 시험은 #65와 #66에 남아 있습니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §7.2:** 허가된 출처의 갱신, 독립 승인과 유효한 정적 자료 대체를 채택했습니다. 출처별 실제 주기·재시도 한계·실패 처리 및 대체 시험이 남았습니다.
- **연결 작업:** [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66) · [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65)
- **대상 단계:** 3차
- **문제/결정:** 원문 해시/수정 시각으로 재수집을 감지하고, 잘못된 자료는 미검수로 격리한다. API 부재 시 수동 확인과 정적 대체를 사용한다.
- **완료 조건:**
  - [ ] 허용된 수집 주기·재시도·실패 큐·정정/취소 절차
  - [ ] 독립 승인 후에만 공개 읽기 자료 반영
  - [ ] DB/API 장애나 소스 차단 시 검수된 정적 스냅샷 전환
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-026"></a>
### HMD-026 · [P1][3차] Supabase API·RLS·비밀키·브라우저 읽기 권한 보안을 정한다

- **GitHub Issue:** [#32](https://github.com/ot4562-glitch/Hanmo_develop/issues/32) · 상태: 열림
- **재검토 결과:** 정적 앱의 로컬 계산 경계를 확인했습니다. 승인된 환경에서 RLS·철회·쓰기 권한·요청 제한과 비밀키 노출 여부를 점검할 #64와 #67이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §7.2–7.3:** 승인된 공통 자료만 공개 읽기하며 수집·검수·승인 쓰기와 비밀키를 분리합니다. 배포 환경의 역할별 권한·철회·요청 제한 실제 시험이 남았습니다.
- **연결 작업:** [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64) · [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65) · [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67)
- **대상 단계:** 3차
- **문제/결정:** GitHub Pages에 비밀 관리 키를 노출하지 않고 공개 학사자료 읽기 범위, 개인 데이터 보관 범위, 검수/승인 쓰기 권한을 분리한다.
- **완료 조건:**
  - [ ] 공개 읽기/비공개 쓰기 역할과 RLS 정책 검증
  - [ ] 브라우저에 service_role/운영 비밀키가 들어가지 않음
  - [ ] 권한 오용·URL 변조·판본 철회·쿼터 대응 테스트
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-027"></a>
### HMD-027 · [P1][3차] 개인 학업자료의 로컬 우선·선택적 동기화/인증 범위를 결정한다

- **GitHub Issue:** [#33](https://github.com/ot4562-glitch/Hanmo_develop/issues/33) · 상태: 설계·증빙 확인 완료
- **재검토 결과:** 로컬 전용·동기화 제외 계약과 서버 금지 필드를 확정했습니다. Edge에서 합성 학점·계획 계산에 네트워크 요청 0건, 같은 탭에는 요건 후보·판본·시각만 저장됨을 확인했습니다. 실연동에서 동일 경계를 검증하는 항목은 #65·#67에 남깁니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §4.8, 7.2:** 개인 이수·성적·계획을 기기에 보관하고 이번 범위에서 동기화는 제외합니다. 원격 전송이 없는지 화면·API 통합 시험이 남았습니다.
- **연결 작업:** [#45](https://github.com/ot4562-glitch/Hanmo_develop/issues/45) · [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65)
- **대상 단계:** 3차
- **문제/결정:** 학교 계정 인증 대행 없이 공개 DB와 개인 학업 원장을 분리하며, 다중 기기 동기화는 별도 허가·안전 조치를 거친 선택 기능으로 둔다.
- **완료 조건:**
  - [ ] 로컬만 저장할 필드와 서버 금지 정보 목록
  - [ ] 선택적 동기화 채택 여부·인증/보존·삭제·내보내기 정책
  - [ ] 개인 성적/계획의 외부 전송 기본 비활성화 검증
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-028"></a>
### HMD-028 · [P0][3차] Supabase 실연동·운영 모니터링·복구를 포함한 3차 인수 시험을 정의한다

- **GitHub Issue:** [#34](https://github.com/ot4562-glitch/Hanmo_develop/issues/34) · 상태: 열림
- **재검토 결과:** 3차 인수 조건은 문서에 있습니다. 승인 환경의 DB→API→화면, 장애 복구 및 담당자 인수 기록은 #67이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §7.3, 9:** 승인 환경의 DB→API→화면, 장애 복구·롤백·기존 기능 회귀와 운영자 인수를 3차 완료 조건으로 채택했습니다. 실제 환경 기록과 서면 인수가 남았습니다.
- **연결 작업:** [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67)
- **대상 단계:** 3차
- **문제/결정:** 3차 설계 완료가 아닌 실제 DB→API→1차 학업 페이지 작동과 운영 안정성 검증을 4차 착수 선행조건으로 둔다.
- **완료 조건:**
  - [ ] 승인된 운영 스테이징에서 데이터·학칙·공지·권리 판본 E2E
  - [ ] API 장애·복구·롤백·정적 대체·갱신 지연 테스트
  - [ ] 1·2단계 기능 회귀 및 운영자 서면 인수 후 3차 완료 판정
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-029"></a>
### HMD-029 · [P2][4차] 1차 TypeScript→JavaScript 소스 전환 대상·순서·의존성 목록을 정의한다

- **GitHub Issue:** [#35](https://github.com/ot4562-glitch/Hanmo_develop/issues/35) · 상태: 설계 결정 완료
- **현행 설계 §8:** PR #5의 소스·테스트 경계를 확인해 스키마 → 계산 코어 → 화면 진입점 → 빌드의 전환 순서를 확정했습니다. 원본 기준 구현과 동일 스냅샷·저장 형식·API를 보존합니다.
- **연결 작업:** [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68) · [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)
- **대상 단계:** 4차
- **문제/결정:** 3차 안정화 이후 계산 코어, 브라우저 진입점, 관련 테스트를 JavaScript/JSDoc으로 이관하되 2차 순수 JS와 Supabase 계약은 그대로 둔다.
- **완료 조건:**
  - [ ] TS 원본/모듈/테스트 목록과 작은 PR 전환 순서 확정
  - [ ] 빌드 파일 직접 편집 금지·원본 기준 구현 유지
  - [ ] 동일 데이터 스냅샷과 사용자 저장 형식 보존
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-030"></a>
### HMD-030 · [P2][4차] JavaScript/JSDoc 정적 검사·TS 동등성·회귀 검증 및 완료 기준을 정한다

- **GitHub Issue:** [#36](https://github.com/ot4562-glitch/Hanmo_develop/issues/36) · 상태: 열림
- **재검토 결과:** TypeScript 기준 테스트 650건을 통과했습니다. JavaScript 대상 구현과 같은 입력의 차등 시험, 실제 성능·보안 및 정적 배포 회귀가 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §8, 9:** 동일 입력에서 결과·예외·보류/재계산 상태까지 비교하기로 했습니다. 실제 이관 뒤 동등성·성능·보안·브라우저 회귀 결과가 남았습니다.
- **연결 작업:** [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68) · [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)
- **대상 단계:** 4차
- **문제/결정:** 타입 정보 제거가 학점·졸업 판정 오류를 만들지 않도록 checkJs·스키마 검사·차등 테스트를 검증 게이트로 둔다.
- **완료 조건:**
  - [ ] JSDoc/checkJs(또는 동등 도구)·lint·테스트 최소 기준
  - [ ] 동일 입력에서 TS와 JS 결과·예외·STALE/NEEDS_REVIEW 상태 비교
  - [ ] 모든 브라우저·기존 모드·Supabase API·성능·보안 회귀 통과 후 전환 종료
- **공통 전제:** 원개발자 승인·학사자료 권리/검수·Supabase 운영권한을 이 명세가 대신하지 않음

<a id="hmd-031"></a>
### HMD-031 · [P0][2차] 위기 대응 시나리오 다양성·난이도·조합형 훈련 체계 설계

- **GitHub Issue:** [#37](https://github.com/ot4562-glitch/Hanmo_develop/issues/37) · 상태: 열림
- **재검토 결과:** 합성 전망 회귀와 원본 보호는 통과했습니다. 포크 내 개발 승인 근거는 #18입니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §5:** 기존 모드 기본 OFF에서 두 기본 위기를 먼저 출시하고 복합 위기는 후속으로 둡니다. 상태도·시드·난이도 세부화와 실행·회귀 시험, 운영 반영 확인이 남았습니다.
- **연결 작업:** [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49) · [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50) · [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62)
- **대상 단계:** 2차
- **문제/결정:** 단순한 클릭 연습을 넘어 실패·대안 탐색·가상 연결 복구 훈련을 핵심 차별화 기능으로 확장. 기존 두 시나리오 외 난이도·합성 복합 위기의 체계적 추가 기준이 필요함.
- **추천 기본값(미확정):** 초기 LAST COURSE FAIL/RECONNECT RECOVERY를 완성한 뒤 초급(단일 실패)·중급(대체과목/시간압박)·고급(복합 위기)의 3단계와 고정 난수 시드로 단계적으로 확대.
- **완료 조건:**
  - [ ] 최소 2개 기본 시나리오와 확장 후보의 상태도·시드·난이도·종료 조건 정의
  - [ ] 유효한 대안 탐색·정답 없는 경우·중복 신청/결과 불명 처리 평가 및 재현성 검증
  - [ ] BASIC/TIME/SELECT 시나리오 OFF 기존 동작 불변 및 원개발자 승인
- **공통 전제:** 제품 방향은 채택됐지만 세부 난이도·후속 시나리오 전체는 미승인 설계 후보이며 실제 신청 시스템을 조작하지 않음

<a id="hmd-032"></a>
### HMD-032 · [P1][공통] 한모 차별화 메시지·유사 서비스 비교·예측 안내 품질 기준

- **GitHub Issue:** [#38](https://github.com/ot4562-glitch/Hanmo_develop/issues/38) · 상태: 열림
- **재검토 결과:** 원본 한모, 한국외대 수강신청 안내, 서울대 수강신청/수강편람의 공개 자료를 비교했습니다. 세 기능의 실제 시연과 학생이 전망을 공식 마감으로 오해하지 않는지에 대한 과제 시험이 필요합니다. [시험과 자료 확인](pr-stack-review.md)
- **현행 설계 §1.1–1.2, 4.5:** 첫 소개 문구는 전공 공지와 다음 학기 준비로 정했습니다. 세 기능의 시연·학생 이해 확인과 유사 서비스 출처·기능·확인일 비교가 남았습니다.
- **연결 작업:** [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39) · [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) · [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62)
- **대상 단계:** 1·2차 대외 안내
- **문제/결정:** ① 시나리오 다양성 ② 미래 강의 개설 전망 ③ 졸업시험·이중전공 신청/변경 등 반복 학사행사 시기 전망을 제품 가치로 전달하되 '최초·유일'의 객관적 비교가 미완료임.
- **추천 기본값(미확정):** 구체적인 학습/계획 가치를 설명하고, 각 예측에 역사적 표본·원문·검수시각·공식 확정 vs 참고용 예상을 구분. 최초·유일 등 절대적 독점 표현은 실제 비교 검증 이후에만 사용.
- **완료 조건:**
  - [ ] 세 차별화 경험의 사용자 성과 지표와 시연 정의
  - [ ] 비교 가능한 국내 대학 공식·비공식 서비스의 구체 기능·출처·확인시각 비교
  - [ ] 예상 구간을 확정 신청·시험 마감과 혼동시키지 않는 제품/홍보 문구 검증
- **공통 전제:** 역사적 예측 코어 선행 개발 가능성과 한모에서의 공식 검증/배포/권리 확보는 별개

