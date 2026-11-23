// @ts-check
// 학교 서버에 접근하지 않고 현재 탭의 렌더링·입력 후 프레임 대기만 관측합니다.
import {saveReportCard} from './lab-share.mjs';

/** 빈 샘플을 거부하고 정렬된 표본에서 분위수를 보간합니다. */
export function percentile(samples,ratio){
  if(!Array.isArray(samples)||!samples.length||samples.some(v=>!Number.isFinite(v)||v<0)||
     !Number.isFinite(ratio)||ratio<0||ratio>1)throw new RangeError('측정 표본이 올바르지 않습니다.');
  const sorted=[...samples].sort((a,b)=>a-b);
  const position=(sorted.length-1)*ratio;
  const low=Math.floor(position),high=Math.ceil(position);
  return sorted[low]+(sorted[high]-sorted[low])*(position-low);
}

/** 화면 주사율의 영향을 줄이기 위해 실제 관측 중간값 대비 끊김을 계산합니다. */
export function summarizeFrames(samples){
  const median=percentile(samples,0.5);
  const threshold=Math.max(50,median*3);
  return {median,p95:percentile(samples,0.95),threshold,
    interruptions:samples.filter(value=>value>=threshold).length,samples:samples.length};
}

/** 측정값의 불확실성을 숨기지 않고 관측 기반 주의사항을 생성합니다. */
export function findings({frame,longTasks,network}){
  const messages=[];
  if(frame.interruptions>=3)messages.push('화면 갱신이 여러 번 끊겼습니다. 다른 작업을 닫고 다시 검사해 보세요.');
  if(longTasks!==null&&longTasks>=3)messages.push('브라우저가 긴 작업을 반복 처리했습니다.');
  if(network&&network.failures>=2)messages.push('한모 정적 파일 요청에 반복 오류가 있었습니다.');
  if(!messages.length)messages.push('이번 관측에서 뚜렷한 이상을 발견하지 못했습니다.');
  return messages;
}

