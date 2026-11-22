<div align="center">

  <a href="https://github.com/ot4562-glitch/Hanmo_develop"><img src="img/hanmo_color.png" width="76" alt="한모 로고"></a>

  <h1>한모 · Hanmo Develop</h1>

  <p><strong>수강신청은 미리 연습하고,<br>학업의 다음 선택은 더 분명하게.</strong></p>

  <p>원작 한모의 모의수강신청 경험을 지키면서<br>공지의 근거, 강의 개설 정보, 나의 학업 준비를 하나의 흐름으로 잇는<br><strong>한국외국어대학교 학생을 위한 비공식 PC 웹 프로젝트</strong>입니다.</p>

  <p>
    <a href="https://github.com/ot4562-glitch/Hanmo_develop/actions/workflows/academic-ci.yml"><img alt="코드 검사" src="https://github.com/ot4562-glitch/Hanmo_develop/actions/workflows/academic-ci.yml/badge.svg?branch=main"></a>
    <a href="LICENSE"><img alt="GPL-3.0 라이선스" src="https://img.shields.io/badge/license-GPL--3.0-F4C76C?labelColor=00131F"></a>
    <img alt="PC 웹 전용" src="https://img.shields.io/badge/platform-PC%20Web-467C96?labelColor=00131F">
    <img alt="비공식 학생 프로젝트" src="https://img.shields.io/badge/project-unofficial-567D6F?labelColor=00131F">
  </p>

  <p>
    <a href="https://ot4562-glitch.github.io/Hanmo_develop/">포크 웹 미리보기</a> ·
    <a href="#학생이-마주하는-세-가지-질문">프로젝트 소개</a> ·
    <a href="#원작에서-이어받고-새로-더한-것">원작과의 차이</a> ·
    <a href="#학사종합지원센터와-함께-확인하고-싶은-것">학교 검토 사항</a> ·
    <a href="#개발자에게">개발 안내</a>
  </p>

</div>

![한모 개발 프로젝트: 모의수강신청과 근거 중심 학업 정보 안내를 표현한 배너](docs/images/hanmo-hero-hufs.svg)

<p align="center"><sub>설명용 일러스트 · 실제 브라우저 화면 캡처가 아닙니다. 한모는 학교가 제작·운영하는 공식 서비스가 아닙니다.</sub></p>

---

## 학생이 마주하는 세 가지 질문

> **“이 공지는 내게도 해당될까?”**  
> **“듣고 싶은 강의는 다음 학기에도 열릴까?”**  
> **“수강신청 도중 예상치 못한 화면이 나오면 어떻게 해야 할까?”**

한모가 향하는 곳은 단순한 정보 모음이 아닙니다. 학생이 **무엇을 확인했고, 무엇이 아직 불확실하며, 다음에 무엇을 해야 하는지** 이해할 수 있는 학업 준비 경험입니다.

수강신청 연습은 지금 사용할 수 있습니다. 학사공지·강의 검색·개설 전망은 학생용 화면과 계산·검증 기반을 갖추고 있지만, **학교에서 이용이 허용되고 독립적으로 검수된 실제 학사자료를 연결하기 전까지 결과를 확정해 보여주지 않습니다.**

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>01 / PRACTICE</strong><br><br>
      <strong>실전처럼 연습하기</strong><br>
      BASIC · TIME · SELECT의 신청 흐름과 타이밍을 익히고, 선택형 가상 접속 장애에도 대응해 봅니다.<br><br>
      <sub>기존 연습 유지 + 선택형 훈련 확장</sub>
    </td>
    <td width="33%" valign="top">
      <strong>02 / UNDERSTAND</strong><br><br>
      <strong>근거를 확인하기</strong><br>
      공지·강의 정보는 출처, 적용 대상, 정정·취소 여부를 함께 다루도록 설계합니다.<br><br>
      <sub>학생 화면 구현 · 승인 자료 연결 전</sub>
    </td>
    <td width="33%" valign="top">
      <strong>03 / PREPARE</strong><br><br>
      <strong>다음 학기 준비하기</strong><br>
      캠퍼스·전공·입학년도와 강의 개설 관측을 바탕으로 계획을 세우는 방향으로 확장합니다.<br><br>
      <sub>로컬 내정보 및 계산 코어 · 실자료 검증 필요</sub>
    </td>
  </tr>
</table>

## 원작에서 이어받고, 새로 더한 것

