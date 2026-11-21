// @ts-check
import {forecastOffering} from '../core/forecast/offering.js';
import {studentForecastInput} from '../views/forecast-student-input.js';

/** @typedef {'NOT_CONNECTED'|'EMPTY'|'READY'|'OFFLINE'|'INVALID'} PublicStatus */
/** @typedef {{load:()=>Promise<{status:PublicStatus}>}} DataAdapter */
const dataSource=(/** @type {typeof globalThis & {HanmoAcademicData?:DataAdapter}} */ (globalThis)).HanmoAcademicData;

function forecastControls(){
  const form=document.getElementById('forecast-form');
  const course=document.getElementById('forecast-course-id');
  const year=document.getElementById('forecast-year');
  const semester=document.getElementById('forecast-semester');
  const response=document.getElementById('forecast-response');
  const status=document.getElementById('forecast-status');
  const retry=document.getElementById('forecast-retry');
  if(!(form instanceof HTMLFormElement)||!(course instanceof HTMLInputElement)
    ||!(year instanceof HTMLInputElement)||!(semester instanceof HTMLSelectElement)
    ||!(response instanceof HTMLElement)||!(status instanceof HTMLElement)
    ||!(retry instanceof HTMLButtonElement)){
    throw new Error('학생용 강의 전망 화면이 불완전합니다.');
  }
  return {form,course,year,semester,response,status,retry};
}
const {form,course,year,semester,response,status,retry}=forecastControls();

/** @param {string} title @param {string} detail */
function render(title,detail){
  const heading=document.createElement('h3');
  heading.textContent=title;
  const message=document.createElement('p');
  message.textContent=detail;
  response.replaceChildren(heading,message);
  response.hidden=false;
}
/** @type {Record<PublicStatus,string>} */
const labels={
  NOT_CONNECTED:'개설 자료 미연결',
  EMPTY:'승인된 개설 자료 없음',
  READY:'강좌 자료 연결됨 · 개설 근거 확인 필요',
  OFFLINE:'자료 서버 연결 실패',
  INVALID:'자료 판본·유효기간 검증 실패'
};
const kstParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric'})
  .formatToParts(new Date());
const yyyy=Number(kstParts.find(x=>x.type==='year')?.value);
const mm=Number(kstParts.find(x=>x.type==='month')?.value);
if(Number.isSafeInteger(yyyy)&&Number.isSafeInteger(mm)){
  year.value=String(mm>=9?yyyy+1:yyyy);
  semester.value=mm>=3&&mm<9?'2':'1';
}
/** @returns {Promise<void>} 승인된 공개 자료의 연결 여부 재검사 */
async function refresh(){
  if(retry.disabled)return;
  retry.disabled=true;
  response.hidden=true;
  status.textContent='개설 자료 연결 확인 중';
  try{
    const result=await dataSource?.load();
    status.textContent=result?(labels[result.status]??labels.INVALID):labels.OFFLINE;
  }catch{
    status.textContent=labels.OFFLINE;
  }finally{retry.disabled=false;}
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const input=studentForecastInput({
      courseId:course.value,
      year:Number(year.value),
      semester:semester.value,
      asOf:new Date().toISOString()
    });
    const outcome=forecastOffering(input);
    render('개설 여부 확인 필요',outcome.courseId+' · '+outcome.targetTerm);
  }catch(error){
    render('입력 확인',error instanceof Error?error.message:String(error));
  }
});
retry.addEventListener('click',()=>{void refresh();});
void refresh();
