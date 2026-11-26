# 테스트 및 품질 검증

- Node 22: .nvmrc, package.json engines, .npmrc. 의존성은 npm ci로 설치합니다.
- npm run check:student: 언어·주석·UI·Action 고정·학생 입력 경계, 구문, JSDoc, 학생용 단위 테스트, 기존 BASIC/TIME/SELECT, 정적 빌드, smoke·철회 검사.
- `npm run test:research`는 학사 합성 단위 테스트와 내부 몬테카를로 전략 엔진을 검사합니다. 학생 smoke는 공개 순서 추천을 검사하고, Chromium E2E는 추천 순서와 계산 기준의 가시성을 확인합니다. `npm run test`는 전체 Vitest, `npm run check`는 학생 검사와 연구 검사를 모두 실행합니다.
- npm run test:e2e 및 npx playwright test --config tests/playwright-feature.config.mjs: Chromium UI·원작 동작·접근성의 자동화 가능한 부분을 검사합니다.
- 학생 소스 허용 목록과 정적 파일 허용 목록은 배포 직전 검사됩니다. 미승인 연구 입력(출력 크기 0 포함), 임의 출력·정적 파일 유입, 필수 입력 누락을 부정 테스트합니다.
- 학생 공통 스타일은 빌드에서 `dist/css/student-ui.css`로 묶습니다. 이 출력의 소스 CSS와 기존 배경 URL을 따로 검사합니다.
- 개발자 사진은 배포본에서 EXIF와 XMP를 제거합니다. 원본, IPTC 촬영자 표기, 색상 프로필, JPEG 압축 스캔을 보존합니다.
- PC 진단의 합성 다운로드 파일은 빌드에서 기존 v1 바이트를 다시 만들고 SHA-256을 검사합니다.
- Repository checks의 `student-site`가 학생용 빌드를 검증합니다. `core-and-site`가 검증된 산출물로 Chromium 회귀와 기능 QA를 실행하고 보고서를 따로 보관합니다. 같은 작업에서 연구 검사를 수행합니다. `deploy-pages`는 같은 빌드에서 만든 Pages 산출물의 현행 SHA를 확인해 배포합니다.
- Windows 실제 Chrome/Edge, NVDA, 200% 확대, 물리 입력, 실제 자료 권리·독립 검수·운영 인수는 별도입니다. 검사 결과를 기록할 때 검사한 SHA와 실행 환경을 명시합니다.

[아키텍처 §9](architecture.md) · [미결 이슈](pending-issues.md) · [Actions](https://github.com/ot4562-glitch/Hanmo_develop/actions)

## Windows 브라우저 및 실기기 인수

[Windows browser QA](https://github.com/ot4562-glitch/Hanmo_develop/actions/workflows/windows-browser-qa.yml)는 설치된 Chrome·Edge 채널에서 두 자동 브라우저 묶음을 실행하고 OS·버전·SHA와 캡처를 보관합니다. [QA 결과 보고서](qa/2026-11-25-full-qa.md)에는 자동화 결과와 미실시 항목이 별도로 기록되어 있습니다.

정기 화면 기록 테스트는 현재 후보의 12개 경로를 1440×900과 1280×720에서 캡처합니다. 원작 보호 파일은 고정된 Git blob과 승인된 동결 해시로 검사합니다. 이전 디자인을 재현하는 빌드 절차는 [검증 도구의 Git 이력](https://github.com/ot4562-glitch/Hanmo_develop/blob/4f2b52a1c0f66be788d23f4fc7c9e0f558c2df14/scripts/capture-design-baseline.mjs)에 있습니다.

최대 SELECT 완료 표의 내부 스크롤과 남은 물리 입력·NVDA 검증은 [#125 현장 QA](https://github.com/ot4562-glitch/Hanmo_develop/issues/125)에서 추적합니다. 자동 검증 당시의 브라우저·화면 크기·스크롤 높이는 [#71 종료 기록](https://github.com/ot4562-glitch/Hanmo_develop/issues/71#issuecomment-7160455697)에 있습니다.
