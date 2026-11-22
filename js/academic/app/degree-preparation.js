// @ts-check
import {calculateDegreeCredits,cohortBand,graduationGuidance,CREDIT_AREAS} from '../core/academics/degree-credit.js';
const PROFILE_KEY='hanmo:student-planner:profile:v1';
const CREDITS_KEY='hanmo:degree-preparation:credits:v1';
/** @param {string} id @returns {HTMLElement} */
function get(id){
  const node=document.getElementById(id);
  if(!node)throw new Error('졸업 준비 화면이 누락되었습니다: '+id);
  return node;
}
/** @param {string} id @returns {HTMLInputElement|HTMLSelectElement} */
function field(id){
  const n=get(id);
  if(!(n instanceof HTMLInputElement)&&!(n instanceof HTMLSelectElement))
    throw new Error('입력란을 확인할 수 없습니다: '+id);
  return n;
}
/** @param {string} value @returns {HTMLElement} */
function text(value){const n=document.createElement('span');n.textContent=value;return n;}
const campus=field('degree-campus'),year=field('degree-cohort');
const kind=field('degree-kind'),major=field('degree-major'),secondary=field('degree-secondary');
const creditForm=get('degree-credit-form'),results=get('degree-results');
const warnings=get('degree-warnings'),guidance=get('degree-guidance');
const notice=get('degree-credit-message'),contextMessage=get('degree-context-message');
const official=get('degree-official-note');
const currentKstYear=Number(new Intl.DateTimeFormat('en',{timeZone:'Asia/Seoul',year:'numeric'})
  .format(new Date()));
