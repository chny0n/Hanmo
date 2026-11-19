// BASIC/TIME/SELECT report. All values come from this browser's practice,
// never from the university system. Preserve the storage keys and 3 decimals.
const $timeBox=document.querySelector('.time');
const $resultBox=document.querySelector('.result');

/** Pure extraction/rounding; TIME mode intentionally has no SELECT portion. */
function readPracticeReport(){
  const preselected=localStorage.getItem('psubjectValue');
  const mode=Number(localStorage.getItem('practiceSetter'));
  const requested=mode===2?0:Number(localStorage.getItem('subjectValue'));
  const waiting=localStorage.getItem('waitingValue')??'no';
  const timeSeconds=Number(localStorage.getItem('TIMEtime')).toFixed(3);
  const selected=Number(localStorage.getItem('SELECTtime'));
  const waited=waiting==='yes'?Number(localStorage.getItem('SELECTWaitTime')):0;
  const selectSeconds=(selected-waited).toFixed(3);
  const totalSeconds=(Math.round((Number(timeSeconds)+Number(selectSeconds))*1000)/1000).toFixed(3);
  return {preselected,requested,waiting,timeSeconds,selectSeconds,totalSeconds};
}

/** Keep the original callable name and report wording for compatibility. */
function timeCheck(){
  const value=readPracticeReport();
  $timeBox.insertAdjacentHTML('afterbegin',
    '<p>연습한 과목 수 '+value.preselected+'개 중 '+value.requested
    +'개 / 접속 대기 여부 '+value.waiting.toUpperCase()+'</p>'
    +'<p>TIME 부분 소요 시간<span>'+value.timeSeconds+'초</span></p>'
    +'<p>SELECT 부분 소요 시간<span>'
    +(value.requested>0?value.selectSeconds:'0.000')+'초</span></p>'
    +'<p class="caption">※ 접속 대기 시간은 소요 시간에 포함하지 않아요.</p>');
  $resultBox.insertAdjacentHTML('afterbegin',
    '<p>총 소요 시간<span>'
    +(value.requested>0?value.totalSeconds:value.timeSeconds)+'초</span></p>');
}
timeCheck();
