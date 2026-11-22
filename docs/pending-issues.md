# 한모 설계 이슈 색인

[현행 아키텍처](architecture.md)는 제품·기술 **설계 결정의 유일한 정본**입니다. 이 파일은 설계 이슈의 **ID·연결·상태만 관리**하며 과거 완료 조건·검증 로그·폐기된 결정을 중복 저장하지 않습니다. 구현과 시험 내용은 해당 GitHub 이슈에 기록합니다.

**2026-11-23 현행 판정:** HMD-001~HMD-032의 설계 이슈 중 **31건은 종결**, **학교 회신 HMD-021/#27만 미결**입니다. 과거 종결 결정 중 LAST_VALID·복합 돌발상황·TS 이관 계획 등은 **현행 아키텍처에서 이미 대체**됐습니다. 옛 이슈의 '설계 완료'는 해당 과거 결정을 종결했다는 뜻이지 지금도 그 기능을 제공한다는 뜻이 아닙니다. **현재 코드·실자료·운영 인수 판정은 [아키텍처 현황표](architecture.md#현행-구현-상태--2026-11-23-main-기준)가 우선**합니다.

## 학교 회신 후 남은 설계 종료 방법

[**#27 — 학교 자료 이용 허용 범위·대체 정책**](https://github.com/ot4562-glitch/Hanmo_develop/issues/27)에 사용자에게서 받은 학교 회신을 근거로 아래 네 자료 부류의 허용/제한/불허/미확정을 기록하고, 미허용·불명확한 항목은 수집·재배포하지 않는 대체 정책을 아키텍처에 반영하면 **설계 이슈 전부 종료**입니다.

- 학사공지 및 FAQ의 원문 문단
- 과목·분반·강의 개설 이력과 시간표
- 학칙·졸업요건·전공별 규정
- 자동 수집·주기적 갱신 가능 여부 및 담당 부서

학교의 회신 내용이 제한적이거나 거절이어도 `UNKNOWN/LIMITED/DENIED`와 링크 중심 대체 방침을 확정해 설계만 닫을 수 있습니다. **학교 데이터 실제 수집·인용 정확도 검수·실험·제품 테스트는 #27의 종료 조건이 아닙니다.**

## HMD 설계 이슈 전체 색인

| 추적 ID | GitHub 이슈 | 설계 결정명 | 상태 |
|---|---|---|---|
| `HMD-001` | [#7](https://github.com/ot4562-glitch/Hanmo_develop/issues/7) | 1차 필수 학생 흐름과 후속 확장 범위 확정 | 완료 |
| `HMD-002` | [#8](https://github.com/ot4562-glitch/Hanmo_develop/issues/8) | PR #1~#5에서 파일별 선별 병합·보존/제외 기준을 만든다 | 완료 |
| `HMD-003` | [#9](https://github.com/ot4562-glitch/Hanmo_develop/issues/9) | GPL·이식 소스·학사자료 공개 권리 정책 확정 | 완료 |
| `HMD-004` | [#10](https://github.com/ot4562-glitch/Hanmo_develop/issues/10) | 학생용 학업 UI와 JSON 진단 UI를 분리한다 | 완료 |
| `HMD-005` | [#11](https://github.com/ot4562-glitch/Hanmo_develop/issues/11) | RulePack 적용 범위와 판본·미검수 보류 정책 확정 | 완료 |
| `HMD-006` | [#12](https://github.com/ot4562-glitch/Hanmo_develop/issues/12) | WIS 수동 HTML/CSV의 강의·분반 가져오기와 CSV 내보내기 계약을 정한다 | 완료 |
| `HMD-007` | [#13](https://github.com/ot4562-glitch/Hanmo_develop/issues/13) | 강의 개설·반복 행사 전망의 관측·보류 규칙 확정 | 완료 |
| `HMD-008` | [#14](https://github.com/ot4562-glitch/Hanmo_develop/issues/14) | 학사공지 대상·학생 마감·정정/취소·최대 2건 우선 노출 계약을 확정한다 | 완료 |
| `HMD-009` | [#15](https://github.com/ot4562-glitch/Hanmo_develop/issues/15) | 한국어 학사 FAQ·근거 보류·상담 연결 범위 확정 | 완료 |
| `HMD-010` | [#16](https://github.com/ot4562-glitch/Hanmo_develop/issues/16) | 교환학생·국제학생 학업 준비는 선택형 확장 범위로 판단한다 | 완료 |
| `HMD-011` | [#17](https://github.com/ot4562-glitch/Hanmo_develop/issues/17) | 로컬 데이터 네임스페이스·백업/복원·삭제 계약 확정 | 완료 |
| `HMD-012` | [#18](https://github.com/ot4562-glitch/Hanmo_develop/issues/18) | 원개발자 승인 범위와 기존 JavaScript 확장 지점을 합의한다 | 완료 |
| `HMD-013` | [#19](https://github.com/ot4562-glitch/Hanmo_develop/issues/19) | BASIC/TIME/SELECT 원본 동작·회귀 기준 계약 확정 | 완료 |
| `HMD-014` | [#20](https://github.com/ot4562-glitch/Hanmo_develop/issues/20) | 과거 마지막 과목 실패·대체 선택 결정 → **현행 §5에서 폐기(LAST_VALID 제거)** | 종결·대체됨 |
| `HMD-015` | [#21](https://github.com/ot4562-glitch/Hanmo_develop/issues/21) | 가상 재접속·결과 불명 상태 머신 확정 | 완료 |
| `HMD-016` | [#22](https://github.com/ot4562-glitch/Hanmo_develop/issues/22) | 원본/합성 ID 격리 설계; 실제 강좌 매핑·대체 검색은 현재 보류 | 종결·범위 축소 |
| `HMD-017` | [#23](https://github.com/ot4562-glitch/Hanmo_develop/issues/23) | 개발 미리보기와 GitHub Pages 운영 경로·CNAME 계약을 정한다 | 완료 |
| `HMD-018` | [#24](https://github.com/ot4562-glitch/Hanmo_develop/issues/24) | 기능 코드 PR 승인·릴리스 체크리스트·롤백 방법을 확정한다 | 완료 |
| `HMD-019` | [#25](https://github.com/ot4562-glitch/Hanmo_develop/issues/25) | 단계별 CI와 브라우저 E2E 품질 게이트를 정의한다 | 완료 |
| `HMD-020` | [#26](https://github.com/ot4562-glitch/Hanmo_develop/issues/26) | 전 기능 PC 전용 지원·접근성 정책 확정 | 완료 |
| `HMD-021` | [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27) | 학교 회신에 따른 학사자료 이용 허용 범위·대체 정책 확정 | **회신 대기** |
| `HMD-022` | [#28](https://github.com/ot4562-glitch/Hanmo_develop/issues/28) | 독립 학사자료 검수·승인·철회 권한 모델을 확정한다 | 완료 |
| `HMD-023` | [#29](https://github.com/ot4562-glitch/Hanmo_develop/issues/29) | Supabase Free 운영 관리자·팀 공동 장애 대응 책임 확정 | 완료 |
| `HMD-024` | [#30](https://github.com/ot4562-glitch/Hanmo_develop/issues/30) | Supabase 논리 스키마·스냅샷·판본/마이그레이션 정책 확정 | 완료 |
| `HMD-025` | [#31](https://github.com/ot4562-glitch/Hanmo_develop/issues/31) | 허용 자료 수집·정정·철회·정적 대체 흐름 확정 | 완료 |
| `HMD-026` | [#32](https://github.com/ot4562-glitch/Hanmo_develop/issues/32) | Supabase 공개 읽기·RLS·비밀키 권한 모델 확정 | 완료 |
| `HMD-027` | [#33](https://github.com/ot4562-glitch/Hanmo_develop/issues/33) | 개인 학업자료의 로컬 우선·선택적 동기화/인증 범위를 결정한다 | 완료 |
| `HMD-028` | [#34](https://github.com/ot4562-glitch/Hanmo_develop/issues/34) | Supabase 3차와 4차 최종 제품 인수 조건(소스 이관은 조기 착수 가능) | 완료 |
| `HMD-029` | [#35](https://github.com/ot4562-glitch/Hanmo_develop/issues/35) | TypeScript→JavaScript 이관 계획(현행 이관은 PR #100·#102로 **완료**) | 종결·구현 반영 |
| `HMD-030` | [#36](https://github.com/ot4562-glitch/Hanmo_develop/issues/36) | JS/JSDoc·checkJs 검사 계약(이관 완료, 실제 브라우저·운영 동등성 QA 잔여) | 종결·검증 계속 |
| `HMD-031` | [#37](https://github.com/ot4562-glitch/Hanmo_develop/issues/37) | 과거 복합 돌발상황 설계는 종결·대체됨. **현재는 BASIC RECONNECT(404)+CAPACITY(합성 정원 마감) 두 개**, 실제 대체과목·시간 충돌은 제외 | 종결·대체됨 |
| `HMD-032` | [#38](https://github.com/ot4562-glitch/Hanmo_develop/issues/38) | 차별화 메시지·비교·예측 안내 표현 정책 확정 | 완료 |

## 실행 이슈 상태 분류 · 2026-11-23

| 판정 | 대표 이슈 | 현재 증거와 남은 일 |
|---|---|---|
| **`main` 모의연습 구현, 실기기 QA 미완료** | [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49)·[#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50)·[#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71) | LAST_VALID는 #106에서 제거. BASIC RECONNECT(404 복구)·독립 대기 2종·선택 복원은 #108–#110에, **BASIC CAPACITY(가상 정원 마감·합성 후보 검색)**는 [#122](https://github.com/ot4562-glitch/Hanmo_develop/pull/122)에 반영. **실제 학교 정원·실강좌 대체 검색 아님.** Windows Chrome/Edge 원본 대기·Enter·옵션 OFF 실기기 인수는 별도 |
| **JS/JSDoc 이관 코드 완료, 동등성/품질 검증 잔여** | [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68)·[#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)·[#101](https://github.com/ot4562-glitch/Hanmo_develop/issues/101) | [#100](https://github.com/ot4562-glitch/Hanmo_develop/pull/100)·[#102](https://github.com/ot4562-glitch/Hanmo_develop/pull/102) 병합으로 TS/TSX/MTS/CTS 소스 0개. 실제 사용자/운영·코드 전후 전 범위 검증은 이관 완료와 다름 |
| **학생 화면 탐색 경로 구현, 공식 자료/인수 미완료** | [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39)·[#43](https://github.com/ot4562-glitch/Hanmo_develop/issues/43)·[#48](https://github.com/ot4562-glitch/Hanmo_develop/issues/48)·[#56](https://github.com/ot4562-glitch/Hanmo_develop/issues/56)·[#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57)·[#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58)·[#59](https://github.com/ot4562-glitch/Hanmo_develop/issues/59)·[#63](https://github.com/ot4562-glitch/Hanmo_develop/issues/63) | 강의 검색에 개설 전망 통합, 졸업 준비 [학점]/[졸업요건], 학사 달력·FAQ·공식 상담 UI가 `main`에 존재. 과목별 A/B/C 계획은 기본 학생 UI에서 제거. 승인 학사 원문·개설 원장·RulePack·PC 실기기 검증은 미완료 |
| **NLP 순수 코어 병합, 남은 PR 정확성 수정 대기** | [#47](https://github.com/ot4562-glitch/Hanmo_develop/issues/47)·[#51](https://github.com/ot4562-glitch/Hanmo_develop/issues/51)·[#52](https://github.com/ot4562-glitch/Hanmo_develop/issues/52)·[#53](https://github.com/ot4562-glitch/Hanmo_develop/issues/53)·[#54](https://github.com/ot4562-glitch/Hanmo_develop/issues/54) | 소유자 직접 코드·CI 검토로 [#117](https://github.com/ot4562-glitch/Hanmo_develop/pull/117)(통합 검색), [#119](https://github.com/ot4562-glitch/Hanmo_develop/pull/119)(중요공지)를 **squash 병합**. [#118](https://github.com/ot4562-glitch/Hanmo_develop/pull/118)(YES+UNKNOWN FAQ), [#120](https://github.com/ot4562-glitch/Hanmo_develop/pull/120)(존재하지 않는 월일), [#121](https://github.com/ot4562-glitch/Hanmo_develop/pull/121)(숫자 비교 방향)은 변경 요청으로 보류. **협업자 작성 PR은 별도 협업자 승인 필수 아님**, 소유자 작성 [Draft #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)만 별도 협업자 승인 필수. 실제 공식 자료 인수는 별도 |
| **순수 코어 및 합성 회귀 존재, 실데이터/학생 UI 미연결** | [#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40)·[#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)·[#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42)·[#44](https://github.com/ot4562-glitch/Hanmo_develop/issues/44)·[#46](https://github.com/ot4562-glitch/Hanmo_develop/issues/46)·[#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) | 근거 인덱스 #97, 검색 평가 #98, 공지 후보 추출 #99는 병합. 학교 승인 자료·독립 검수/홀드아웃·동일 스냅샷 연결/PC 확인은 아직 없음 |
| **Supabase Draft/격리 DB 테스트만 완료** | [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64)·[#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65)·[#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66)·[#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) | [PR #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)은 `main` 미병합 Draft. [최신 PostgreSQL 16 CI](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45041483859) 성공. PR 브랜치에서 검수 기록 존재 시 DRAFT 출처 변경을 차단하고 런타임 회귀를 보강함. 실제 Supabase Free 프로젝트 설치/권한/REST·수집·운영 인수 없음 |
| **권리·접근성·운영 승인/선택 확장 대기** | [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27)·[#72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72)·[#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73)·[#74](https://github.com/ot4562-glitch/Hanmo_develop/issues/74)·[#80](https://github.com/ot4562-glitch/Hanmo_develop/issues/80) | 학교 사용권·실제 QA·대외 표현 검증이 선행. 미승인 전면 UI 개편과 **실제 강좌 기반** 대체과목·시간 충돌 기능은 별도 승인 전까지 착수하지 않음(승인된 BASIC 합성 CAPACITY는 예외) |

**이 표는 이슈를 자동으로 완료/종결 처리하지 않습니다.** 개별 Issue의 체크리스트·실측 증거가 완료되었을 때만 상태를 변경하고, 설계 이슈의 과거 결정을 현재 기능으로 오해하지 않습니다.

## 실제 구현·데이터 검수·테스트는 별도 이슈

| 실행 작업 | 주요 대상 |
|---|---|
| 1차 구현·데이터·FAQ·UI 검증 | [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39), [#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40), [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41), [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42), [#47](https://github.com/ot4562-glitch/Hanmo_develop/issues/47), [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57), [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58), [#59](https://github.com/ot4562-glitch/Hanmo_develop/issues/59), [#63](https://github.com/ot4562-glitch/Hanmo_develop/issues/63) 등 기존 1차 이슈 |
| 기존 한모 모드 기준선·시나리오 | [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71), [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49), [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50), [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62) |
| 제품 전체 PC 접근성·비지원 기기 안내 | [#72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72) |
| 실배포 라이선스·학교 자료 허용 범위 점검 | [#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73) |
| Supabase Free($0) DB·API·갱신·실환경 인수 | [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64), [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65), [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66), [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) |
| **완료된 JS/JSDoc 이관의 동등성 확인·4차 최종 검증** | [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68), [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69), [#101](https://github.com/ot4562-glitch/Hanmo_develop/issues/101) |
| 경쟁 서비스 출처/홍보 오해·학생 사용성 검증 | [#74](https://github.com/ot4562-glitch/Hanmo_develop/issues/74) |

새 이슈는 [agent.md](../agent.md#github-이슈-작성과-분류)의 **`[설계|구현|검증][차수][P0|P1|P2][담당 영역]`** 제목, 선행조건, 담당자, 검증 가능한 완료 기준을 따릅니다. `Issue labels` 워크플로가 제목에 맞춰 차수/우선순위/유형을 부여합니다.

**이슈 정리 원칙:** 새 설계 선택이 필요하지 않다면 닫힌 HMD 설계 이슈를 실데이터·테스트 미완료 때문에 재개하지 않습니다. 실행은 기존 연계 이슈를 우선 보완하고 중복 이슈를 추가 생성하지 않습니다.
