# 한모 · Hanmo Develop

**한국외국어대학교 비공식 PC 웹 프로젝트.** [원작 한모](https://github.com/dlacked/Hanmo)의 BASIC·TIME·SELECT 모의수강신청을 유지하면서, 학생이 직접 학점을 정리하고 향후 학사 정보를 확인할 수 있는 화면을 개발합니다.

[웹 미리보기](https://ot4562-glitch.github.io/Hanmo_develop/) · [개발 이슈](https://github.com/ot4562-glitch/Hanmo_develop/issues) · [현행 설계](docs/architecture.md)

## 사용할 수 있는 기능

| 화면 | 현재 동작 |
| --- | --- |
| [모의수강신청](html/vsugang.html) | BASIC·TIME·SELECT 연습. 실제 신청과 무관 |
| [내정보](html/planner.html) | 캠퍼스·전공·입학년도 직접 입력. 브라우저에 저장 |
| [학점 정리](html/academic-progress.html) | 직접 입력한 학점 계산. 공식 졸업사정 아님 |
| [학사 공지](html/academic-timeline.html) | 학생용 검색 화면. 실제 학교 자료 연결 대기 |
| [강의 검색](html/catalog.html) | 과목 탐색 화면. 실제 강의 자료 연결 대기 |
| [개설 전망](html/forecast.html) | 학기·과목 조회 화면. 실제 개설 이력 연결 대기 |

모의신청에는 **BASIC에서 선택적으로 켜는 1회 가상 404**가 있습니다. 기본값은 OFF이며, 오류 화면을 새로고침하면 연습을 이어갑니다. 강의 신청 대기 기본값은 '예', 신청 페이지 접속 대기 기본값은 '아니오'입니다. 원본 모의신청 흐름과 결과 화면은 별도 보호 대상입니다.

## 자료와 운영 범위

- 이 사이트는 학교 공식 서비스가 아닙니다. 실제 수강신청, 학교 로그인, 학적 조회, 공식 졸업 판정을 제공하지 않습니다.
- 학교 공지·강의·학칙 자료는 이용 권한 확인과 독립 검수·승인 전까지 연결하거나 재배포하지 않습니다. 중요한 학사 판단은 [학교 공식 안내](https://www.hufs.ac.kr/)를 확인해야 합니다.
- 학생이 직접 입력한 정보는 브라우저의 로컬 저장 영역에서 다룹니다. 승인 없는 원격 전송이나 실제 신청 결과와의 합산을 허용하지 않습니다.
- GitHub Pages는 이 저장소의 **QA 미리보기**입니다. 별도 승인 없이 운영 도메인이나 Supabase 운영 환경을 변경하지 않습니다.

구체적인 권리·검수·데이터 수명주기·운영 인수 조건은 [현행 아키텍처](docs/architecture.md)와 [데이터 수명주기 체크리스트](docs/academic-data-lifecycle-operations.md)를 따릅니다. Supabase 설치 초안은 [별도 Draft PR #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)에서 검토하며, 실제 데이터베이스가 연결되었다는 뜻은 아닙니다.

## 개발 및 검증

Node.js 22 환경에서 실행합니다.

```sh
npm install --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run check`는 정책·JavaScript 구문·JSDoc 타입·학업 코어·원본 회귀·정적 빌드·링크 검사까지 실행합니다. `npm run build`의 `dist/`가 GitHub Pages 배포 대상이며, 테스트·설계 문서·원본 학업 모듈은 직접 배포하지 않습니다.

개발자는 [AGENTS.md](AGENTS.md)와 [agent.md](agent.md)의 정책을 먼저 확인해야 합니다. 화면 동결 기준선, 신규 코드 JavaScript/JSDoc 통일, 한국어 주석, 원개발자 승인, 실기기 회귀 검증 규칙을 유지합니다.

원작: [dlacked/Hanmo](https://github.com/dlacked/Hanmo) · 라이선스: [GPL-3.0](LICENSE)
