import {forecastOffering,type ForecastOfferingInput} from '../core/forecast/offering.js';
import {buildAcademicLedger,type AcademicLedgerRequest} from '../core/academics/ledger.js';
import {checkAcademicPlan,type AcademicPlanRequest} from '../core/academics/plan.js';
import {openRequirementIdsFromAudit} from '../core/academics/notice-links.js';
import {ACADEMIC_AUDIT_BRIDGE_KEY,AcademicAuditHintSchema} from '../core/academic-schedule.js';
import {DEMO_FORECAST,DEMO_LEDGER,DEMO_PLAN} from './synthetic-demo.js';
import {studentForecastInput} from '../views/forecast-student-input.js';

type Mode='forecast'|'ledger'|'plan';
const defaults:Record<Mode,unknown>={forecast:DEMO_FORECAST,ledger:DEMO_LEDGER,plan:DEMO_PLAN};
const textarea=(key:Mode):HTMLTextAreaElement=>{
  const el=document.getElementById(key+'-input');
  if(!(el instanceof HTMLTextAreaElement))throw new Error('입력 창을 찾지 못했습니다.');
  return el;
};
const output=(key:Mode):HTMLElement=>{
  const el=document.getElementById(key+'-result');
  if(!el)throw new Error('결과 창을 찾지 못했습니다.');
  return el;
};
/** 페이지 사이에 성적표 원본·수강 시도·성적·원시 RulePack을 전송하지 않는다. */
function clearAuditHint():void{
  try{sessionStorage.removeItem(ACADEMIC_AUDIT_BRIDGE_KEY);}catch{/* storage disabled */}
}
function publishAuditHint(audit:ReturnType<typeof buildAcademicLedger>):void{
  clearAuditHint();
  const hint=AcademicAuditHintSchema.parse({
    schemaVersion:1,origin:'LOCAL_CALCULATOR',generatedAt:new Date().toISOString(),
    asOf:audit.asOf,rulePackVersion:audit.rulePackVersion,state:audit.state,
    candidateOpenRequirementIds:openRequirementIdsFromAudit(audit),
  });
  try{sessionStorage.setItem(ACADEMIC_AUDIT_BRIDGE_KEY,JSON.stringify(hint));}
  catch{/* storage disabled: calculator remains usable */}
}
const display=(key:Mode,value:unknown):void=>{
  output(key).textContent=JSON.stringify(value,null,2);
};
/**
 * 학생을 위한 설명이지 학교가 승인한 개설 결정은 아니다.
 * 공식 사건처럼 보이는 값을 포함해 이 시연의 모든 입력 JSON은 검증되지 않은 자료다.
 */
type ForecastSource='STUDENT'|'DEMO'|'RAW';
function explainOffering(value:ReturnType<typeof forecastOffering>,source:ForecastSource):void{
  const root=document.getElementById('forecast-summary');
  if(!root)return;
  root.replaceChildren();
  const title=document.createElement('strong');
  title.textContent=source==='STUDENT'
    ?'현재 검증된 개설 자료가 없어 전망을 보류합니다.'
    :value.signal==='HISTORICAL_PATTERN'
    ?'과거 관측에서 반복 개설 신호가 있습니다.'
    :value.signal==='CONFIRMED_OFFERED'
    ?'입력 자료상 개설 신호가 있습니다. 공식 원문 확인이 필요합니다.'
    :value.signal==='CONFIRMED_NOT_OFFERED'
    ?'입력 자료상 미개설 신호가 있습니다. 공식 원문 확인이 필요합니다.'
    :'개설 전망을 보류하거나 추가 확인이 필요합니다.';
  const count=document.createElement('p');
  count.textContent='대상 '+value.targetTerm+' · 과목 '+value.courseId+
    ' · 같은 계절 관측 '+value.sameSeasonObservedTerms+'개 학기 중 개설 '+value.sameSeasonOfferedTerms+'개 학기';
  const disclaimer=document.createElement('p');
  disclaimer.textContent=source==='STUDENT'
    ?'학교의 공식 개설 원장과 학수번호 동일성 검증이 연결되지 않았습니다. 과거 정보가 없다고 해서 미개설인 것은 아니며, 이 입력만으로 개설 여부를 예측하지 않습니다.'
    :source==='DEMO'
    ?'모든 개설 관측과 출처는 가상 데이터입니다. 과거 횟수는 미래 개설 확률이 아니고 실제 과목의 개설을 보장하지 않습니다.'
    :'개발자가 직접 입력한 관측치 및 검증 플래그는 학교의 공식 승인 자료가 아닙니다. 과거 횟수는 미래 개설 확률을 뜻하지 않습니다.';
  const caveat=document.createElement('p');
  caveat.textContent='판정 근거·주의: '+value.caveat;
  root.append(title,count,disclaimer,caveat);
}