이 저장소는 **[dlacked/Hanmo](https://github.com/dlacked/Hanmo)**를 기반으로 합니다. 원작의 가치는 **실제 수강신청에 앞서 손과 눈에 익히는 연습 경험**에 있습니다. 확장은 그 경험을 대체하는 대신, 그 옆에 새로운 선택지를 더하는 방식으로 진행합니다.

| 구분 | 원작에서 이어받은 것 | Hanmo Develop에서 더한 것 |
| :--- | :--- | :--- |
| **모의수강신청** | BASIC · TIME · SELECT, 과목 수 설정, 신청·대기·시간 측정의 기본 흐름 | 기존 화면 밖에서 선택형 돌발상황·접속 대기 조건 확장 |
| **돌발상황** | 익숙한 모의신청 조작과 화면 구성 | BASIC에서 신청 페이지로 넘어갈 때 **가상 404를 한 번 표시**하고 브라우저 **새로고침으로 복구**하는 연습 |
| **대기시간 설정** | 기존 강의 신청 대기 흐름 | **강의 신청 대기(기본 예)**와 **수강신청 페이지 접속 대기(기본 아니오)**를 독립 설정. 404가 발생하면 새로고침 복구 **이후** 접속 대기를 적용 |
| **개인화** | 연습에 필요한 자체 설정 | 캠퍼스·전공·입학년도 등 **내정보를 브라우저에 저장**, 간단한 학점 정리 화면 제공 |
| **학업 정보** | 수강신청 연습에 집중 | **학사공지·강의 검색·개설 전망** 화면 및 근거·판본·보류 상태를 다루는 JavaScript 코어와 테스트 |
| **검증** | 원작의 PC 전용 이용 조건 | 원본 화면 보호 검사, 시나리오 회귀, 학업 계산·검색 코어 테스트 및 정적 사이트 빌드 검사 |

**원작에 대한 변경 경계:** `html/practice.html`과 `html/selectZone.html`의 원본 화면·핵심 신청 동작은 직접 수정하지 않았습니다. 가상 404는 `js/scenario-settings.js`·`js/hanmoSys.js` 등 별도 연결 지점에서 처리합니다. 기존 SELECT 대기번호, Enter 키 안내, 시간 측정과 결과 저장은 보존 대상이며 **실제 Windows 브라우저 최종 회귀 검증은 별도로 남아 있습니다.**

### 돌발상황 연습은 이렇게 동작합니다

```text
BASIC 모드 선택
    ↓  돌발상황 ‘예’인 경우
기존 연습 페이지 → 수강신청 페이지 진입
    ↓
가상의 404 화면 (1회)
    ↓  실제 브라우저 새로고침
정상 수강신청 페이지
    ↓  ‘페이지 접속 대기’가 예이면 대기시간 적용
기존 모의수강신청 계속
```

돌발상황의 **첫 설정은 아니오**이며, 같은 탭에서 한 번 선택한 예·아니오는 다른 페이지에 다녀와도 유지됩니다. 브라우저 **뒤로가기는 복구 방법으로 지원하지 않습니다.** 이 화면은 실제 HTTP 오류나 한국외대 서버 장애가 아니라 **학습용 가상 상황**입니다.

## 지금 볼 수 있는 화면과 아직 필요한 자료

| 화면 | 현재 직접 확인 가능한 것 | 아직 확정하지 않는 것 |
| :--- | :--- | :--- |
| [모의수강신청](html/vsugang.html) | 세 연습 모드, 돌발상황 선택, 두 대기시간 설정 | 실제 학교 신청·신청 성공 여부 |
| [내정보](html/planner.html) | 캠퍼스·전공·입학년도 직접 입력 및 로컬 표시 | 학교 학적·본인 인증 |
| [학사공지](html/academic-timeline.html) | 자료 미연결·빈 결과·오류 등 신뢰 상태 안내 | 개인별 공식 적용 공지·마감일 |
| [강의 검색](html/catalog.html) | 승인된 공개 자료를 읽을 학생용 검색 화면 | 허가·검수되지 않은 실제 강좌 목록 |
| [개설 전망](html/forecast.html) | 학수번호·학기 입력 및 자료 부족 판단 | 검증되지 않은 미래 강의 개설 확정 |
| [학점 정리](html/academic-progress.html) | 직접 입력한 학점 합계와 계획 참고 | 공식 이수구분·졸업 가능 여부 |

> **현재 학교 학사자료는 연결돼 있지 않습니다.** 공개 데이터 설정은 기본 비활성이고, 실제 Supabase 프로젝트나 학교 계정·성적 시스템과 연동하지 않습니다. 자료가 없을 때는 없는 대로 알립니다. **미관측을 미개설로, 예상 구간을 공식 신청기간으로 표시하지 않습니다.**

## 학사종합지원센터와 함께 확인하고 싶은 것

한모는 학교를 대신해 학사 판단을 내리려는 서비스가 아닙니다. **학생이 공식 원문을 더 정확하게 찾아보고, 자기 상황에 맞는 정보를 스스로 확인하도록 돕는 것**이 목표입니다.

실제 학사정보를 연결하기 전에 다음 기준에 대한 학교의 의견을 구하고 싶습니다.

1. **자료를 어디까지 활용할 수 있을까요?** 학사공지·강의/분반·학사일정·학칙의 **원문 링크, 일부 인용, 요약·구조화, 재배포, 정기 수집**은 각각 어디까지 허용되는지 확인하고 싶습니다.
2. **정정과 취소를 어떻게 전달해야 할까요?** 공지의 변경·철회, 전공/입학년도별 적용 조건, 학생 접수 마감과 행정 처리 마감을 혼동하지 않도록 검증 기준을 마련하고 싶습니다.
3. **학생이 공식 안내와 혼동하지 않으려면 무엇이 중요할까요?** 출처·확인 시각·불확실성 표시, 공식 상담 경로 안내, 오류 제보와 정정 요청의 연결 방식을 검토받고 싶습니다.

답변받지 못했거나 사용이 허용되지 않은 자료는 **수집·재게시하지 않고 공식 페이지 링크와 ‘확인 필요’ 안내로 대체**합니다. 학교의 검토는 이 프로젝트에 대한 공식 인증·보증이나 공동 운영을 뜻하지 않습니다.

[학사종합지원센터 참고용 소개](docs/academic-support-center-brief.md) · [자료 연결 및 권리·검수 기준](docs/student-data-source-handoff.md)

---

## 개발자에게

**구조는 단순하게, 신뢰 경계는 명확하게.** 학생용 화면은 정적 HTML/CSS, 학업 코어와 테스트는 **JavaScript + JSDoc**입니다. 실제 학교 자료는 별도 사용권·독립 검수·운영 인수 없이 배포에 포함하지 않습니다.

```bash
git clone https://github.com/ot4562-glitch/Hanmo_develop.git
cd Hanmo_develop
npm install --ignore-scripts --no-audit --no-fund
npm run check
```

`npm run check`는 JS/JSDoc 타입·구문, 단위 테스트, 원본 모드·가상 404·대기 설정 회귀, UI 보호와 정적 빌드를 검사합니다. 원본 모의신청 관련 검사만 실행하려면 `npm run check:legacy`, 정적 배포용 파일을 만들려면 `npm run build`를 사용합니다. 빌드 결과는 `dist/`이며 로컬에서는 **정적 HTTP 서버**로 확인합니다.

<details>
<summary><strong>코드 지도와 협업 규칙 펼쳐보기</strong></summary>

| 경로 | 역할 |
| :--- | :--- |
| `index.html` · `html/` · `css/` | 원작 연습 입구 및 확장된 학생용 PC 화면 |
| `html/practice.html` · `html/selectZone.html` | 원작 연습의 보호·비교 기준 |
| `js/vsugang.js` · `js/scenario-settings.js` · `js/hanmoSys.js` | 모드·대기 설정, 가상 404 선택과 페이지 이동 처리 |
| `js/academic/` | 학업·개설 전망·공지·FAQ의 JS/JSDoc 코어·계약·테스트 |
| `js/academic-data-source.js` · `data/academic-source-config.json` | 공개 학사자료 판본 상태 구분과 비활성 기본 연결 설정 |
| `tests/` · `scripts/` | 회귀·보호 기준선·언어 정책·정적 배포 검사 |
| `docs/architecture.md` | **현행 설계의 기준 문서** |

원작 모의신청의 화면·조작, 학생 자료의 브라우저 로컬 경계, 실제 학교 서비스와의 비연동을 유지합니다. 기능 변경은 검증 가능한 범위에서 리뷰받고, 실기기 QA·학교 자료 승인·운영 배포 인수는 코드 병합과 별도로 판정합니다.

[아키텍처](docs/architecture.md) · [기여·에이전트 작업 규칙](AGENTS.md) · [열린 작업과 제안](https://github.com/ot4562-glitch/Hanmo_develop/issues)

</details>

---

<div align="center">

  <p><strong>연습은 한모에서, 학사 결정은 확인된 학교 원문과 함께.</strong></p>

  <p>Based on <a href="https://github.com/dlacked/Hanmo">dlacked/Hanmo</a> ·
    <a href="LICENSE">GNU GPL v3.0</a> ·
    <a href="https://github.com/ot4562-glitch/Hanmo_develop/issues">의견과 오류 제보</a></p>

  <sub>한국외국어대학교의 공식 서비스가 아닌 독립적인 학생 개발 프로젝트입니다.<br>실제 수강신청·학교 계정 로그인·공식 성적 또는 졸업사정을 제공하지 않습니다.</sub>

</div>
