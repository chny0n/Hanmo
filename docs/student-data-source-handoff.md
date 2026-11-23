# 한모 학생 화면 · 승인 데이터 연결 및 장애 처리 인계

> **2026-11-23 정보처 서면 회신 이후 현재 운영 불가:** [원문](sources/2026-11-23-hufs-information-office-reply.txt) · [아키텍처 §0·§7](architecture.md). 아래의 `notices/offerings/faq`, `instructor`, 원문 기반 근거/학교 규정·개별 강좌 payload 계약은 **옛 설계 및 현행 코드의 설명**일 뿐 허용된 운영 API 계약이 아닙니다. **교수명·수강 관련 정보/FAQ·학칙·졸업요건 금지, 공지 원문/첨부 복제 금지**를 우선 적용하고, 실제 연결 설정은 계속 `mode: disabled`로 유지합니다. 향후 새 데이터 계약/수집 제한/RLS·운영 검증이 완료되어야 수정·교체할 수 있습니다.

3차 인수에는 `scopePolicyVersion`, 근거의 공식성 확인 상태, 판본별 필드 차이, 축소 시 철회 및 확대 시 재검수를 포함합니다. 직원 안내 해석과 철회 절차는 [운영 방침](public-data-operating-decision.md)을 따릅니다.

## Supabase Free 실제 연결 전제