function setForecastSource(source:ForecastSource):void{
  const status=document.getElementById('forecast-data-status');
  if(status)status.textContent=source==='STUDENT'
    ?'직접 입력 · 학교 공식 개설 원장 미연결 · 실제 개설 여부는 판단할 수 없습니다.'
    :source==='DEMO'
    ?'가상 예시 · 실제 강의 개설과 무관하며 모든 관측이 합성 자료입니다.'
    :'개발자 직접 입력 · 공식 검수되지 않은 자료입니다.';
}
const fail=(key:Mode,error:unknown):void=>{
  if(key==='forecast'){
    const root=document.getElementById('forecast-summary');
    if(root)root.textContent='전망 계산에 실패했습니다. 입력 형식과 근거를 확인하세요.';
  }
  const message=error instanceof Error?error.message:String(error);
  display(key,{status:'INPUT_ERROR',message:'입력·자료·규칙을 확인하세요.',detail:message});
};
function compute(key:Mode):void{
  try{
    const raw=JSON.parse(textarea(key).value);
    if(key==='forecast'){
      const outlook=forecastOffering(raw as ForecastOfferingInput);
      explainOffering(outlook,'RAW');
      setForecastSource('RAW');
      display(key,{
        source:'Developer-supplied, not school-verified',
        disclaimer:'과거 개설 빈도는 미래 개설 확률이 아닙니다. 공식 확정 정보와 구별하세요.',
        courseId:outlook.courseId,targetTerm:outlook.targetTerm,
        signal:outlook.signal,
        sameSeasonOfferedTerms:outlook.sameSeasonOfferedTerms,
        sameSeasonObservedTerms:outlook.sameSeasonObservedTerms,
        observations:outlook.observations,evidenceRefs:outlook.evidenceRefs,caveat:outlook.caveat
      });
    } else if(key==='ledger'){
      const audit=buildAcademicLedger(raw as AcademicLedgerRequest);
      publishAuditHint(audit);
      display(key,{
        disclaimer:'합성 시연에 표시된 APPROVED는 학교 승인이 아닙니다. 공식 졸업 판정이 아닙니다.',
        state:audit.state,rulePackVersion:audit.rulePackVersion,
        earnedCredits:audit.earnedCreditUnits/2,
        inProgressCredits:audit.inProgressCreditUnits/2,
        plannedCredits:audit.plannedCreditUnits/2,
        requirements:audit.requirements,
        caveats:audit.caveats
      });
    } else {
      const check=checkAcademicPlan(raw as AcademicPlanRequest);
      display(key,{
        disclaimer:'모의 수강계획 검사입니다. 개설·시간표·졸업의 확정 판정이 아닙니다.',
        state:check.audit.state,termLoadCredits:check.termLoadCreditUnits/2,
        planIssues:check.audit.planIssues,
        caveats:check.audit.caveats
      });
    }
  }catch(error){if(key==='ledger')clearAuditHint();fail(key,error);}
}
for(const key of ['ledger','plan'] as const){
  textarea(key).value=JSON.stringify(defaults[key],null,2);
  if(key==='ledger')textarea(key).addEventListener('input',clearAuditHint);
  document.getElementById(key+'-run')?.addEventListener('click',()=>compute(key));
  document.getElementById(key+'-reset')?.addEventListener('click',()=>{textarea(key).value=JSON.stringify(defaults[key],null,2);compute(key);});
  compute(key);
}

