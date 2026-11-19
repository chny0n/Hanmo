# 한모 1차 학사 자산 · 아키텍처 범위 감사

> 기준: 2026-11-18 / [main/docs/architecture.md](../../docs/architecture.md). 각 파일의 존재, 테스트, 학교 공식 검수, 운영 가능성은 서로 다릅니다.

## 유지한 실제 이식 코어

| 범위 | 위치 | 판단 및 한계 |
|---|---|---|
| 미래 강의 개설 전망 | `src/core/forecast/{offering,scenario,rolling-origin}.ts` | 같은 계절의 관측·공식 확정 자료 분리, 백테스트. 실학기 원장·권리·예측 신뢰 검증 없음 |
| 학사행사 시기 전망 | `src/core/campus-assist/{activities,activity-intake}.ts` | KST 경계/반복 학사행사 분석. 공식 이력 기반 실서비스 미검증 |
| 학사 FAQ·근거성 | `src/core/campus-assist/faq*.ts` | 텍스트 검색·근거 필터·문구 검증. 운영자 승인된 FAQ와 HTML 검색 UI 미구현 |
| 학점·학번별 요건 판본 | `src/core/academics/{ledger,double-major,rule-approval,rule-diff,notice-links}.ts` | 학생 이수원장과 RulePack 없이 공식 개인 졸업 판정 불가 |
| 로컬 강의 검색 | `src/core/academics/{wis-timetable,faculty-directory,faculty-search,curriculum-csv}.ts` | 사용자가 수동 저장한 자료에서 표시되는 이름만 검색. 학교 전수 공식 DB 아님 |
| 수강계획 검사 | `src/core/academics/{plan,study-plan}.ts` | 별도 시간표 편집기는 만들지 않음. 개발자용/향후 참고 계산 기능 |
| 전공 변경 What-if 계산 | `src/core/academics/major-what-if.ts` | 보조 코어로 보존. 이수내역 일괄 로드 없이는 개인 계산 화면 미제공 |

## 이번 범위 절제로 제거

- `legacy-academic/hufs-one-ai/` 내 과거 원본 **235개** 및 README/manifest: 실제 브라우저 제품에 필요하지 않은 React/서버/DB/참고 파일의 대량 공개 보관을 중지합니다.
- `scripts/verify-academic-archive.mjs`와 `npm run archive:verify`: 공개 원본 아카이브 보존을 전제로 한 검증을 제거합니다. **타입/테스트/정적 빌드/기존 한모 원본 보호 검사는 유지**합니다.
- `core/academics/experience-evidence.ts` + 테스트, `contracts/academics/owner-experience-courses.ts`: 경력·활동 증빙 영역의 부적합 기능 제거.
- `src/views/whatIfView.ts` + 테스트, `core/campus-assist/exchange-preparation.ts` + 테스트: 실학생 데이터 자동 로드가 없어 현재 사용하지 않는 UI/준비 적격성 기능. 다른 순수 학사 계산 코어는 보존.
- `reference/hufsability-academic-features.json`: 개인 로그인 메뉴·비교과/장학까지 포함한 참조 미러를 제품 설계/공식 연동 기능처럼 남기지 않음.
- 과거 `docs/superpowers/` 및 중복 2026-11-17 개발 설계 초안: 현재의 main 아키텍처로 일원화.

## 권리·데이터 · 출시 전 필수 결정

1. 다른 팀 기여가 포함된 코어의 **공개 재배포 동의**와 Hanmo GPL-3.0 호환성 확인. PR HEAD에서 사본을 지워도 과거 Git 커밋에는 남으므로 권리 위험이 자동 해소되는 것은 아닙니다.
2. 한국외대 공식 강의·학칙·공지의 수집 및 표시 가능 범위, 전공·학번 적용 RulePack의 독립 검수.
3. 예측의 원자료 출처, 시행일·관측 공백·미확정 구분, D-day는 공식 검수 학생 마감에만 허용.
4. 브라우저/접근성/정적 프리뷰 E2E, 모바일 360px, 기존 BASIC/TIME/SELECT 보호 검사.
5. 2차 기존 한모 변경·최종 배포는 원개발자 승인 후. 3차 Supabase는 별도 운영 책임 합의 이후에만 진행.

이 문서는 기능 완료 주장이나 학교의 공식 승인 문서가 아닙니다.