**2차 Windows 실기기 QA(#71) 완료 후 김채윤(`qamarrchae`)이 담당자로서 직접 별도 Supabase Free 실습 프로젝트를 생성**하고 학교 자료 이용권, 원문/판본 독립 검수, 승인 출처 관리와 RLS 실제 조회 테스트를 거쳐야 합니다. [Draft PR #93](https://github.com/ot4562-glitch/Hanmo_develop/pull/93)은 **현재 `main` 미병합**입니다. 철회 상태 복원/재발행 금지, 검수 후 출처 연결 변경 차단, 관리자 함수 권한 검사와 빈 공개 데이터 확인을 구현해 [격리 PostgreSQL 16 CI](https://github.com/ot4562-glitch/Hanmo_develop/actions/runs/45041483859)를 통과했습니다. 이는 실제 Supabase 프로젝트의 Data API, RLS, 익명 요청, 동시 트랜잭션, 학교 실자료를 시험한 결과가 아닙니다. **김채윤 실습·운영 검증 전까지 실연동하지 않으며**, 전체 완성 후 [원개발자 인계 #125](https://github.com/ot4562-glitch/Hanmo_develop/issues/125)는 별도 수락을 필요로 합니다.

공개 연결 설정을 활성화할 때 필요한 필드는 schemaVersion=1, mode=supabase, projectUrl=https://실제-프로젝트.supabase.co, publishableKey=sb_publishable_공개키 입니다. URL과 공개용 키만 저장할 수 있으며 secret/service_role/DB 암호·학생 성적·개인 계획은 저장소/브라우저에 넣거나 전송하지 않습니다.

브라우저 어댑터의 **향후 Supabase 모드**는 공개 Data API의 `public.hanmo_public_snapshots`에서 `is_active=true` 행 최대 2개를 조회하도록 구현돼 있지만, **기본값 disabled라 현재 실호출은 하지 않습니다.** 모드를 활성화한 경우에는 snapshot_id, schema_version, manifest_sha256, source_checked_at, published_at, expires_at, revoked_at, is_active, payload 메타데이터를 확인합니다. RLS가 존재해도 Data API 공개 설정과 익명 SELECT 권한을 별도로 검증해야 합니다. 클라이언트의 해시 형식/기한 검증은 독립 해시 재계산·검수·승인·RLS의 대체물이 아닙니다.

## 자료 보존과 정리

공개판은 검수·승인된 최소 자료로 구성하고, 참조 중인 출처 판본과 승인 기록을 보존합니다. 삭제나 아카이브 전에 운영자가 대상 행, 참조 관계, 검수된 최신판을 확인하고 암호화 백업을 복구 시험합니다. 정리 후 테이블·인덱스·DB 크기와 대표 응답의 전송량을 측정합니다. 예산과 보존 기간은 [최소 데이터 계획](focused-public-data-plan.md)을 따릅니다.

권리 철회가 발생하면 공개를 즉시 중단합니다. API, 정적 파일, 이전 배포판, 캐시와 검색 색인을 확인하고 철회판 재발행을 차단합니다. 절차는 [긴급 철회 런북](public-data-operating-decision.md)에 있습니다. 2026 동계 계절학기 수집 차단일과 CLI는 [아키텍처 §0.1](architecture.md)에 기록합니다.

## 폐기 예정 공개 payload v1 (구형 코드 해석용 · **운영 계약 아님**)

아래는 **현재 코드의 구형 파서가 기대하는 형식일 뿐 새로운 학생 공개 API의 명세가 아닙니다.** 재사용 권한이 없는 FAQ·교수 등 금지 필드가 포함돼 있으므로 이 형식 자체를 운영에서 켜지 않습니다. 구형 payload는 notices, offerings, faq 세 배열을 기대합니다. 공지에는 id, title, type, 학교 공식 HTTPS sourceUrl, 선택 publishedDate(YYYY-MM-DD)가 필요합니다. source.url/source.publishedDate도 지원합니다. 강의에는 courseId(또는 rawCode), title, term(또는 academicTerm), campus(SEOUL 또는 GLOBAL), 학교 공식 HTTPS sourceUrl, 선택 credits 및 instructor가 필요합니다. FAQ를 학생 UI에 노출한다는 기존 계획은 **폐기**됐습니다. 새 공개 DTO는 서면 금지·필드 검수·권리/철회 검증 후 별도 정의해야 합니다. 필드 계약에 맞지 않는 레코드가 섞이면 전체 결과를 INVALID로 보류합니다.

## 학생 화면 구분

| API 상태 | 화면 |
|---|---|
| NOT_CONNECTED | 공개 설정 전. 학교 자료가 아직 연결되지 않았다고 알림 |
| EMPTY | 연결되었으나 승인된 공개 행·자료 없음. 미개설/마감 없음으로 추정 금지 |
| OFFLINE | 네트워크/권한/요청 장애. 연결 재시도·공식 학교 페이지로 안내 |
| INVALID | 철회/만료/구조·출처 검증 실패. 위험 자료는 표시하지 않음 |
| READY | 유효한 공개판본의 공지·강좌만 표시. 실제 개인 적용과 미래 개설 확정은 원문 확인 |

오류 시 과거 미검수 정적 자료를 자동으로 사용하지 않습니다. 학생의 브라우저 로컬 내정보·반응속도 프로필 및 BASIC/TIME/SELECT 합성 연습은 학교 데이터 연결 장애와 독립적으로 작동해야 합니다.

## 검증

```bash
node --test tests/academic-data-source.test.cjs
npm run check
```
실운영 전에 API 실응답, 권한/RLS, 만료·철회, 빈 응답, 403/5xx/오프라인, PC 브라우저 접근성, 페이지 하위 경로·재시도, 원본 SELECT 대기열·Enter 연타 회귀를 추가 확인합니다.

관련 실행 이슈: [#27 사용권](https://github.com/ot4562-glitch/Hanmo_develop/issues/27), [#64 스키마/RLS](https://github.com/ot4562-glitch/Hanmo_develop/issues/64), [#65 공개 읽기](https://github.com/ot4562-glitch/Hanmo_develop/issues/65), [#66 승인 파이프라인](https://github.com/ot4562-glitch/Hanmo_develop/issues/66), [#67 실환경 인수](https://github.com/ot4562-glitch/Hanmo_develop/issues/67), [#71 원본 회귀](https://github.com/ot4562-glitch/Hanmo_develop/issues/71).

현재 설정은 계속 `mode: disabled`입니다. 학교 자료 사용권·실자료 검수와 운영자 인수가 끝날 때까지 활성화하지 않습니다.
