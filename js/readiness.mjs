// @ts-check
// 학교 서버와 무관한 현재 탭·한모 정적 CDN의 관측값만 측정합니다.
const HEAD_REQUESTS=5;
const DOWNLOAD_REQUESTS=2;
function orderedSamples(samples){
  if(!Array.isArray(samples)||!samples.length||samples.some(v=>!Number.isFinite(v)||v<0))
    throw new RangeError('측정 표본이 올바르지 않습니다.');
  return [...samples].sort((a,b)=>a-b);
}
function interpolate(sorted,ratio){
  const position=(sorted.length-1)*ratio,low=Math.floor(position),high=Math.ceil(position);
  return sorted[low]+(sorted[high]-sorted[low])*(position-low);
}
export function percentile(samples,ratio){
  if(!Number.isFinite(ratio)||ratio<0||ratio>1)throw new RangeError('측정 표본이 올바르지 않습니다.');
  return interpolate(orderedSamples(samples),ratio);
}
export function summarizeFrames(samples){
  const sorted=orderedSamples(samples);
  const median=interpolate(sorted,.5);
  const threshold=Math.max(50,median*3);
  return {median,p95:interpolate(sorted,.95),threshold,
    interruptions:samples.filter(v=>v>=threshold).length,samples:samples.length};
}
export function networkStats(latencies,downloadSamples,failures){
  const valid=latencies.filter(Number.isFinite);
  const adjacent=[];
  for(let i=1;i<latencies.length;i++){
    if(Number.isFinite(latencies[i-1])&&Number.isFinite(latencies[i])){
      adjacent.push(Math.abs(latencies[i]-latencies[i-1]));
    }
  }
  return {
    median:valid.length?percentile(valid,.5):null,
    jitter:adjacent.length?percentile(adjacent,.5):null,
    mbps:downloadSamples.length?percentile(downloadSamples,.5):null,
    failures,latencyCount:valid.length,jitterCount:adjacent.length,downloadCount:downloadSamples.length,
    excluded:latencies.length+DOWNLOAD_REQUESTS-valid.length-downloadSamples.length-failures,
  };
}
/** @typedef {'A'|'B'|'C'|'D'|'F'} ReadinessGrade */
/** @typedef {{grade:ReadinessGrade|null,note:string}} GradeResult */
/** @type {ReadinessGrade[]} */
const GRADES=['A','B','C','D','F'];
const GRADE_LABELS={A:'매우 양호',B:'양호',C:'보통',D:'개선 권장',F:'불량'};
/** @param {number|null|undefined} value @param {number[]} limits @param {boolean} [higher] @returns {ReadinessGrade|null} */
function thresholdGrade(value,limits,higher=false){
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)return null;
  const index=limits.findIndex(limit=>higher?value>=limit:value<=limit);
  return GRADES[index<0?4:index];
}
/**
 * 수강신청용 참고 등급입니다. 공식 벤치마크나 실제 학교 서버의 성능 등급이 아닙니다.
 * @param {{frame:{median:number,p95:number,interruptions:number,samples:number}|null,longTasks:number|null,drift:number|null,timerCount:number,
 * network:ReturnType<typeof networkStats>|null,connectionType?:string,threads?:number,memory?:number}} measurement 관측값과 유효 표본 수
 * @returns {Record<string,GradeResult>}
 */
