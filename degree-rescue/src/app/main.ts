import {forecastOffering,type ForecastOfferingInput} from '../core/forecast/offering.js';
import {buildAcademicLedger,type AcademicLedgerRequest} from '../core/academics/ledger.js';
import {checkAcademicPlan,type AcademicPlanRequest} from '../core/academics/plan.js';
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
const display=(key:Mode,value:unknown):void=>{
  output(key).textContent=JSON.stringify(value,null,2);
};
const fail=(key:Mode,error:unknown):void=>{
  const message=error instanceof Error?error.message:String(error);
  display(key,{status:'INPUT_ERROR',message:'입력·자료·규칙을 확인하세요.',detail:message});
};
function compute(key:Mode):void{
  try{
    const raw=JSON.parse(textarea(key).value);
    if(key==='forecast'){
      const outlook=forecastOffering(raw as ForecastOfferingInput);
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
  }catch(error){fail(key,error);}
}
for(const key of ['forecast','ledger','plan'] as const){
  textarea(key).value=JSON.stringify(defaults[key],null,2);
  document.getElementById(key+'-run')?.addEventListener('click',()=>compute(key));
  document.getElementById(key+'-reset')?.addEventListener('click',()=>{textarea(key).value=JSON.stringify(defaults[key],null,2);compute(key);});
  compute(key);
}
