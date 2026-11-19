# 한모 설계 이슈 색인

[현행 아키텍처](architecture.md)는 제품·기술 **설계 결정의 유일한 정본**입니다. 이 파일은 설계 이슈의 **ID·연결·상태만 관리**하며 과거 완료 조건·검증 로그·폐기된 결정을 중복 저장하지 않습니다. 구현과 시험 내용은 해당 GitHub 이슈에 기록합니다.

**2026-11-19 정리:** HMD-001~HMD-032 중 **31건의 설계 결정 완료**, **학교 회신에 관한 HMD-021/#27 한 건만 미결**입니다. 설계가 완료된 상태와 실제 기능 구현/실데이터 검수/운영 인수 완료는 전혀 다릅니다.

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
| `HMD-014` | [#20](https://github.com/ot4562-glitch/Hanmo_develop/issues/20) | 마지막 과목 실패·학생 대체 선택 상태 머신 확정 | 완료 |
| `HMD-015` | [#21](https://github.com/ot4562-glitch/Hanmo_develop/issues/21) | 가상 재접속·결과 불명 상태 머신 확정 | 완료 |
| `HMD-016` | [#22](https://github.com/ot4562-glitch/Hanmo_develop/issues/22) | 1·2차 과목 ID·합성 결과 어댑터 계약 확정 | 완료 |
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
| `HMD-028` | [#34](https://github.com/ot4562-glitch/Hanmo_develop/issues/34) | Supabase 3차 인수 시험 항목과 4차 착수 게이트 확정 | 완료 |
| `HMD-029` | [#35](https://github.com/ot4562-glitch/Hanmo_develop/issues/35) | 1차 TypeScript→JavaScript 소스 전환 대상·순서·의존성 목록을 정의한다 | 완료 |
| `HMD-030` | [#36](https://github.com/ot4562-glitch/Hanmo_develop/issues/36) | TypeScript→JavaScript/JSDoc 정적·동등성 검사 계약 확정 | 완료 |
| `HMD-031` | [#37](https://github.com/ot4562-glitch/Hanmo_develop/issues/37) | 위기 대응 기본·복합 시나리오/난이도 평가 설계 확정 | 완료 |
| `HMD-032` | [#38](https://github.com/ot4562-glitch/Hanmo_develop/issues/38) | 차별화 메시지·비교·예측 안내 표현 정책 확정 | 완료 |

## 실제 구현·데이터 검수·테스트는 별도 이슈

| 실행 작업 | 주요 대상 |
|---|---|
| 1차 구현·데이터·FAQ·UI 검증 | [#39~#58](https://github.com/ot4562-glitch/Hanmo_develop/issues?q=is%3Aissue+is%3Aopen+%E2%80%981%EC%B0%A8%E2%80%99) 및 개별 [#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40), [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41), [#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42), [#47](https://github.com/ot4562-glitch/Hanmo_develop/issues/47), [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) |
| 기존 한모 모드 기준선·시나리오 | [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71), [#49](https://github.com/ot4562-glitch/Hanmo_develop/issues/49), [#50](https://github.com/ot4562-glitch/Hanmo_develop/issues/50), [#62](https://github.com/ot4562-glitch/Hanmo_develop/issues/62) |
| 제품 전체 PC 접근성·비지원 기기 안내 | [#72](https://github.com/ot4562-glitch/Hanmo_develop/issues/72) |
| 실배포 라이선스·학교 자료 허용 범위 점검 | [#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73) |
| Supabase Free($0) DB·API·갱신·실환경 인수 | [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64), [#65](https://github.com/ot4562-glitch/Hanmo_develop/issues/65), [#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66), [#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) |
| 4차 JavaScript/JSDoc 이관 | [#68](https://github.com/ot4562-glitch/Hanmo_develop/issues/68), [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69) |
| 경쟁 서비스 출처/홍보 오해·학생 사용성 검증 | [#74](https://github.com/ot4562-glitch/Hanmo_develop/issues/74) |

새 이슈는 [agent.md](../agent.md#github-이슈-작성과-분류)의 **`[설계|구현|검증][차수][P0|P1|P2][담당 영역]`** 제목, 선행조건, 담당자, 검증 가능한 완료 기준을 따릅니다. `Issue labels` 워크플로가 제목에 맞춰 차수/우선순위/유형을 부여합니다.

**이슈 정리 원칙:** 새 설계 선택이 필요하지 않다면 닫힌 HMD 설계 이슈를 실데이터·테스트 미완료 때문에 재개하지 않습니다. 실행은 기존 연계 이슈를 우선 보완하고 중복 이슈를 추가 생성하지 않습니다.
