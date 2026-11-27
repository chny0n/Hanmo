# 한모 학생 화면 · 승인 데이터 연결 및 장애 처리 인계

> **현재 인계본은 학사자료 연결을 `mode: disabled`로 유지합니다.** 연결을 검토하기 전 허용 필드·자료 이용권·독립 검수·철회 절차를 확인합니다. 교수명·수강 관련 정보, FAQ·학칙·졸업요건, 공지 원문·첨부 복제는 운영 범위에서 제외합니다. [정보처 서면 회신](sources/2026-11-23-hufs-information-office-reply.txt) · [아키텍처 §0·§7](architecture.md)

3차 인수에는 `scopePolicyVersion`, 근거의 공식성 확인 상태, 판본별 필드 차이, 축소 시 철회 및 확대 시 재검수를 포함합니다. 직원 안내 해석과 철회 절차는 [운영 방침](public-data-operating-decision.md)을 따릅니다.

## Supabase Free 실제 연결 전제

2차 원본 회귀와 #67의 선행 요건을 충족한 뒤, Supabase를 선택하면 김채윤(`qamarrchae`)이 별도 실습 프로젝트에서 학교 자료 이용권·판본 독립 검수와 함께 Data API의 실제 익명 조회 권한·RLS를 확인합니다. 설치 초안과 격리 CI 증거는 미병합 Draft #93의 최신 검토 기록을 따릅니다. [#71 원본 회귀](https://github.com/ot4562-glitch/Hanmo_develop/issues/71) · [#67 실습 인수](https://github.com/ot4562-glitch/Hanmo_develop/issues/67) · [Draft PR #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93) · [현행 검토 상태](pending-issues.md)

## 자료 보존과 정리

공개판은 검수·승인된 최소 자료로 구성하고, 참조 중인 출처 판본과 승인 기록을 보존합니다. 삭제나 아카이브 전에 운영자가 대상 행, 참조 관계, 검수된 최신판을 확인하고 암호화 백업을 복구 시험합니다. 정리 후 테이블·인덱스·DB 크기와 대표 응답의 전송량을 측정합니다. 예산과 보존 기간은 [최소 데이터 계획](focused-public-data-plan.md)을 따릅니다.

권리 철회가 발생하면 공개를 즉시 중단합니다. API, 정적 파일, 이전 배포판, 캐시와 검색 색인을 확인하고 철회판 재발행을 차단합니다. 절차는 [긴급 철회 런북](public-data-operating-decision.md)에 있습니다. 2026 동계 계절학기 수집 차단일과 CLI는 [아키텍처 §0.1](architecture.md)에 기록합니다.

## 학사자료 계약 검토

