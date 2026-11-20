import {forecastOffering} from '../core/forecast/offering.js';
import {studentForecastInput} from '../views/forecast-student-input.js';
import {DEMO_FORECAST} from './synthetic-demo.js';
const form=document.getElementById('forecast-form');
const course=document.getElementById('forecast-course-id');
const year=document.getElementById('forecast-year');
const semester=document.getElementById('forecast-semester');
const response=document.getElementById('forecast-response');
const status=document.getElementById('forecast-status');
const example=document.getElementById('forecast-example');
if(!(form instanceof HTMLFormElement)||!(course instanceof HTMLInputElement)
  ||!(year instanceof HTMLInputElement)||!(semester instanceof HTMLSelectElement)
  ||!(response instanceof HTMLElement)||!(status instanceof HTMLElement)
  ||!(example instanceof HTMLButtonElement)){
  throw new Error('학생용 강의 전망 화면이 불완전합니다.');
}
function p(message:string):HTMLParagraphElement{
  const n=document.createElement('p');n.textContent=message;return n;
}
function render(title:string,detail:string,sub:string,notice:string):void{
  const heading=document.createElement('h3');heading.textContent=title;
  response.replaceChildren(heading,p(detail),p(sub));
  status.textContent=notice;
}
const kstParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'numeric'})
  .formatToParts(new Date());
const yyyy=Number(kstParts.find(x=>x.type==='year')?.value);
const mm=Number(kstParts.find(x=>x.type==='month')?.value);
if(Number.isSafeInteger(yyyy)&&Number.isSafeInteger(mm)){
  year.value=String(mm>=9?yyyy+1:yyyy);
  semester.value=mm>=3&&mm<9?'2':'1';
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  try{
    const input=studentForecastInput({
      courseId:course.value,year:Number(year.value),semester:semester.value,asOf:new Date().toISOString(),
    });
    const result=forecastOffering(input);
    render('현재 개설 여부는 확인이 필요합니다.',
      '과목 '+result.courseId+' · '+result.targetTerm+'학기 · 공식 검수된 개설 근거 없음',
      '실제 강의 목록이 연결되지 않아 개설/미개설을 판단하지 않습니다. 학교 수강편람의 최신 자료를 확인하세요.',
      '공식 자료 미연결 · UNKNOWN');
  }catch(error){
    render('입력 내용을 확인해 주세요.',error instanceof Error?error.message:String(error),
      '학수번호와 학년·학기를 다시 입력해 주세요.','입력 확인 필요');
  }
});
example.addEventListener('click',()=>{
  const result=forecastOffering(DEMO_FORECAST);
  render('가상 개설 관측 예시입니다.',
    '가상 과목 '+result.courseId+' · '+result.targetTerm+'학기 · 같은 계절 '+result.sameSeasonObservedTerms+
      '개 학기 중 개설 '+result.sameSeasonOfferedTerms+'개 학기',
    '모두 합성 관측입니다. 과거 개설 횟수는 확률이나 미래 개설 보장이 아닙니다.',
    '가상 데이터 예시 · 실제 수강신청과 무관');
});
