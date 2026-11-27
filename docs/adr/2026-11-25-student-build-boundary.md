# ADR: 학생 배포 경계와 연구 코드 보존

상태: 채택. 2026-11-25.

교수·학점·졸업·FAQ 등 비운영 코어가 종전 계약 및 전체 테스트에 남아 있다. [운영 방침](../public-data-operating-decision.md)은 합성 연구 코드 보존을 허용하지만 학생 서비스와 실제 자료 연결은 제한한다.

결정: 연구 코어의 물리 경로는 협업 PR 및 합성 테스트 호환성을 위해 유지한다. 개설 전망 계약을 직접 참조하는 전용 모듈로 분리하고 종전 내보내기는 호환 유지한다. 전체 esbuild 입력 메타데이터와 산출물의 명시적 허용 목록을 검사하고 정적 파일도 허용 목록으로 복사한다. 연구 테스트는 전체 Repository checks에서 유지하되 Pages에서는 반복하지 않는다. Node와 Action 버전 관리, 에이전트 규칙 정본을 함께 통일한다.

영향: 학생 UI와 전략 계산 모수, 기존 연구 알고리즘, 수집 OFF, UI 보호 해시, 공개 도메인 및 학교 자료 정책을 변경하지 않는다. 새로운 공개 입력/자산은 별도 검토 후 목록을 갱신하고 부정 테스트를 추가한다.

이전 상태 및 상세 운영 기록: [기준 커밋](https://github.com/ot4562-glitch/Hanmo_develop/tree/2b4d2eb8e46a596958fabe468f5682bf7c67f48f), [기존 아키텍처](https://github.com/ot4562-glitch/Hanmo_develop/blob/2b4d2eb8e46a596958fabe468f5682bf7c67f48f/docs/architecture.md), [기존 agent.md](https://github.com/ot4562-glitch/Hanmo_develop/blob/2b4d2eb8e46a596958fabe468f5682bf7c67f48f/agent.md).