if(typeof document!=='undefined'){
  const start=document.getElementById('readiness-start');
  if(start){
    const cancel=document.getElementById('readiness-cancel');
    const status=document.getElementById('readiness-status');
    const keyPanel=document.getElementById('readiness-key-panel');
    const keyTarget=document.getElementById('readiness-key-target');
    const keyProgress=document.getElementById('readiness-key-progress');
    const result=document.getElementById('readiness-result');
    const summary=document.getElementById('readiness-summary');
    const frameValue=document.getElementById('readiness-frame-value');
    const keyValue=document.getElementById('readiness-key-value');
    const taskValue=document.getElementById('readiness-task-value');
    const netValue=document.getElementById('readiness-net-value');
    const share=document.getElementById('readiness-share');
    const networkEnabled=document.getElementById('readiness-network');
    let controller=null,interruptionReason='사용자가 진단을 중단했습니다.',shareRows=[];

    function measureFrames(signal){
      return new Promise((resolve,reject)=>{
        const samples=[];
        const initial=performance.now();
        const warmUntil=initial+1000;
        const end=warmUntil+6000;
        let previous=null,frameId=0,longTasks=null,observer=null,finished=false;
        if(typeof PerformanceObserver!=='undefined'&&
           PerformanceObserver.supportedEntryTypes?.includes('longtask')){
          try{
            longTasks=0;
            observer=new PerformanceObserver(list=>{
              for(const entry of list.getEntries())if(entry.startTime>=warmUntil)longTasks++;
            });
            observer.observe({entryTypes:['longtask']});
          }catch{longTasks=null;observer=null;}
        }
        function cleanup(){
          if(finished)return false;
          finished=true;cancelAnimationFrame(frameId);observer?.disconnect();
          signal.removeEventListener('abort',abort);
          return true;
        }
        function abort(){if(cleanup())reject(new Error('측정 중단'));}
        function step(time){
          if(finished)return;
          if(signal.aborted||document.hidden){abort();return;}
          if(previous!==null&&previous>=warmUntil)samples.push(time-previous);
          previous=time;
          if(time>=end){
            if(cleanup()){
              if(samples.length<30)reject(new Error('화면 측정 표본이 부족합니다.'));
              else resolve({frame:summarizeFrames(samples),longTasks});
            }
          }else frameId=requestAnimationFrame(step);
        }
        signal.addEventListener('abort',abort,{once:true});
        frameId=requestAnimationFrame(step);
      });
    }

    function measureKeyboard(signal){
      return new Promise((resolve,reject)=>{
        const measurements=[];
        let pending=false,settled=false;
        const timer=setTimeout(()=>finish(new Error('입력 시간이 초과됐습니다.')),30000);
        function finish(err){
          if(settled)return;
          settled=true;clearTimeout(timer);
          keyTarget.removeEventListener('keydown',onKey);
          signal.removeEventListener('abort',onAbort);
          if(err)reject(err);
          else resolve({median:percentile(measurements,0.5),p95:percentile(measurements,0.95)});
        }
        function onAbort(){finish(new Error('입력 측정 중단'));}
        function onKey(event){
          if(event.code!=='Space'||event.repeat||pending||signal.aborted)return;
          event.preventDefault();
          pending=true;
          const from=performance.now();
          requestAnimationFrame(()=>{
            pending=false;
            if(settled)return;
            measurements.push(Math.max(0,performance.now()-from));
            keyProgress.textContent=measurements.length+' / 10회 입력';
            if(measurements.length===10)finish(null);
          });
        }
        keyTarget.addEventListener('keydown',onKey);
        signal.addEventListener('abort',onAbort,{once:true});
        keyTarget.focus();
      });
    }

    async function measureNetwork(signal){
      const times=[];
      let failures=0;
      for(let index=0;index<7;index++){
        if(signal.aborted)throw new Error('접속 측정 중단');
        const c=new AbortController();
        const onAbort=()=>c.abort();
        signal.addEventListener('abort',onAbort,{once:true});
        const timer=setTimeout(()=>c.abort(),3000);
        const url=new URL('../img/favicon-purple.svg',import.meta.url);
        url.searchParams.set('lab-test',String(index)+'-'+String(Date.now()));
        const from=performance.now();
        try{
          const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:c.signal});
          if(!response.ok)throw new Error('HTTP 요청 실패');
          await response.arrayBuffer();
          times.push(performance.now()-from);
        }catch(error){
          if(signal.aborted)throw error;
          failures++;
        }finally{
          clearTimeout(timer);
          signal.removeEventListener('abort',onAbort);
        }
      }
      return {median:times.length?percentile(times,0.5):null,
        p95:times.length?percentile(times,0.95):null,failures};
    }
    function format(value){return Number(value).toFixed(1)+'ms';}
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden&&controller){
        interruptionReason='탭이 숨겨져 진단을 중단했습니다. 화면을 보면서 다시 측정해 주세요.';
        controller.abort();
      }
    });
    cancel.addEventListener('click',()=>{
      if(controller){interruptionReason='진단을 중단했습니다.';controller.abort();}
    });
    start.addEventListener('click',async()=>{
      if(controller)return;
      controller=new AbortController();
      const signal=controller.signal;
      interruptionReason='진단을 중단했습니다.';
      start.disabled=true;cancel.hidden=false;share.disabled=true;result.hidden=true;
      shareRows=[];
      try{
        if(typeof requestAnimationFrame!=='function')throw new Error('이 브라우저는 화면 프레임 측정을 지원하지 않습니다.');
        status.textContent='화면 반응을 1초 예열하고 6초간 측정합니다. 다른 탭으로 이동하지 마세요.';
        const {frame,longTasks}=await measureFrames(signal);
        if(signal.aborted)throw new Error('진단 중단');
        keyPanel.hidden=false;
        keyProgress.textContent='0 / 10회 입력';
        status.textContent='키보드 입력 반응을 측정합니다. 아래 영역에 포커스하고 Space를 10회 누르세요.';
        const keys=await measureKeyboard(signal);
        keyPanel.hidden=true;
        if(signal.aborted)throw new Error('진단 중단');
        let network=null;
        if(networkEnabled.checked){
          status.textContent='한모의 정적 파일을 7번 요청하고 있습니다. 학교 서버에는 요청하지 않습니다.';
          network=await measureNetwork(signal);
        }
        if(signal.aborted)throw new Error('진단 중단');
        const warnings=findings({frame,longTasks,network});
        summary.textContent=warnings.join(' ');
        frameValue.textContent='중앙값 '+format(frame.median)+' · P95 '+format(frame.p95)+
          ' · 끊김 '+frame.interruptions+'회 ('+frame.samples+'프레임)';
        keyValue.textContent='중앙값 '+format(keys.median)+' · P95 '+format(keys.p95);
        taskValue.textContent=longTasks===null?'이 브라우저에서는 측정 불가':longTasks+'회 (50ms 이상)';
        netValue.textContent=network
          ?(network.median===null?'정상 응답 없음':'중앙값 '+format(network.median)+' · P95 '+format(network.p95))+
            ' · 오류 '+network.failures+'/7회'
          :'사용자 선택으로 실행하지 않음';
        shareRows=[
          '화면 반응: '+frameValue.textContent,
          '입력 후 프레임 대기: '+keyValue.textContent,
          '긴 작업: '+taskValue.textContent,
          '한모 연결: '+netValue.textContent,
          '평가: '+warnings.join(' ').slice(0,55),
        ];
        result.hidden=false;share.disabled=false;
        status.textContent='현재 브라우저 관측을 마쳤습니다. 실제 학교 서버의 성능이나 신청 성공을 보장하지 않습니다.';
      }catch(error){
        status.textContent=signal.aborted?interruptionReason:
          (error instanceof Error?error.message:'진단을 완료하지 못했습니다.');
      }finally{
        controller=null;start.disabled=false;cancel.hidden=true;keyPanel.hidden=true;
      }
    });
    share.addEventListener('click',async()=>{
      if(!shareRows.length)return;
      try{await saveReportCard('PC 준비도 진단 결과',shareRows,'hanmo-readiness.png');}
      catch(error){status.textContent=error instanceof Error?error.message:'결과를 저장하지 못했습니다.';}
    });
  }
}
