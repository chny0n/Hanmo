# 한모 학업 코어 · 학생용 화면 현황

> **기준: 2026-11-22 `main`** · [현행 아키텍처와 영역별 판정](architecture.md#현행-구현-상태--2026-11-22-main-기준). 이 문서는 학생 페이지/코어의 사용·검증 안내이며, 설계 결정이나 출시 완료를 새로 선언하지 않습니다.

## 제공되는 화면과 구현 경계

한모의 학생용 PC 웹 화면은 `html/`에 있습니다. 홈 `index.html`, **내정보** `html/planner.html`, **학사 공지** `html/academic-timeline.html`, **강의 개설 전망** `html/forecast.html`, **강의 검색** `html/catalog.html`, **학점 정리** `html/academic-progress.html`, **모의수강신청** `html/vsugang.html`입니다. `js/academic/`은 **JavaScript/JSDoc 소스와 단위 테스트**, `data/`는 연결 설정, `scripts/`는 검사·정적 배포 빌드입니다. `degree-rescue/`는 학생 방문 URL이 아닙니다.

| 학생 화면 | 지금 가능한 것 | 제공하지 않는 것 |
|---|---|---|
| 내정보 | 캠퍼스·전공·입학년도 등 사용자가 입력한 값을 브라우저에 보관·상단 바 요약 | 학교 로그인·학번 조회·공식 학적 인증 |
| 강의 전망 | 학수번호·학기 입력과 합성 테스트 기반 계산·자료 부족 판정 | 실제 학교의 개설 확정·전수 과거 자료 |
| 강의 검색·공지 | 공개 승인 데이터의 미연결/빈 결과/오류/무효 상태 구분 및 원문 확인 안내 | 승인되지 않은 강좌·공지의 채워진 목록, 개인별 공식 마감·D-day |
| 학점 정리 | 자가 입력값 합계와 계획 시연 (존치·범위 검토 중) | 이수구분·재수강·졸업 가능 여부의 학교 판정 |
| 모의수강신청 | BASIC/TIME/SELECT, 선택형 합성 404 한 가지, 신청/페이지 진입 대기 설정 | 실제 학교 수강신청·마지막 과목 가상 실패·대체과목 자동 추천 |

**학교 자료 연결:** `data/academic-source-config.json`의 기본 `mode`는 **`disabled`**이며, `js/academic-data-source.js`는 `NOT_CONNECTED`, `EMPTY`, `OFFLINE`, `INVALID`, `READY`를 구별합니다. 과거 가상 공지·강좌·합성 개설 예시는 [#95](https://github.com/ot4562-glitch/Hanmo_develop/pull/95)에서 학생용 경로에서 제거됐습니다. **현재 공식 학사자료와 Supabase는 연결되지 않았습니다.** 부족한 자료를 실제 미개설·신청 마감으로 간주하지 않습니다.

**NLP 및 학업 코어:** [#97](https://github.com/ot4562-glitch/Hanmo_develop/pull/97) 근거 문단/판본 인덱스, [#98](https://github.com/ot4562-glitch/Hanmo_develop/pull/98) 평가 지표, [#99](https://github.com/ot4562-glitch/Hanmo_develop/pull/99) 공지의 대상·기한·정정 후보 추출은 `js/academic/core/campus-assist/`의 **합성 회귀 코어**입니다. 실제 학교 원문·독립 검수·학생 검색/공지 화면 연결은 [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27)·[#40](https://github.com/ot4562-glitch/Hanmo_develop/issues/40)·[#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)·[#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42)·[#57](https://github.com/ot4562-glitch/Hanmo_develop/issues/57)의 미완료 게이트입니다.

**언어 및 UI:** [#100](https://github.com/ot4562-glitch/Hanmo_develop/pull/100)·[#102](https://github.com/ot4562-glitch/Hanmo_develop/pull/102) 병합으로 소스의 TS/TSX/MTS/CTS는 **0개**, `jsconfig.json`에서 `checkJs: true`를 유지합니다. UI는 승인된 변경 외 재디자인을 금지하고, `html/practice.html`·`html/selectZone.html` 및 원본 신청/대기/키보드 동작을 보호합니다. 가상 404는 새 탭 기본 OFF, 같은 탭에서 예/아니오 선택을 유지하며 브라우저 **새로고침으로만 복구 안내**합니다. **강의 신청 대기 기본 예 / 페이지 접속 대기 기본 아니오**이며 404+접속 대기 예에서는 새로고침 복구 후 대기합니다. 실제 Windows Chrome/Edge의 SELECT 대기번호·Enter/포커스 등은 [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71)에서 별도 확인해야 합니다.

## 검사 및 완료 기준

```bash
npm install --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run check`는 JS 구문, JSDoc `checkJs`, 한국어 주석, TypeScript 소스 금지, UI 동결, 단위·레거시 회귀, 정적 빌드·스모크 검사를 실행합니다. 배포 산출물은 `dist/`이며 Pages QA에 원본 도메인 `CNAME`을 넣지 않습니다. **CI 통과는 학교 원문 검수, 실기기 접근성, 실제 Supabase·운영 배포 승인과 별개**입니다. 자료의 이용·배포 조건은 [#27](https://github.com/ot4562-glitch/Hanmo_develop/issues/27)·[#73](https://github.com/ot4562-glitch/Hanmo_develop/issues/73)을 따릅니다.