if(year instanceof HTMLInputElement)year.max=String(currentKstYear+1);
/** @returns {Record<string,unknown>|null} */
function profile(){
  try{
    const raw=localStorage.getItem(PROFILE_KEY);
    if(!raw||raw.length>4096)return null;
    const value=JSON.parse(raw);
    return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
  }catch{return null;}
}
function syncContext(){
  const p=profile();
  campus.value=p?.campus==='SEOUL'||p?.campus==='GLOBAL'?String(p.campus):'SEOUL';
  kind.value=p?.secondaryKind==='DOUBLE'||p?.secondaryKind==='MINOR'?String(p.secondaryKind):'NONE';
  major.value=typeof p?.major==='string'?p.major:'';
  secondary.value=kind.value==='MINOR'&&typeof p?.minor==='string'?p.minor:
    kind.value==='DOUBLE'&&typeof p?.doubleMajor==='string'?p.doubleMajor:'';
  year.value=Number.isSafeInteger(p?.cohort)&&Number(p.cohort)<=currentKstYear+1
    ?String(p.cohort):'';
  contextMessage.textContent=p?'내정보에서 불러온 값입니다. 여기서 수정한 값은 졸업 준비 화면에만 적용됩니다.':
    '내정보가 없습니다. 이 화면에서 선택하거나 내정보 메뉴에 먼저 저장해 주세요.';
  refreshContext();
}
function refreshContext(){
  secondary.disabled=kind.value==='NONE';
  if(kind.value==='NONE')secondary.value='';
  get('degree-secondary-label').hidden=kind.value==='NONE';
  const cohort=Number(year.value);
  get('degree-band').textContent=year.value&&Number.isSafeInteger(cohort)&&cohort>=2010&&cohort<=currentKstYear+1
    ?(cohortBand(cohort)==='TO_2024'?'~24학번':'25학번~'):'학번 확인 필요';
  const kindNames={NONE:'전공심화·단일전공',DOUBLE:'이중전공',MINOR:'부전공'};
  get('degree-context-summary').textContent=
    (campus.value==='GLOBAL'?'글로벌캠퍼스':'서울캠퍼스')+' · '+
    (major.value.trim()||'주전공 미설정')+' · '+(kindNames[kind.value]||'전공 형태 확인 필요');
  renderGuidance();
  try{renderCredits();}catch{/* 입력 중에는 오류 안내를 갱신한다. */}
}
function renderGuidance(){
  guidance.replaceChildren();
  const cohort=Number(year.value);
  const validYear=Number.isSafeInteger(cohort)&&cohort>=2010&&cohort<=currentKstYear+1;
  official.textContent='학교 공식 자료는 학번·학과·캠퍼스·전공 형태에 따라 달라질 수 있습니다. 확인된 규정표가 없으므로 충족 여부 및 시험·점수를 자동 판정하지 않습니다.';
  const entries=graduationGuidance({
    campus:campus.value,major:major.value.trim(),
    secondaryKind:/** @type {import('../core/academics/degree-credit.js').DegreeKind} */ (kind.value),
    secondary:secondary.value.trim(),cohort:validYear?cohort:null
  });
  for(const entry of entries){
    const item=document.createElement('article');
    item.className='degree-requirement';
    const h=document.createElement('h3');h.textContent=entry.scope+' · '+entry.title;
    const row=document.createElement('p');
    row.textContent='확인 필요 · 검수된 적용 기준 및 확인일 없음';
    const a=document.createElement('a');
    a.href=entry.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
    a.textContent='학교 학사종합지원센터에서 확인';
    item.append(h,row,a);guidance.append(item);
  }
}
/** @returns {{earned:Record<import('../core/academics/degree-credit.js').CreditArea,string>,targets:Record<import('../core/academics/degree-credit.js').CreditArea,string>}} */
function readInputs(){
  /** @type {Record<import('../core/academics/degree-credit.js').CreditArea,string>} */
  const earned={general:'',primary:'',secondary:'',other:'',total:''};
  /** @type {Record<import('../core/academics/degree-credit.js').CreditArea,string>} */
  const targets={general:'',primary:'',secondary:'',other:'',total:''};
  for(const area of CREDIT_AREAS){
    earned[area]=field('degree-earned-'+area).value;
    targets[area]=field('degree-target-'+area).value;
  }
  return {earned,targets};
}
/** @param {string} value @returns {HTMLElement} */
function listText(value){const el=document.createElement('p');el.textContent=value;return el;}
function renderCredits(){
  results.replaceChildren();warnings.replaceChildren();
  const input=readInputs();
  const calculation=calculateDegreeCredits({...input,
    kind:/** @type {import('../core/academics/degree-credit.js').DegreeKind} */ (kind.value)});
  for(const metric of calculation.metrics){
    const row=document.createElement('div');row.className='degree-credit-row';
    const header=document.createElement('div');header.className='degree-credit-head';
    header.append(text(metric.label));
    const result=metric.target===null?'목표 학점 확인 필요':
      metric.earned+'/'+metric.target+'학점 · '+metric.remaining+'학점 남음'+
      (metric.excess>0?' · '+metric.excess+'학점 초과':'');
    header.append(text(result));
    const track=document.createElement('div');track.className='hanmo-progress-track';
    const fill=document.createElement('div');fill.className='hanmo-progress-fill';
    fill.style.width=(metric.ratio??0)+'%';track.append(fill);
    row.append(header,track);results.append(row);
  }
  for(const warning of calculation.warnings)warnings.append(listText(warning));
  if(!calculation.warnings.length)warnings.append(listText('입력한 학점은 참고용이며 학교의 공식 이수·인정 결과가 아닙니다.'));
}
function saveCredits(){
  const value={version:1,savedAt:new Date().toISOString(),...readInputs()};
  try{
    localStorage.setItem(CREDITS_KEY,JSON.stringify(value));
    notice.textContent='이 브라우저에 학점 입력을 저장했습니다. 학교 서버로 전송하지 않습니다.';
  }catch{notice.textContent='저장할 수 없습니다. 브라우저 저장 설정을 확인해 주세요.';}
}
function restoreCredits(){
  try{
    const raw=localStorage.getItem(CREDITS_KEY);
    if(!raw||raw.length>8192)return;
    const parsed=JSON.parse(raw);
    if(parsed?.version!==1||!parsed.earned||!parsed.targets)return;
    for(const area of CREDIT_AREAS){
      const e=parsed.earned[area],t=parsed.targets[area];
      if(typeof e==='string'&&/^\d{0,3}(?:\.5)?$/.test(e))field('degree-earned-'+area).value=e;
      if(typeof t==='string'&&/^\d{0,3}(?:\.5)?$/.test(t))field('degree-target-'+area).value=t;
    }
    notice.textContent='이 브라우저에 저장한 학점 값을 불러왔습니다.';
  }catch{notice.textContent='저장된 학점 입력을 읽을 수 없어 빈 값으로 시작합니다.';}
}
/** @param {'credits'|'requirements'} name */
function chooseTab(name){
  for(const tab of document.querySelectorAll('[data-degree-tab]')){
    const selected=tab.getAttribute('data-degree-tab')===name;
    tab.setAttribute('aria-selected',selected?'true':'false');
    tab.tabIndex=selected?0:-1;
  }
  get('degree-credits-panel').hidden=name!=='credits';
  get('degree-requirements-panel').hidden=name!=='requirements';
}
for(const tab of document.querySelectorAll('[data-degree-tab]')){
  tab.addEventListener('click',()=>chooseTab(
    tab.getAttribute('data-degree-tab')==='requirements'?'requirements':'credits'));
}
for(const control of [campus,year,kind,major,secondary]){
  control.addEventListener('change',refreshContext);
  control.addEventListener('input',refreshContext);
}
get('degree-reload-profile').addEventListener('click',syncContext);
creditForm.addEventListener('input',()=>{
  try{renderCredits();notice.textContent='저장하려면 「이 브라우저에 저장」을 선택하세요.';}
  catch(error){notice.textContent=error instanceof Error?error.message:String(error);}
});
creditForm.addEventListener('submit',event=>{
  event.preventDefault();
  try{renderCredits();saveCredits();}
  catch(error){notice.textContent=error instanceof Error?error.message:String(error);}
});
get('degree-credit-clear').addEventListener('click',()=>{
  try{localStorage.removeItem(CREDITS_KEY);}catch{/* 브라우저 저장 거부 */}
  for(const area of CREDIT_AREAS){
    field('degree-earned-'+area).value='';
    field('degree-target-'+area).value='';
  }
  notice.textContent='저장한 학점 입력을 삭제했습니다.';
  renderCredits();
});
window.addEventListener('storage',event=>{
  if(event.key===PROFILE_KEY)syncContext();
});
syncContext();restoreCredits();renderCredits();
chooseTab(new URL(location.href).searchParams.get('tab')==='requirements'?'requirements':'credits');