export function gradeReadiness({frame,longTasks,drift,timerCount,network,connectionType,threads,memory}){
  /** @param {ReadinessGrade|null} grade @param {string} [note] @returns {GradeResult} */
  const rated=(grade,note='')=>({grade,note:grade===null?(note||'판정 보류'):note});
  const pending=note=>rated(null,note);
  const sampled=(value,limits,count,min,higher=false)=>{
    if(value===null)return pending('미측정');
    if(count<min)return pending('표본 부족 · 판정 보류');
    return rated(thresholdGrade(value,limits,higher));
  };
  // 역수의 부동소수점 반올림으로 30fps 경계가 달라지지 않도록 간격과 직접 비교합니다.
  const frameGrades=frame&&frame.samples>=25&&frame.median>0?[
    thresholdGrade(frame.median,[20,25,1000/30,50]),
    thresholdGrade(frame.p95,[25,40,60,100]),
    thresholdGrade(frame.interruptions,[0,1,2,4]),
  ]:null;
  const frameGrade=frameGrades&&frameGrades.every(g=>g!==null)
    ?GRADES[Math.max(...frameGrades.map(g=>GRADES.indexOf(g)))]:null;
  const driftGrade=drift!==null&&timerCount>=15?
    (drift>=100?'F':thresholdGrade(drift,[5,15,30,100])):null;
  const connectionGrades={'4g':'A','3g':'C','2g':'D','slow-2g':'F'};
  const error=network?(network.excluded===7?pending('유효 표본 없음 · 판정 보류'):
    rated(thresholdGrade(network.failures,[0,1,2,4]),network.excluded>0?'표본 제외 있음 · 잠정 등급':'')):pending('미측정');
  return {
    frame:rated(frameGrade,frameGrade===null?'표본 부족 · 판정 보류':'FPS·프레임 간격·끊김 중 최저 등급'),
    task:longTasks===null?pending('브라우저 미지원'):rated(thresholdGrade(longTasks,[0,1,2,4])),
    drift:rated(driftGrade,driftGrade===null?(drift===null?'미측정':'표본 부족 · 판정 보류'):''),
    latency:network?sampled(network.median,[40,80,150,300],network.latencyCount,3):pending('미측정'),
    jitter:network?sampled(network.jitter,[5,15,30,60],network.jitterCount,2):pending('미측정'),
    speed:network?sampled(network.mbps,[10,5,2,.5],network.downloadCount,2,true):pending('미측정'),
    error,
    connection:connectionType&&Object.hasOwn(connectionGrades,connectionType)?
      rated(connectionGrades[connectionType],'브라우저 추정 유형 · 참고 등급'):pending('브라우저 미지원 또는 유형 미확인'),
    threads:typeof threads==='number'&&threads>=1?
      rated(thresholdGrade(threads,[8,6,4,2],true),'하드웨어 참고 등급'):pending('브라우저 미지원'),
    memory:typeof memory==='number'&&memory>0?
      rated(thresholdGrade(memory,[8,4,2,1],true),'브라우저 근삿값 · 참고 등급'):pending('브라우저 미지원'),
  };
}
/** @type {[Record<string,string>,string][]} */
const ADVICE_GROUPS=[
  [{frame:'화면 프레임'},'영상 재생·녹화를 멈추고 화면 주사율과 절전 설정을 확인하세요.'],
  [{task:'긴 작업',drift:'타이머 지연',threads:'논리 코어',memory:'메모리'},'사용하지 않는 탭·앱을 닫고 작업 관리자에서 CPU·메모리 사용량을 확인하세요.'],
  [{latency:'HTTP 응답',jitter:'연결 지터',speed:'다운로드',error:'요청 실패',connection:'네트워크 유형'},
    '대용량 전송을 잠시 멈추고 안정적인 Wi-Fi 또는 유선 연결에서 다시 검사하세요.'],
];
/** @param {Record<string,GradeResult>} grades 지표별 참고 등급 */
export function gradeAdvice(grades){
  return ADVICE_GROUPS.flatMap(([labels,action])=>{
    const affected=Object.entries(labels).filter(([key])=>{
      const grade=grades[key]?.grade;
      return grade!=null&&grade!=='A';
    }).map(([,label])=>label);
    return affected.length?[affected.join('·')+': '+action]:[];
  });
}

/**
 * 실제 관측에서 확인한 이상만 요약합니다.
 * @param {{frame:{interruptions:number,median:number},longTasks:number|null,network:{failures:number}|null,drift?:number|null}} measurement
 */
