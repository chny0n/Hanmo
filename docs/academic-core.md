# 한모 학생 웹 · 현재 실행 화면과 학교자료 경계

> **2026-11-23 `main` 상태.** 공식 학교 서비스가 아니며 공지·강의·행사 실제 공개자료는 **`data/academic-source-config.json`의 `mode: disabled`**로 연결하지 않습니다. [서면 회신 원문](sources/2026-11-23-hufs-information-office-reply.txt) · [현행 아키텍처](architecture.md).

## 학생 페이지와 현재 기능

| 경로 | 실제 동작 | 남은 인수/한계 |
|---|---|---|
| `index.html` → `html/vsugang.html` | BASIC/TIME/SELECT 합성 모의수강신청, 두 BASIC 돌발상황 RECONNECT·CAPACITY 기본 OFF, 독립 대기 설정 | Windows Chrome/Edge 실기기·원본 회귀 [#71](https://github.com/ot4562-glitch/Hanmo_develop/issues/71) |
| `html/readiness.html` | 브라우저 프레임/긴 작업/타이머, **한모 동출처 CDN** 지연·지터·처리량 | 실제 학교 서버/공인 회선 속도가 아님. 측정 정확도 [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134) |
| `html/reaction-test.html` | 시각 신호 8회 반응, 중앙값 한 줄 안내, 로컬 프로필 | 입력 장치/탭 가림/저장 차단 신뢰성 [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134) |
| `html/strategy-lab.html` | 과목명·중요 순위(1이 최상위)·**가상 정원 1~300**·경쟁자 수 입력, 로컬 반응 프로필 자동 적용, 가상 1,000회 반복 | **실제 수강신청 성공률이 아님.** 결정성·민감도 [#134](https://github.com/ot4562-glitch/Hanmo_develop/issues/134) |
| `html/academic-timeline.html` | **공지/월간 달력 탭 통합**, 공식 원문 링크·자료 미연결 안내 | 검수되지 않은 학교 공지 본문/실제 일정 표시 금지 |
| `html/catalog.html` | 강의검색·비공식 전망 미연결 안내. `forecast.html`은 호환 이동 | 교수명/수강 현황/미검수 분반 공개 금지 |
| `html/planner.html` | 캠퍼스·전공·입학년도 **사용자 직접 입력** 브라우저 로컬 저장 | 학교 학적·성적·졸업 판정과 무관 |
| `html/result.html` | 합성 연습 시간/결과 확인 및 이어서 연습 | 사용자 요청에 따라 **PNG 공유 버튼 없음** |

**삭제된 학생 웹:** `html/academic-calendar.html`, `html/academic-support.html`, `html/academic-progress.html`, `html/academic-faq.html`; 해당 구형 전용 자산과 학교 로고 `img/hufs_logo.png`. 통합 달력은 `academic-timeline.html` 탭에서만 표시합니다. 내부 순수 NLP/학칙 계산 코어 잔존은 운영 범위나 학교 승인 근거가 아닙니다.

## 데이터·수집 안전 계약

- 학교 서면의 구체적 금지(학칙·졸업요건 이용, 학생 대상 FAQ, 교수명·수강 관련 정보·개인 성적, 공지 본문/첨부 복제)를 우선 적용합니다. 대면 공개정보 가공 설명은 직원 안내이며 기관의 확정 포괄 허가가 아닙니다.
- 공지 **하루 1회 이하**(첫 목록+신규 상세), 강의시간표 **학기당 2회 이하**, 요청 간 **10초 이상**, 동시 1개, 실행당 최대 50개, 신청/정정 기간 전후 각 1일 수집 금지, 오류·접속 제한 때 당일 중단/재시도 금지, 공개 URL·서비스명/연락처 User-Agent. **현재 수집기/실학교 데이터/실DB 미연결**.
- 미연결·빈 자료·오류·검수 실패를 구분합니다. 구형 `js/academic-data-source.js`의 `faq`/`instructor` 필드나 Draft #93 SQL은 공개용으로 활성화하지 않습니다. [#41](https://github.com/ot4562-glitch/Hanmo_develop/issues/41)·[#42](https://github.com/ot4562-glitch/Hanmo_develop/issues/42)·[#66](https://github.com/ot4562-glitch/Hanmo_develop/issues/66)·[#126](https://github.com/ot4562-glitch/Hanmo_develop/issues/126).
- `npm ci` → `npm run check` → `npx playwright install chromium` → `npm run test:e2e` 자동화는 Windows 실기기·스크린리더/200%·원개발자 인수 대체가 아닙니다.
