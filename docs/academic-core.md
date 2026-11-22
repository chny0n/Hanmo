# 한모 학업 코어 · 학생용 화면 현황

> **현행 기준: 2026-11-23 `main`** · [제품/기술 아키텍처](architecture.md) · [GitHub 이슈](https://github.com/ot4562-glitch/Hanmo_develop/issues). 이 문서는 구현 경로와 검증 범위의 안내이며, 공식 학교 자료의 사용 허가·사람 검수·서비스 운영을 완료했다고 선언하지 않습니다.

## 현재 학생용 PC 화면

| 경로 | `main`에서 실제 구현된 역할 | 아직 미인수한 조건 |
|---|---|---|
| `index.html`, `html/vsugang.html` | 기존 BASIC/TIME/SELECT 연습, BASIC 가상 404와 CAPACITY(가상 정원 마감·합성 후보 검색, 모두 기본 OFF), 독립 신청/페이지 대기 설정 | Windows Chrome/Edge 원본 대기·키보드·결과 동등성 [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71) |
| `html/planner.html` | 캠퍼스·전공·입학년도 자체 입력과 브라우저 로컬 저장 | 학교 로그인·학적 조회 기능 없음 |
| `html/academic-timeline.html` | 학사 공지 안내·공식 원문 링크 탐색 | 승인 공지·정정/취소·학생 마감 미연결 [#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57) |
| `html/catalog.html` | **강의 검색과 개설 전망 통합** 및 연결·자료 부족 상태 안내 | 승인 개설 이력·실강좌/교수 데이터 미연결 [#48](https://github.com/ot4562-glitch/Hanmo_develop/issues/48) |
| `html/academic-progress.html` | **졸업 준비** [학점]/[졸업요건] 탭, 직접 입력 학점·목표·남은 학점의 브라우저 저장과 공식 확인 경로 | 전공·학번별 승인 RulePack·공식 졸업사정 미인수 [#63](https://github.com/ot4562-glitch/Hanmo_develop/issues/63) |
| `html/academic-calendar.html` | 월간 달력과 학교 공식 학사일정 링크 | 검수 확정일·예상 구간·정정/취소 UI 인수 [#58](https://github.com/ot4562-glitch/Hanmo_develop/issues/58) |
| `html/academic-faq.html` | 학업 질문/주제 탐색·공식 확인 안내 | 승인 원문 근거·답변 보류/검수 QA [#59](https://github.com/ot4562-glitch/Hanmo_develop/issues/59) |
| `html/academic-support.html` | 공개된 공식 상담 경로·주제별 안내 링크 | 출처·연락처 최신성 및 캠퍼스별 정확성 검증 [#59](https://github.com/ot4562-glitch/Hanmo_develop/issues/59) |

`html/forecast.html`은 이전 URL 호환을 위해 `html/catalog.html`로 이동합니다. 학점별 과목 기록·A/B/C 계획 비교는 **현재 기본 학생 화면에서 제거**됐고, 순수 학업 계산 코어가 존재한다는 이유로 공식 계획/졸업 판정을 제공한다고 표시하지 않습니다.

## 유지보수 구조·데이터 경계

- `js/academic/`: **JavaScript/JSDoc 코어·Zod 계약·뷰·테스트**. `js/academic/core/campus-assist/`의 근거 인덱스 [#97](https://github.com/ot4562-glitch/Hanmo_develop/pull/97), 평가 [#98](https://github.com/ot4562-glitch/Hanmo_develop/pull/98), 공지 후보 추출 [#99](https://github.com/ot4562-glitch/Hanmo_develop/pull/99)은 `main`에 있으나 합성 회귀 단계입니다.
- NLP 후속 [#117](https://github.com/ot4562-glitch/Hanmo_develop/pull/117)–[#121](https://github.com/ot4562-glitch/Hanmo_develop/pull/121)은 **열린 PR**입니다. 협업자 승인/통합 이전에는 `main`에 구현됐다고 계산하지 않습니다. #118은 #117의 브랜치 위에 쌓여 있습니다.
- `js/academic-data-source.js`: `NOT_CONNECTED`, `EMPTY`, `OFFLINE`, `INVALID`, `READY` 구분. `data/academic-source-config.json`은 `mode: disabled`이며 승인 학교 자료와 실제 Supabase 공개 API는 **연결되지 않았습니다**.
- `js/scenario-settings.js`, `js/capacity-settings.js`, `js/hanmoSys.js`, `js/selectZone.js`: 모의 신청 설정 및 합성 돌발상황. `html/practice.html` 원본 행동과 BASIC/TIME/SELECT 대기·키보드·결과를 보호하며, `selectZone` 승인 수정과 기존 원본 보호는 서로 구별합니다.
- [#100](https://github.com/ot4562-glitch/Hanmo_develop/pull/100)·[#102](https://github.com/ot4562-glitch/Hanmo_develop/pull/102)로 TS 소스 이관은 완료됐습니다. 새 `.ts/.tsx/.mts/.cts`와 영어 자연어 주석 추가를 금지하고 `jsconfig.json`의 `checkJs` 및 현행 [`ui-freeze.json`](../scripts/baselines/ui-freeze.json)을 따릅니다.
- Supabase 설치/보안 패키지 [Draft #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)은 **`main` 미병합**입니다. SQL 검증은 실제 학교 자료 권리·승인·실운영 DB 인수가 아닙니다.

## 재현 검사

Node.js 22에서 아래 명령을 사용합니다.

```bash
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

GitHub의 정적 검사와 Chromium 자동화 통과를 Windows Chrome/Edge·NVDA·고배율 실기기 인수로 대신하지 않습니다. 공식 학사자료 이용·재배포는 [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27)·[#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73), 학생 UI와 근거형 답변은 [#39](https://github.com/ot4562-glitch/Hanmo_develop/issues/39)·[#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40)·[#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)·[#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42)의 별도 게이트입니다.
