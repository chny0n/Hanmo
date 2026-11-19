# 한모 학업 모듈 · PR #1~#5 병합 준비 검토표

**검토 기준일:** 2026-11-18 (Asia/Seoul) · **설계 정본:** [main/docs/architecture.md](../../docs/architecture.md)
**현재 결론:** 1차 독립 학업 코드의 기술적 검증을 통과했습니다. PR들은 **아직 병합하지 않았습니다**. 원본 한모의 2차 수정·실서비스 배포와 1차 코드 병합은 별도로 승인합니다.

## 1. 코드·브랜치 검사

- PR 스택: [#1](https://github.com/ot4562-glitch/Hanmo_develop/pull/1) → [#2](https://github.com/ot4562-glitch/Hanmo_develop/pull/2) → [#3](https://github.com/ot4562-glitch/Hanmo_develop/pull/3) → [#4](https://github.com/ot4562-glitch/Hanmo_develop/pull/4) → [#5](https://github.com/ot4562-glitch/Hanmo_develop/pull/5).
- 각 PR은 독립된 검토 가능한 변경 파일 42 / 35 / 23 / 12 / 19개로 정리했으며, 스택 브랜치를 **원본 235개 아카이브의 과거 커밋 이력을 포함하지 않는 새 계보**로 재구성했습니다.
- 공개 HEAD에는 React/서버·PostgreSQL 원본 235개, 활동·경력 증빙 연결, 사용하지 않는 개인 적격성 화면이 없습니다. 실제 TypeScript 순수 코어·테스트는 유지했습니다.
- 1차 변경은 `degree-rescue/**`와 관련 CI만 포함; 기존 한모 `index.html`, `html/**`, `js/**`, `css/**`, `img/**`, `CNAME`을 수정하지 않았습니다.
- 원본 라이선스는 리포지토리 `LICENSE`의 **GPL-3.0**입니다. 사용자(이전 HUFS One AI 프로젝트 소유자)는 **자기 프로젝트 소스의 이식·재사용을 승인**했습니다. 다른 사람이 저작권을 가진 기여가 포함되어 있다면 그 기여분의 허가는 별도로 확인해야 하며, 리포지토리 소유 자체가 타인의 권리를 자동 이전하지는 않습니다.

## 2. 자동 검증

- 최종 PR #5 기준: TypeScript 타입 검사, **35개 Vitest 파일/650개 테스트 성공**, ESBuild 정적 번들, 원본 파일 보호 검사. GitHub Actions 2개 성공.
- 추가 정적 스모크: HTML 3개 페이지, 허용된 10개 학업 정적 파일, 내부 링크 18개, ARIA 참조 9개, CNAME 미포함 확인.
- 브라우저 코드 실행: GitHub Actions ZIP의 동일 JS 번들을 Chromium에 주입해 **14개 동작 확인 전부 통과**, 런타임 오류 0건, 모바일 폭 360px에서 가로 넘침 없음. 전공 선택, 공지 후보, 근거 주석, 가짜 SOURCE_REVIEWED와 외부 링크 차단, 미검수 D-day 보류, 가상 D-day 구분, 로컬 설정 저장/삭제, 저장 WIS 화면 기본 동작을 점검했습니다.
- **환경 한계:** 자동 브라우저 실행은 로컬 HTTP 이동이 관리자에 의해 차단돼 HTML/JS/CSS를 메모리에서 렌더링했습니다. 공식 정적 JSON 응답과 저장소는 테스트 대역으로 제공했습니다. **실제 HTTP/Pages의 Windows PC Chrome/Edge 브라우저 E2E와 키보드·화면낭독기 검증이 남아 있습니다. 모바일 실기기는 지원 대상이 아닙니다.**

[최신 CI](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/44298300292) · [정적 빌드 CI](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/44298300403)

## 3. 수정한 결함

| 유형 | 조치 |
|---|---|
| 미검수 JSON 날짜가 공식 D-day처럼 보이는 문제 | 독립 검수·학생 대상 확인 시에만 일반 D-day 표기. 합성 D-day는 `가상`, 나머지 자체 입력은 `D-day 없음 · 원문 확인` |
| 외부 사이트 URL을 학교 공지 원문으로 안내하는 문제 | 정확한 `hufs.ac.kr` 또는 하위 도메인만 학교 도메인 링크로 구분하고, 나머지 HTTPS 링크에 외부 주의 문구 |
| 주전공 없이 이중전공만 입력해도 개인화가 시작되는 문제 | 주전공이 있어야 전공 조건 기반 추천을 활성화 |
| 정적 사이트 파일 누락·잘못된 링크·중복 ID 위험 | `npm run check` 마지막에 `npm run smoke` 추가. 미승인 정적 파일과 CNAME 배포를 거부 |

## 4. 병합·배포를 혼동하지 않기

- **1차 코드 병합 가능성:** 기존 한모 파일에 손대지 않는 학사 코드의 리뷰·코드 통합을 의미합니다. 공식 강의/공지/졸업 데이터의 정확성 인증, 운영 게시 승인, 1차 완제품 출시는 의미하지 않습니다.
- **2차 원본 한모 변경:** 사용자 계획대로 임창용 님에게 설계 설명·사전 동의를 받은 뒤 별도 JavaScript PR로 진행합니다. 1차에는 시뮬레이터 변경 없음.
- **GitHub Pages 주의:** 이 리포지토리는 `has_pages=true`이고 root `CNAME`이 존재합니다. CI 자체는 배포하지 않고 ZIP 아티팩트만 저장하지만, **Pages 게시 소스 브랜치/폴더 설정은 현재 연결된 도구로 확인할 수 없었습니다**. `Settings → Pages`에서 main 병합이 바로 운영 사이트를 갱신하는지 확인하기 전에는 병합이 곧 공개 게시가 될 수 있다는 점을 고려해야 합니다.
- **실데이터:** 기존 10건 참고 공지는 제목·게시일만 있으며 전공별 실제 적용 대상과 공식 신청 마감은 미검증. 현재 UI는 공식 졸업 판정·실제 대학 계정 조회를 제공하지 않습니다.

## 5. 안전한 순차 병합 방법 (원개발자·게시 조건 확인 후)

1. [PR #1](https://github.com/ot4562-glitch/Hanmo_develop/pull/1)을 `main`으로 **Create a merge commit** 방식 병합; 현재 리포지토리는 merge commit을 허용하고 자동 브랜치 삭제가 꺼져 있습니다.
2. [PR #2](https://github.com/ot4562-glitch/Hanmo_develop/pull/2)의 **base branch를 `main`으로 변경**한 다음 변경 파일 범위와 새 CI 확인 → merge commit 방식 병합.
3. #3, #4, #5도 **바로 앞 PR이 main에 들어간 뒤 base를 main으로 바꾸고** 각각 CI·diff를 재확인해 순차 병합.
4. 각 단계에서 실패하면 즉시 중단. 남아 있는 feature 브랜치는 마지막 PR까지 병합 검증한 다음 정리.
5. 마지막에는 `main`에서 `degree-rescue/`가 기존 한모를 덮어쓰지 않는지 검증하고, 실제 운영 주소에서 게시 전에 독립 학생 UX와 자료 상태를 QA.

**주의:** 스택 PR을 차례로 retarget하지 않고 각 브랜치에 그대로 Merge를 누르면, #2는 `main`이 아니라 #1 기능 브랜치로 병합될 수 있습니다. Squash 방식은 다음 PR의 기존 조상 커밋을 보존하지 않아 차이 비교가 늘어날 수 있으므로 이 스택에서는 merge commit을 권장합니다.

## 6. 후속 과제 (이번 병합의 구현 범위가 아님)

검수된 강의 개설 이력과 미래 개설 전망의 정확도, 연도별 학사행사 시기 모델·학교 공지 원문, 전공별 적용 범위, 학생용 근거형 FAQ, 개인 학적·이수 내역 일괄 가져오기, 2차 실전 위기 시나리오, 3차 Supabase 실연동은 별도 개발·승인 대상입니다.

**2026-11-19 제품 기기 정책:** 전체 한모 **PC 전용**으로 확정. 과거 360px 오버플로 통과는 참고 시험일 뿐 모바일 지원/출시 조건이 아닙니다. [PC 전용 설계](../../../docs/architecture.md) · [이슈 #26](https://github.com/ot4562-glitch/Hanmo_develop/issues/26).