export function findings({frame,longTasks,network,drift}){
  const messages=[];
  if(frame.interruptions>=3)messages.push('화면 갱신이 여러 번 끊겼습니다.');
  if(frame.median>=30)messages.push('이 탭의 화면 갱신 간격이 길었습니다.');
  if(longTasks!==null&&longTasks>=3)messages.push('브라우저 긴 작업이 반복되었습니다.');
  if(network!==null&&network.failures>=2)messages.push('한모 정적 파일 요청에서 반복 오류가 발생했습니다.');
  if(drift!=null&&drift>=100)messages.push('브라우저 타이머가 크게 지연되었습니다.');
  return messages;
}
const text=(value)=>typeof value==='number'?value.toFixed(1):'측정 불가';
const guard=(condition,message)=>{if(condition)throw new Error(message);};
export function networkSample(timing,method){
  if(!timing||timing.transferSize<=0||timing.deliveryType==='cache'||timing.workerStart>0)return null;
  const ms=timing.responseEnd-timing.startTime;
  if(ms<=0)return null;
  if(method==='HEAD')return ms;
  const bytes=timing.encodedBodySize;
  return bytes>0&&timing.transferSize>bytes?bytes*8/ms/1000:null;
}
const PROBE_BYTES=262216;
async function fetchWithTimeout(url,method,signal){
  const controller=new AbortController();
  const onAbort=()=>controller.abort();
  signal.addEventListener('abort',onAbort,{once:true});
  const timeout=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(url,{method,signal:controller.signal,cache:'no-store',
      credentials:'omit',mode:'same-origin',redirect:'error'});
    if(response.status!==200)throw new Error('HTTP '+response.status);
    // HEAD도 응답 소비를 마쳐야 브라우저가 Resource Timing 항목을 게시합니다.
    const bytes=(await response.arrayBuffer()).byteLength;
    if(method==='GET'){
      // Windows 체크아웃에서는 마지막 줄바꿈이 1바이트 더 길 수 있습니다.
      guard(bytes!==PROBE_BYTES&&bytes!==PROBE_BYTES+1,'시험 파일이 불완전합니다.');
    }
    const timing=performance.getEntriesByName(url.href,'resource').at(-1);
    return networkSample(timing,method);
  }finally{
    clearTimeout(timeout);signal.removeEventListener('abort',onAbort);
  }
}
async function measureNetwork(signal,progress){
  const latency=[],speed=[];
  let failures=0;
  const runId=crypto.randomUUID?.()??String(performance.now());
  for(let i=0;i<HEAD_REQUESTS;i++){
    guard(signal.aborted,'검사가 중단되었습니다.');
    progress('연결 응답시간 검사 '+(i+1)+'/'+HEAD_REQUESTS);
    const url=new URL('../img/favicon.png',import.meta.url);
    url.searchParams.set('probe','head-'+i+'-'+runId);
    try{latency.push(await fetchWithTimeout(url,'HEAD',signal));}
    catch(e){if(signal.aborted)throw e;failures++;latency.push(null);}
  }
  for(let i=0;i<DOWNLOAD_REQUESTS;i++){
    guard(signal.aborted,'검사가 중단되었습니다.');
    progress('다운로드 처리량 검사 '+(i+1)+'/'+DOWNLOAD_REQUESTS);
    const url=new URL('../data/network-probe.txt',import.meta.url);
    url.searchParams.set('probe','download-'+i+'-'+runId);
    try{
      const sample=await fetchWithTimeout(url,'GET',signal);
      if(sample!==null)speed.push(sample);
    }catch(e){if(signal.aborted)throw e;failures++;}
  }
  return networkStats(latency,speed,failures);
}
function frames(signal){
  return new Promise((resolve,reject)=>{
    const samples=[],drifts=[];
    let last=null,raf=0,observer=null,longTasks=null,finished=false;
    const start=performance.now(),warm=start+500,end=warm+3000;
    let timer=0;
    function scheduleTimer(){
      const intended=performance.now()+100;
      timer=setTimeout(()=>{
        const actual=performance.now();
        if(intended>=warm&&intended<end)drifts.push(Math.max(0,actual-intended));
        scheduleTimer();
      },100);
    }
    scheduleTimer();
    const countTasks=entries=>{
      for(const item of entries)if(item.startTime>=warm&&item.startTime<end)longTasks++;
    };
    if(typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')){
      try{
        longTasks=0;
        observer=new PerformanceObserver(list=>countTasks(list.getEntries()));
        observer.observe({entryTypes:['longtask']});
      }catch{longTasks=null;}
    }
    function cleanup(){
      if(finished)return false;
      finished=true;cancelAnimationFrame(raf);clearTimeout(timer);
      observer?.disconnect();signal.removeEventListener('abort',abort);
      return true;
    }
    function abort(){if(cleanup())reject(new Error('화면 검사 중단'));}
    function sample(time){
      if(finished)return;
      if(signal.aborted||document.hidden){abort();return;}
      if(last!==null&&last>=warm&&time>last)samples.push(time-last);
      last=time;
      if(time>=end){
        if(longTasks!==null&&observer)countTasks(observer.takeRecords());
        if(cleanup()){
          if(samples.length<25)reject(new Error('유효한 프레임 표본이 부족합니다.'));
          else resolve({frame:summarizeFrames(samples),longTasks,timerCount:drifts.length,
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
    const advice=document.getElementById('readiness-advice');
    const adviceList=document.getElementById('readiness-advice-list');
    const networkEnabled=document.getElementById('readiness-network');
    const redo=document.getElementById('readiness-back');
    let controller=null,interruption='진단이 취소되었습니다.';
    // 값·세부 설명·등급을 분리하되 원래 관측값은 모두 보존합니다.
    const value=(id,content,detail='')=>{
      const node=document.getElementById(id);
      const main=document.createElement('span');main.className='readiness-metric-main';main.textContent=content;
      node.replaceChildren(main);
      if(detail){
        const extra=document.createElement('span');extra.className='readiness-metric-detail';extra.textContent=detail;
        node.append(' ',extra);
      }
    };
    /** @param {Record<string,GradeResult>} grades */
    function renderGrades(grades){
      for(const [key,{grade,note}] of Object.entries(grades)){
        const badge=result.querySelector('[data-metric-grade="'+key+'"]');
        const detail=result.querySelector('[data-grade-note="'+key+'"]');
        badge.dataset.grade=grade??'none';
        badge.textContent=grade??'—';
        const label=grade?grade+' 등급 · '+GRADE_LABELS[grade]:'판정 보류';
        badge.setAttribute('aria-label',label);
        badge.title=label+(note?' · '+note:'');
        detail.textContent=note;detail.hidden=!note;
      }
    }
    const abort=(reason)=>{if(controller){interruption=reason;controller.abort();}};
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)abort('탭이 숨겨져 측정이 중단되었습니다.');
    });
    cancel.addEventListener('click',()=>abort('사용자가 진단을 취소했습니다.'));
    redo.addEventListener('click',()=>{result.hidden=true;inputs.hidden=false;start.focus();});
    start.addEventListener('click',async()=>{
      if(controller)return;
      controller=new AbortController();const signal=controller.signal;
      start.disabled=true;cancel.hidden=false;interruption='진단이 취소되었습니다.';
      try{
        guard(!('requestAnimationFrame' in window),'프레임 측정을 지원하지 않는 브라우저입니다.');
        status.textContent='현재 화면의 프레임과 이벤트 루프를 3초간 관측합니다.';
        const {frame,longTasks,drift,timerCount}=await frames(signal);
        let network=null;
        if(networkEnabled.checked)network=await measureNetwork(signal,message=>{status.textContent=message;});
        guard(signal.aborted,'진단 취소');
        const messages=findings({frame,longTasks,network,drift});
        value('readiness-frame-value',text(1000/frame.median)+'fps 관측','· 프레임 간격 중앙값 '+
          text(frame.median)+'ms · 95백분위수 '+text(frame.p95)+'ms · 끊김 '+frame.interruptions+'회');
        value('readiness-task-value',longTasks===null?'지원되지 않음':longTasks+'회 (50ms 이상)');
        value('readiness-drift-value',drift===null?'측정 불가':'95백분위수 '+text(drift)+'ms',drift===null?'':'· '+timerCount+'개');
        value('readiness-latency-value',network?.median==null?'미측정':'중앙값 '+text(network.median)+'ms',network?.median==null?'':'· '+network.latencyCount+'/'+HEAD_REQUESTS+'개');
        value('readiness-jitter-value',network?.jitter==null?'미측정':text(network.jitter)+'ms');
        value('readiness-speed-value',network?.mbps==null?'미측정':text(network.mbps)+'Mbps',network?.mbps==null?'':'· '+network.downloadCount+'/'+DOWNLOAD_REQUESTS+'개');
        value('readiness-error-value',network?network.failures+'/'+(HEAD_REQUESTS+DOWNLOAD_REQUESTS)+'회 실패':'미측정',network?'· '+network.excluded+'회 제외':'');
        const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
        value('readiness-connection-value',connection?.effectiveType??'브라우저 미지원');
        value('readiness-threads-value',
          navigator.hardwareConcurrency?navigator.hardwareConcurrency+' 논리 코어':'브라우저 미지원');
        value('readiness-memory-value',
          navigator.deviceMemory?navigator.deviceMemory+'GB (대략값)':'브라우저 미지원');
        const grades=gradeReadiness({frame,longTasks,drift,timerCount,network,
          connectionType:connection?.effectiveType,threads:navigator.hardwareConcurrency,
          memory:navigator.deviceMemory});
        renderGrades(grades);
        const actions=gradeAdvice(grades);
        adviceList.replaceChildren(...actions.map(action=>{
          const item=document.createElement('li');
          item.textContent=action;
          return item;
        }));
        advice.hidden=actions.length===0;
        const low=Object.values(grades).some(item=>item.grade==='D'||item.grade==='F');
        summary.textContent=messages.join(' ')||(low
          ?'참고 기준에서 개선이 필요한 항목이 있습니다. 항목별 등급과 관측값을 확인하세요.'
          :'이번 관측에서 뚜렷한 이상을 발견하지 못했습니다.');
        document.getElementById('readiness-grade-criteria').open=false;
        result.hidden=false;inputs.hidden=true;
        // 길어진 결과를 처음부터 읽고 키보드로 스크롤할 수 있도록 합니다.
        result.scrollTop=0;
        result.focus({preventScroll:true});
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
