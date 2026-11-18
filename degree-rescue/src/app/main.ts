import {forecastOffering,type ForecastOfferingInput} from '../core/forecast/offering.js';
import {buildAcademicLedger,type AcademicLedgerRequest} from '../core/academics/ledger.js';
import {checkAcademicPlan,type AcademicPlanRequest} from '../core/academics/plan.js';
import {openRequirementIdsFromAudit} from '../core/academics/notice-links.js';
import {ACADEMIC_AUDIT_BRIDGE_KEY,AcademicAuditHintSchema} from '../core/academic-schedule.js';
import {DEMO_FORECAST,DEMO_LEDGER,DEMO_PLAN} from './synthetic-demo.js';

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
/** No transcript, attempts, grades or raw RulePack are transferred between pages. */
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
/** A student-readable explanation, not an institution-approved offering decision.
 * Every input (including a plausible official event) is untrusted JSON in this demo. */
function explainOffering(value:ReturnType<typeof forecastOffering>):void{
  const root=document.getElementById('forecast-summary');
  if(!root)return;
  root.replaceChildren();
  const title=document.createElement('strong');
  title.textContent=value.signal==='HISTORICAL_PATTERN'
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
  disclaimer.textContent='해당 개설 횟수는 미래 개설 확률이 아닙니다. 이 화면의 기본 자료는 가상 예시이며, 사용자가 입력한 관측치와 검증 플래그도 학교의 공인을 의미하지 않습니다.';
  const caveat=document.createElement('p');
  caveat.textContent='판정 근거·주의: '+value.caveat;
  root.append(title,count,disclaimer,caveat);
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
      explainOffering(outlook);
      display(key,{
        source:'HUFS One AI academic forecast core',
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
for(const key of ['forecast','ledger','plan'] as const){
  textarea(key).value=JSON.stringify(defaults[key],null,2);
  if(key==='ledger')textarea(key).addEventListener('input',clearAuditHint);
  document.getElementById(key+'-run')?.addEventListener('click',()=>compute(key));
  document.getElementById(key+'-reset')?.addEventListener('click',()=>{textarea(key).value=JSON.stringify(defaults[key],null,2);compute(key);});
  compute(key);
}
