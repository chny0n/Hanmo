# 테스트 및 품질 검증

- Node 22: .nvmrc, package.json engines, .npmrc. 의존성은 npm ci로 설치합니다.
- npm run check:student: 언어·주석·UI·Action 고정·학생 입력 경계, 구문, JSDoc, 학생용 단위 테스트, 기존 BASIC/TIME/SELECT, 정적 빌드, smoke·철회 검사.
- npm run test:research: 학사 합성 단위 테스트와 비공개 수강 전략 시뮬레이터 테스트. `npm run test`는 전체 Vitest, `npm run check`는 학생 검사와 연구 검사를 모두 실행합니다. 공개 전략 추천은 학생 smoke 검사에서 실행합니다.
- npm run test:e2e 및 npx playwright test --config tests/playwright-feature.config.mjs: Chromium UI·원작 동작·접근성의 자동화 가능한 부분을 검사합니다.
- 학생 소스 허용 목록과 정적 파일 허용 목록은 배포 직전 검사됩니다. 미승인 연구 입력(출력 크기 0 포함), 임의 출력·정적 파일 유입, 필수 입력 누락을 부정 테스트합니다.
- Repository checks는 전체 검증, Feature browser QA는 별도 브라우저 흐름, Pages는 학생 검증·현행 SHA·비활성 학사자료 조건을 확인합니다.
- Windows 실제 Chrome/Edge, NVDA, 200% 확대, 물리 입력, 실제 자료 권리·독립 검수·운영 인수는 별도입니다. 검사 결과를 기록할 때 검사한 SHA와 실행 환경을 명시합니다.

[아키텍처 §9](architecture.md) · [미결 이슈](pending-issues.md) · [Actions](https://github.com/ot4562-glitch/Hanmo_develop/actions)

## Windows 브라우저 및 실기기 인수

[Windows browser QA](https://github.com/ot4562-glitch/Hanmo_develop/actions/workflows/windows-browser-qa.yml)는 설치된 Chrome·Edge 채널에서 두 자동 브라우저 묶음을 실행하고 OS·버전·SHA와 캡처를 보관합니다. [QA 결과 보고서](qa/2026-11-25-full-qa.md)에는 자동화 결과와 미실시 항목이 별도로 기록되어 있습니다.