// 일반 이용자: 학수번호·학기만 입력하고, 실제 학사 데이터가 연결되지 않으면 UNKNOWN을 유지한다.
const forecastForm=document.getElementById('forecast-form');
const courseField=document.getElementById('forecast-course-id');
const yearField=document.getElementById('forecast-year');
const semesterField=document.getElementById('forecast-semester');
if(!(forecastForm instanceof HTMLFormElement)
  ||!(courseField instanceof HTMLInputElement)
  ||!(yearField instanceof HTMLInputElement)
  ||!(semesterField instanceof HTMLSelectElement)){
  throw new Error('강의 전망 입력 폼을 찾지 못했습니다.');
}
const kstParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric'})
  .formatToParts(new Date());
const kstYear=Number(kstParts.find(part=>part.type==='year')?.value);
const kstMonth=Number(kstParts.find(part=>part.type==='month')?.value);
if(Number.isSafeInteger(kstYear)&&Number.isSafeInteger(kstMonth)){
  yearField.value=String(kstMonth>=9?kstYear+1:kstYear);
  semesterField.value=kstMonth>=3&&kstMonth<9?'2':'1';
}
forecastForm.addEventListener('input',()=>{
  const summary=document.getElementById('forecast-summary');
  if(summary)summary.textContent='입력 내용이 변경됐습니다. ‘개설 전망 확인’을 누르면 새 조건을 확인합니다.';
  const status=document.getElementById('forecast-data-status');
  if(status)status.textContent='학교 공식 개설 원장 미연결 · 실제 강의 개설 정보는 확인되지 않았습니다.';
});
forecastForm.addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const request=studentForecastInput({
      courseId:courseField.value,year:Number(yearField.value),semester:semesterField.value,
      asOf:new Date().toISOString(),
    });
    const outlook=forecastOffering(request);
    explainOffering(outlook,'STUDENT');
    setForecastSource('STUDENT');
    display('forecast',{source:'Student entry, no reviewed academic evidence',
      courseId:outlook.courseId,targetTerm:outlook.targetTerm,signal:outlook.signal,
      sameSeasonObservedTerms:outlook.sameSeasonObservedTerms,evidenceRefs:outlook.evidenceRefs,
      caveat:outlook.caveat});
  }catch(error){
    const summary=document.getElementById('forecast-summary');
    if(summary)summary.textContent='입력 내용을 확인해 주세요. '+(error instanceof Error?error.message:String(error));
    const status=document.getElementById('forecast-data-status');
    if(status)status.textContent='입력한 학수번호와 학년·학기를 확인해 주세요.';
  }
});
document.getElementById('forecast-reset')?.addEventListener('click',()=>{
  courseField.value=DEMO_FORECAST.courseId;
  yearField.value=DEMO_FORECAST.targetTerm.slice(0,4);
  semesterField.value=DEMO_FORECAST.targetTerm.slice(-1);
  const outlook=forecastOffering(DEMO_FORECAST);
  explainOffering(outlook,'DEMO');
  setForecastSource('DEMO');
  display('forecast',{source:'SYNTHETIC EXAMPLE ONLY',outlook});
});

// 원시 입력과 상세 JSON 결과는 기본 화면에서 보이지 않는 개발자 도구로만 제공한다.
textarea('forecast').value=JSON.stringify(DEMO_FORECAST,null,2);
document.getElementById('forecast-json-run')?.addEventListener('click',()=>compute('forecast'));
document.getElementById('forecast-json-reset')?.addEventListener('click',()=>{
  textarea('forecast').value=JSON.stringify(DEMO_FORECAST,null,2);
  compute('forecast');
});