배포 빌드는 비활성 설정만 허용합니다. 이전 v1 파서는 UI 동결 대상이며 합성 응답으로 화면 상태를 검증하는 데 쓰입니다. 자료 연결 검토는 금지 필드를 제외한 새 공개 데이터 계약과 원문·판본 검수, 철회 검증부터 시작합니다. [최소 데이터 계획](focused-public-data-plan.md) · [이전 v1 설명](https://github.com/ot4562-glitch/Hanmo_develop/blob/4f2b52a1c0f66be788d23f4fc7c9e0f558c2df14/docs/student-data-source-handoff.md)

## 합성 QA의 학생 화면 상태

| API 상태 | 화면 |
|---|---|
| NOT_CONNECTED | 공개 설정 전. 학교 자료가 아직 연결되지 않았다고 알림 |
| EMPTY | 연결되었으나 승인된 공개 행·자료 없음. 미개설/마감 없음으로 추정 금지 |
| OFFLINE | 네트워크/권한/요청 장애. 연결 재시도·공식 학교 페이지로 안내 |
| INVALID | 철회/만료/구조·출처 검증 실패. 위험 자료는 표시하지 않음 |
| READY | 유효한 공개판본의 공지·강좌만 표시. 실제 개인 적용과 미래 개설 확정은 원문 확인 |

오류 시 과거 미검수 정적 자료를 자동으로 사용하지 않습니다. 학생의 브라우저 로컬 내정보·반응속도 프로필 및 BASIC/TIME/SELECT 합성 연습은 학교 데이터 연결 장애와 독립적으로 작동해야 합니다.

## 검증

```bash
node --test tests/academic-data-source.test.cjs
npm run check
```
실운영 전에 API 실응답, 권한/RLS, 만료·철회, 빈 응답, 403/5xx/오프라인, PC 브라우저 접근성, 페이지 하위 경로·재시도, 원본 SELECT 대기열·Enter 연타 회귀를 추가 확인합니다.

관련 실행 이슈: [#27 사용권](https://github.com/ot4562-glitch/Hanmo_develop/issues/27), [#64 스키마/RLS](https://github.com/ot4562-glitch/Hanmo_develop/issues/64), [#65 공개 읽기](https://github.com/ot4562-glitch/Hanmo_develop/issues/65), [#66 승인 파이프라인](https://github.com/ot4562-glitch/Hanmo_develop/issues/66), [#67 실환경 인수](https://github.com/ot4562-glitch/Hanmo_develop/issues/67), [#71 원본 회귀](https://github.com/ot4562-glitch/Hanmo_develop/issues/71).

현재 설정은 계속 `mode: disabled`입니다. 학교 자료 사용권·실자료 검수와 운영자 인수가 끝날 때까지 활성화하지 않습니다.

## 최종 인계 기록

[#125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125) 준비 자료입니다. 수신 예정자는 원개발자 `dlacked`이며 전달일과 수락 여부는 아직 기록할 수 없습니다. `ot4562-glitch`가 코드·웹 QA와 증빙을 정리하고, `uisang2004-maker`가 공지 검색·행사와 PC 도구 검증에 참여합니다. `qamarrchae`는 학사자료와 선택적 Supabase 인수를 맡습니다.

### 검증한 기준과 재현

[미결 이슈](pending-issues.md)에서 검증한 SHA와 진행 중인 PR을 확인합니다. 후보 인계에는 #134·#139의 PC 도구 검증, #101의 기능 동등성, #125의 최종 현장 QA와 수락 증거가 필요합니다. #140은 선택 연구입니다.

| 항목 | 인계에 첨부할 증거 |
|---|---|
| 소스 | 2026-11-24에 [이후 병합된 PR #135](https://github.com/ot4562-glitch/Hanmo_develop/pull/135)의 [`d90d5d5`](https://github.com/ot4562-glitch/Hanmo_develop/commit/d90d5d544be452b309fda4fb413513be98022e77)를 검증했습니다. 당시 비교 기준 `main`은 `512f2985a06e0dc2787e837764ae24bfa339fdb9`입니다. 최종 인계 시 승인된 `main` SHA와 실제 배포 SHA를 기록합니다. |
| 빌드와 QA | `d90d5d5`의 [저장소 검사](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45269797707/job/138026253576)와 [브라우저 QA](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45269797742/job/138026252855)가 통과했습니다. `hanmo-root-static-preview` 보관 기간은 3일입니다. 인계할 `dist/`와 생성 SHA, 파일별 SHA-256을 함께 보관합니다. |
| Windows 접근성 | [PR 검증 기록](https://github.com/ot4562-glitch/Hanmo_develop/pull/135)에 Chrome·Edge 자동 E2E, 실제 브라우저 200% 확대, NVDA 2026.3.1의 26개 낭독 결과가 있습니다. 확대 시험은 `6ad1494`와 `49cad16`, NVDA 시험은 `75c5e41`을 기준으로 했습니다. 물리 키보드 인수는 남아 있습니다. |
| 정적 철회 | [철회 런북](public-data-operating-decision.md#5-긴급-철회-런북--언제든-내리기는-검증해야-함)의 로컬 훈련에서 재빌드 후 합성 구판 URL은 404였고, 활성 설정 복원은 거부됐습니다. `d90d5d5`의 Chrome·Edge 시험에서는 새로고침과 재시도 후 철회 판본이 표시되지 않았습니다. [#126](https://github.com/ot4562-glitch/Hanmo_develop/issues/126)에서 운영 CDN·API·DB의 철회와 복구를 확인해야 합니다. |
| 알려진 오류 | 내정보의 ‘학번’ 오안내와 삭제 실패 시 완료 안내를 [#69](https://github.com/ot4562-glitch/Hanmo_develop/issues/69)에 재현 절차와 함께 기록했습니다. 보호 파일 수정 승인 후 다시 검증합니다. |
| 출처와 권리 | 프로젝트 [README](../README.md), [LICENSE](../LICENSE), `dist/THIRD-PARTY-NOTICES.txt`, `dist/img/lucide/LICENSE`를 전달 자료에 연결합니다. 변경 이미지 두 개의 최종 출처·권리 판단과 기존 분석·채팅 외부 요청의 출시 판단은 [#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73)에서 기록합니다. |

Node.js 22에서 아래 명령을 실행합니다. `check`가 정적 빌드와 철회 스모크 테스트를 포함합니다. Windows 설치 브라우저를 지정하는 방법은 [아키텍처 §9](architecture.md#9-품질-검증보호전달)에 있습니다.

```text
git rev-parse HEAD
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run check:protected
npx playwright install chromium
npm run test:e2e
npx playwright test --config tests/playwright-feature.config.mjs
```

### 최소권한 인계 점검

- [ ] 정적 인계본의 학사자료 설정이 `mode: disabled`이며 수집기·스케줄러가 실행되지 않는지 확인합니다. 정적 빌드, Git 기록, 로그, CI 산출물에 비공개 원문·학적·금지 필드가 없는지 기록합니다.
- [ ] 공유 묶음에는 소스와 공개 가능한 정적 빌드, 재현 명령, 판본·권리 검증 증거만 포함합니다. `service_role`·비밀 키·토큰·DB 암호, 실데이터·운영 백업은 복사하거나 전송하지 않습니다. 오류나 롤백 설명은 합성 자료로 재현합니다.
- [ ] 운영 경로를 선택한 후에만 필요한 GitHub 배포·자료 승인 역할과 실제 담당자를 기록합니다. Supabase를 채택하면 김채윤이 승인된 별도 프로젝트에서 익명 읽기 전용 범위와 RLS를 검증합니다. 운영 자격증명이나 데이터 파일은 인계 문서에 첨부하지 않습니다.
- [ ] 서면이 구체적으로 금지한 항목과 수집 제한은 그대로 준수합니다. 직원 대면 안내를 이용한 운영자 해석은 서면의 열거 외 이용 제한과 충돌할 수 있으며 학교 차원의 승인으로 확인되지 않았습니다. 적용한 `scopePolicyVersion`, 근거 출처, 변경 시 재검수·철회 절차의 구현 상태를 기록합니다.

### 선행 작업과 수락 기록

자동 원본 회귀 [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71), 물리 입력과 최종 현장 QA [#125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125), 자료 권리·판본과 독립 검수 [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)·[#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42), 3차 경로 선택과 운영 훈련 [#64](https://github.com/ot4562-glitch/Hanmo_develop/issues/64)~[#67](https://github.com/ot4562-glitch/Hanmo_develop/issues/67)·[#126](https://github.com/ot4562-glitch/Hanmo_develop/issues/126)의 증빙을 확정합니다. 일정 통합 [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58)·[#127](https://github.com/ot4562-glitch/Hanmo_develop/issues/127)과 PC 도구 [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134)의 검증 범위와 남은 제약도 함께 기록합니다.

선행 작업 이후 원개발자와 확인된 채널에서 결과물을 전달합니다. [#125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125)에 **전달 일시(KST)·채널, 수신 및 수락 일시(KST), 확인한 `main`·배포 SHA, 검수자 및 테스트 증거, 수락 범위와 제외 조건, 유지보수·배포 책임자**를 기록합니다. 명시적 수락이 확인된 뒤 이슈를 닫습니다.
