// @ts-check
// 사용자가 화면 신호 뒤에 눌렀을 때만 유효한 기록을 생성합니다.
import {REACTION_KEY,REACTION_COUNT,profileFromSamples,readProfile} from './reaction-profile.mjs';
const start=document.getElementById('reaction-start');
if(start){
  const target=document.getElementById('reaction-target');
  const status=document.getElementById('reaction-status');
  const tally=document.getElementById('reaction-count');
  const report=document.getElementById('reaction-report');
  const result=document.getElementById('reaction-result');
  const reset=document.getElementById('reaction-reset');
  const p=readProfile(localStorage);
  if(p){report.textContent='사용자님의 반응속도는 중앙값 '+p.medianMs+'ms 입니다.';result.hidden=false;}
  let phase='idle',timer=0,shownAt=0,misses=0;
  const samples=[];
  function stop(message){
    clearTimeout(timer);phase='idle';target.dataset.phase='idle';
    target.disabled=true;start.disabled=false;reset.hidden=true;
    if(message)status.textContent=message;
  }
  function next(){
    if(samples.length===REACTION_COUNT){
      const profile=profileFromSamples(samples);
      try{localStorage.setItem(REACTION_KEY,JSON.stringify(profile));}
      catch{status.textContent='브라우저 저장이 차단돼 전략 실험실에 값을 전달할 수 없습니다.';stop();return;}
      report.textContent='사용자님의 반응속도는 중앙값 '+profile.medianMs+'ms 입니다.';
      result.hidden=false;
      stop();
      status.textContent='';
      return;
    }
    phase='waiting';target.dataset.phase='waiting';
    target.textContent='초록색으로 바뀌면 Space 또는 클릭';tally.textContent=(samples.length+1)+' / '+REACTION_COUNT;
    const delay=900+Math.floor(Math.random()*1400);
    timer=setTimeout(()=>{
      phase='go';shownAt=performance.now();target.dataset.phase='go';
      target.textContent='지금 누르세요!';
    },delay);
  }
  function respond(){
    if(phase==='waiting'){
      misses++;
      clearTimeout(timer);phase='idle';target.dataset.phase='idle';
      status.textContent='너무 빨리 눌렀습니다. '+misses+'번째 오입력 · 재시작 버튼을 누르세요.';
      start.disabled=false;reset.hidden=true;target.disabled=true;
      samples.length=0;tally.textContent='0 / '+REACTION_COUNT;
      return;
    }
    if(phase!=='go')return;
    const ms=Math.round(performance.now()-shownAt);
    if(ms<80||ms>3000){
      samples.length=0;stop('반응시간이 유효 범위를 벗어났습니다. 처음부터 다시 측정하세요.');
      return;
    }
    samples.push(ms);
    status.textContent='최근 반응 '+ms+'ms · 남은 횟수 '+(REACTION_COUNT-samples.length);
    phase='break';target.dataset.phase='break';
    target.textContent=ms+'ms';
    timer=setTimeout(next,350);
  }
  target.addEventListener('click',respond);
  document.addEventListener('keydown',event=>{
    if(event.code==='Space'&&!event.repeat&&(phase==='waiting'||phase==='go')){
      event.preventDefault();respond();
    }
  });
  start.addEventListener('click',()=>{
    samples.length=0;misses=0;result.hidden=true;
    start.disabled=true;target.disabled=false;reset.hidden=false;
    status.textContent='화면 색이 바뀔 때만 누르세요. 빠른 입력은 무효입니다.';
    next();
  });
  reset.addEventListener('click',()=>stop('테스트가 취소되었습니다.'));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&phase!=='idle')stop('탭이 숨겨져 결과를 폐기했습니다. 다시 측정하세요.');
  });
}
