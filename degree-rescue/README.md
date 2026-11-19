# 한모 학업 플래너 (독립 개발 브랜치)

[HUFS One AI](https://github.com/ot4562-glitch/HUFS-One-AI)의 순수 수강·학점·졸업·강의 개설 전망 코어를 **한모 HTML 사이트용 브라우저 번들**로 이식하는 프로젝트입니다. 원본은 아카이브 상태이며, 기존 한모의 BASIC/TIME/SELECT 연습 코드는 수정하지 않습니다.

## 실행

```bash
cd degree-rescue
npm install
npm run check
```

`npm run build`는 `public/app.js` 정적 번들을 생성합니다. 빌드 후 `degree-rescue/dist/`에 한모 기존 정적 페이지와 신규 `/degree-rescue/`이 함께 생성됩니다. 이 디렉터리에서 정적 HTTP 서버를 실행하고 `/degree-rescue/`을 엽니다. 파일을 직접 `file://`로 열지 마세요. GitHub Pages에서는 **빌드된 번들을 배포한 후** 작동합니다. 이 브랜치는 자동 게시하지 않고 GitHub Actions에서 빌드/테스트 후 **정적 사이트 전체를 artifact로 보관**합니다. 기존 `CNAME`은 배포 산출물에서 제외됩니다.

## 범위

- 포함: 강의 개설 전망·과거 예측 백테스트, 학점 원장, 이수요건, 이중전공·변경 가정, 교과목 동등성, 규칙 개정 비교, 선수과목·시간표 충돌, WIS 시간표 파서, 정적 HTML 시연.
- 제외: React UI 런타임, Fastify API, PostgreSQL, 계정/SSO, OCR, LLM, 원본 학생 데이터, 사설 토큰, 학교 공식 연동.
- 아직 연결 전: 실제 학교 강의 개설 원장, 공식 승인 RulePack, 교내 학사 시스템, Hanmo 수강연습 성공/실패 이벤트, 다학기 최적화 UI, PR로 최종 한모 통합.

**과거 3회 개설/4회 관찰은 미래 개설 75% 확률이 아닙니다.** 기존 코어는 개설 확정과 과거 관찰을 구분하며, 충분한 자료가 없으면 UNKNOWN/NEEDS_REVIEW를 유지합니다.

## 이식 근거·권리

원본: `ot4562-glitch/HUFS-One-AI`, main tree `081039076db6166b264aef56c1e043e0fa63540b` (2026-11-16 기준). 목적지: `ot4562-glitch/Hanmo_develop`. 원본의 보호 대상 `csv/` 5개, 로그인/권한 서버 경로, 개인 원장, 인증 비밀을 공개 이식하지 않았습니다. 원본 프로젝트 기여자의 공개 재배포 권한과 목적지 GPL-3.0 호환성은 메인 병합·공개 출시 전에 별도 검토해야 합니다.

모든 샘플 `SYN-*` 값은 합성 예시이며 실제 학생·학과·강의가 아닙니다. 브라우저에서 JSON을 처리하되 서버로 전송하지 않으며 기본 시연 화면에 추적 스크립트를 추가하지 않았습니다.
