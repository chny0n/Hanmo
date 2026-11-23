// @ts-check
// 학교 서버와 무관한 현재 탭·한모 정적 CDN의 관측값만 측정합니다.
import {readProfile} from './reaction-profile.mjs';
export function percentile(samples,ratio){
  if(!Array.isArray(samples)||!samples.length||samples.some(v=>!Number.isFinite(v)||v<0)||
    !Number.isFinite(ratio)||ratio<0||ratio>1)throw new RangeError('측정 표본이 올바르지 않습니다.');
  const a=[...samples].sort((x,y)=>x-y),p=(a.length-1)*ratio,lo=Math.floor(p),hi=Math.ceil(p);
  return a[lo]+(a[hi]-a[lo])*(p-lo);
}
export function summarizeFrames(samples){
  const median=percentile(samples,.5);
  const threshold=Math.max(50,median*3);
  return {median,p95:percentile(samples,.95),threshold,
    interruptions:samples.filter(v=>v>=threshold).length,samples:samples.length};
}
export function networkStats(latencies,downloadSamples,failures){
  const valid=latencies.filter(n=>Number.isFinite(n)&&n>=0);
  const adjacent=valid.slice(1).map((v,i)=>Math.abs(v-valid[i]));
  return {
    median:valid.length?percentile(valid,.5):null,
    p95:valid.length?percentile(valid,.95):null,
    jitter:adjacent.length?percentile(adjacent,.5):null,
    mbps:downloadSamples.length?percentile(downloadSamples,.5):null,
    failures,
  };
}
export function findings({frame,longTasks,network,drift}){
  const result=[];
  if(frame.interruptions>=3)result.push('화면 갱신이 여러 번 끊겼습니다.');
  if(longTasks!==null&&longTasks>=3)result.push('브라우저 긴 작업이 반복되었습니다.');
  if(network&&network.failures>=2)result.push('한모 정적 파일 요청에서 반복 오류가 발생했습니다.');
  if(drift!==null&&drift>=100)result.push('브라우저 타이머가 크게 지연되었습니다.');
  if(!result.length)result.push('이번 관측에서 뚜렷한 이상을 발견하지 못했습니다.');
  return result;
}
const text=(value)=>typeof value==='number'?value.toFixed(1):'측정 불가';
const within95Percent=(value)=>'측정값의 95% 이상이 '+text(value)+'ms 이하';
const guard=(condition,message)=>{if(condition)throw new Error(message);};
async function fetchWithTimeout(url,options,signal){
  const controller=new AbortController();
  const onAbort=()=>controller.abort();
  signal.addEventListener('abort',onAbort,{once:true});
  const timeout=setTimeout(()=>controller.abort(),5000);
  try{
    const from=performance.now();
    const response=await fetch(url,{...options,signal:controller.signal,cache:'no-store',credentials:'omit'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const bytes=options.method==='HEAD'?0:(await response.arrayBuffer()).byteLength;
    return {ms:Math.max(.1,performance.now()-from),bytes};
  }finally{
    clearTimeout(timeout);signal.removeEventListener('abort',onAbort);
  }
}
async function measureNetwork(signal,progress){
  const latency=[],speed=[];let failures=0;
  for(let i=0;i<5;i++){
    guard(signal.aborted,'검사가 중단되었습니다.');
    progress('연결 응답시간 검사 '+(i+1)+'/5');
    const url=new URL('../img/favicon-purple.svg',import.meta.url);
    url.searchParams.set('probe','head-'+i+'-'+Date.now());
    try{latency.push((await fetchWithTimeout(url,{method:'HEAD'},signal)).ms);}
    catch(e){if(signal.aborted)throw e;failures++;}
  }
  for(let i=0;i<2;i++){
    guard(signal.aborted,'검사가 중단되었습니다.');
    progress('다운로드 처리량 검사 '+(i+1)+'/2');
    const url=new URL('../data/network-probe.txt',import.meta.url);
    url.searchParams.set('probe','download-'+i+'-'+Date.now());
    try{
      const r=await fetchWithTimeout(url,{method:'GET'},signal);
      if(r.bytes<100000)throw new Error('시험 파일이 불완전합니다.');
      speed.push(r.bytes*8/(r.ms/1000)/1000000);
    }catch(e){if(signal.aborted)throw e;failures++;}
  }
  return networkStats(latency,speed,failures);
}
function frames(signal){
  return new Promise((resolve,reject)=>{
    const samples=[],drifts=[];
    let last=null,raf=0,observer=null,longTasks=null,finished=false;
    const start=performance.now(),warm=start+500,end=warm+3000;
    let intended=start+100;
    const loop=setInterval(()=>{
      const actual=performance.now();
      if(actual>=warm)drifts.push(Math.max(0,actual-intended));
      intended=actual+100;
    },100);
    if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      try{
        longTasks=0;
        observer=new PerformanceObserver(list=>{
          for(const item of list.getEntries())if(item.startTime>=warm)longTasks++;
        });
        observer.observe({entryTypes:['longtask']});
      }catch{longTasks=null;}
    }
    function cleanup(){
      if(finished)return false;
      finished=true;cancelAnimationFrame(raf);clearInterval(loop);
      observer?.disconnect();signal.removeEventListener('abort',abort);
      return true;
    }
    function abort(){if(cleanup())reject(new Error('화면 검사 중단'));}
    function sample(time){
      if(finished)return;
      if(signal.aborted||document.hidden){abort();return;}
      if(last!==null&&last>=warm)samples.push(time-last);
      last=time;
      if(time>=end){
        if(cleanup()){
          if(samples.length<25)reject(new Error('유효한 프레임 표본이 부족합니다.'));
          else resolve({frame:summarizeFrames(samples),longTasks,
            drift:drifts.length?percentile(drifts,.95):null});
        }
      }else raf=requestAnimationFrame(sample);
    }
    signal.addEventListener('abort',abort,{once:true});
    raf=requestAnimationFrame(sample);
  });
}
if(typeof document!=='undefined'){
  const start=document.getElementById('readiness-start');
  if(start){
    const cancel=document.getElementById('readiness-cancel');
    const status=document.getElementById('readiness-status');
    const result=document.getElementById('readiness-result');
    const inputs=document.getElementById('readiness-input');
    const summary=document.getElementById('readiness-summary');
    const networkEnabled=document.getElementById('readiness-network');
    const redo=document.getElementById('readiness-back');
    let controller=null,interruption='진단이 취소되었습니다.';
    const value=(id,content)=>{document.getElementById(id).textContent=content;};
    const abort=(reason)=>{if(controller){interruption=reason;controller.abort();}};
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)abort('탭이 숨겨져 측정이 중단되었습니다.');
    });
    cancel.addEventListener('click',()=>abort('사용자가 진단을 취소했습니다.'));
    redo.addEventListener('click',()=>{result.hidden=true;inputs.hidden=false;});
    start.addEventListener('click',async()=>{
      if(controller)return;
      controller=new AbortController();const signal=controller.signal;
      start.disabled=true;cancel.hidden=false;interruption='진단이 취소되었습니다.';
      try{
        guard(!('requestAnimationFrame' in window),'프레임 측정을 지원하지 않는 브라우저입니다.');
        status.textContent='현재 화면의 프레임과 이벤트 루프를 3초간 관측합니다.';
        const {frame,longTasks,drift}=await frames(signal);
        let network=null;
        if(networkEnabled.checked)network=await measureNetwork(signal,message=>{status.textContent=message;});
        guard(signal.aborted,'진단 취소');
        const alerts=findings({frame,longTasks,network,drift});
        summary.textContent=alerts.join(' ');
        value('readiness-frame-value','중앙값 '+text(frame.median)+'ms · '+within95Percent(frame.p95)+' · 끊김 '+frame.interruptions+'회');
        value('readiness-task-value',longTasks===null?'지원되지 않음':longTasks+'회 (50ms 이상)');
        value('readiness-drift-value',drift===null?'측정 불가':within95Percent(drift));
        value('readiness-latency-value',network?.median===null||!network?'미측정':'중앙값 '+text(network.median)+'ms · '+within95Percent(network.p95));
        value('readiness-jitter-value',network?.jitter===null||!network?'미측정':text(network.jitter)+'ms');
        value('readiness-speed-value',network?.mbps===null||!network?'미측정':text(network.mbps)+'Mbps (한모 CDN 한정)');
        value('readiness-error-value',network?network.failures+'/7회':'미측정');
        const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
        value('readiness-connection-value',connection?.effectiveType??'브라우저 미지원');
        value('readiness-threads-value',
          navigator.hardwareConcurrency?navigator.hardwareConcurrency+' 논리 코어':'브라우저 미지원');
        value('readiness-memory-value',
          navigator.deviceMemory?navigator.deviceMemory+'GB (대략값)':'브라우저 미지원');
        const profile=readProfile();
        value('readiness-reaction-value',profile?profile.medianMs+'ms (반응 테스트에서 읽음)':'미측정 · 반응 테스트 이용');
        result.hidden=false;inputs.hidden=true;
        status.textContent='완료 · 본 결과는 브라우저 및 한모 정적 배포 서버에 대한 관측값입니다.';
      }catch(error){
        status.textContent=signal.aborted?interruption:
          (error instanceof Error?error.message:'진단 오류');
      }finally{
        controller=null;start.disabled=false;cancel.hidden=true;
      }
    });
  }
}
