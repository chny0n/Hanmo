// 합성 전략 및 브라우저 관측 계약의 독립 점검입니다. 학교 서버에 요청하지 않습니다.
// 기본 실행은 경계·독립 기준·고정 시드만 검증합니다. 최대 입력의 별도 측정은 --benchmark이며 CI 필수 항목이 아닙니다.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {simulate,validateScenario,runSharedQueue,serviceFinishMs,bestOrder,wilsonInterval} from '../js/strategy-engine.mjs';
import {gradeReadiness,networkStats,networkSample,summarizeFrames} from '../js/readiness.mjs';
import {readProfile,profileFromSamples,REACTION_KEY} from '../js/reaction-profile.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≟ ${b}`);
let state=314159;
const u=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/2**32);
const int=n=>Math.floor(u()*n);
// 누적 처리량의 역함수로 서비스 완료시각을 구해 구현의 구간 적분과 별도로 비교합니다.
const work=t=>t<2000?t/20:t<5000?100+(t-2000)/12.5:340+(t-5000)/10;
const at=w=>w<100?20*w:w<340?2000+(w-100)*12.5:5000+(w-340)*10;
for(const t of [0,1979,1980,1999,1999.5,2000,2001,4986,4987.5,4999,5000,5000.5,6000])close(serviceFinishMs(t),at(work(t)+1));
function reference(agents){
  const pending=agents.filter(x=>x.actions.length).map(x=>({a:x,s:0,t:x.startMs+x.actions[0]}));
  const out=[];
  let available=0;
  while(pending.length){
    pending.sort((a,b)=>a.t-b.t||a.a.id-b.a.id);
    const {a,s,t}=pending.shift();
    const start=Math.max(available,t),finish=at(work(start)+1),reply=Math.max(finish,start+a.delays[s]);
    available=finish;out.push([a.id,s,t,start,finish,reply]);
    if(s+1<a.actions.length)pending.push({a,s:s+1,t:reply+a.actions[s+1]});
  }
  return out;
}
for(let k=0;k<120;k++){
  const agents=Array.from({length:2+int(24)},(_,id)=>{
    const n=int(9);return {id,startMs:k===0?1970:int(700)*10,actions:Array.from({length:n},()=>k===0?20:10*int(40)),delays:Array.from({length:n},()=>1000+10*int(201)),courses:[]};
  }).reverse();
  const current=[];runSharedQueue(agents,(a,s,...args)=>{current.push([a.id,s,...args]);});
  const ref=reference(agents);
  assert.equal(current.length,ref.length);
  for(let i=0;i<ref.length;i++)for(let j=0;j<6;j++)close(current[i][j],ref[i][j]);
}
function bruteMax(weights,P){
  let max=-Infinity;
  const calculate=(ids,score)=>{
    if(ids.length===weights.length){max=Math.max(max,score);return;}
    for(let i=0;i<weights.length;i++)if(!ids.includes(i))calculate([...ids,i],score+weights[i]*P[i][ids.length]);
  };calculate([],0);return max;
}
for(let n=2;n<=8;n++)for(let repeat=0;repeat<5;repeat++){
  const weights=Array.from({length:n},(_,i)=>n-i),P=weights.map(()=>weights.map(()=>int(101)/100));
  const actual=bestOrder(weights,P).reduce((s,i,j)=>s+weights[i]*P[i][j],0);
  close(actual,bruteMax(weights,P));
}
const sample=(n,seed,trials=100,high=false)=>({
  courses:Array.from({length:n},(_,i)=>({id:String(i),name:'합성과목 '+(i+1),rank:i+1,capacity:high?[5,12,12,15,10,25,25,7][i]:[10,16,12,18,16,12,24,15][i],rivals:(high?[35,48,43,36,29,70,52,36]:[10,19,12,22,23,12,30,15])[i]})),
  actionMs:630,startDelayMs:0,jitterMs:170,seed,trials,
});
for(const capacity of [1,50,51,200,300])validateScenario({...sample(2,0),courses:[{id:'0',name:'A',rank:1,capacity,rivals:0},{id:'1',name:'B',rank:2,capacity,rivals:200}]});
for(const [field,value] of [['capacity',0],['capacity',301],['rivals',-1],['rivals',201],['rank',2],['id','1'],['name','']]){
  const scenario=sample(2,0);scenario.courses[0][field]=value;assert.throws(()=>validateScenario(scenario),RangeError);
}
for(const [field,value] of [['seed',-1],['seed',2**32],['seed',1.5],['trials',99],['trials',5001],['actionMs',299],['startDelayMs',5001],['jitterMs',1501]])assert.throws(()=>validateScenario({...sample(2,0),[field]:value}),RangeError);
for(const n of [1,9])assert.throws(()=>validateScenario(sample(n,0)),RangeError);
validateScenario(sample(2,2**32-1));validateScenario(sample(8,0));
const wilsonRef=(successes,n)=>{
  const z=1.959963984540054,p=successes/n,d=n+z*z,a=n*p+z*z/2,b=z*Math.sqrt(n*p*(1-p)+z*z/4);
  return [Math.max(0,(a-b)/d),Math.min(1,(a+b)/d)];
};
for(const k of [0,1,5,50,95,99,100])wilsonRef(k,100).forEach((w,i)=>close(w,wilsonInterval(k,100)[i]));
const check=s=>{
  const start=performance.now(),r=simulate(s),ms=Math.round(performance.now()-start);
  const cases=[r.allWins,r.sensitivity.lessOverlap,r.sensitivity.moreOverlap,r.sensitivity.synchronized];
  assert.ok(cases.every(x=>Number.isInteger(x)&&x>=0&&x<=s.trials));
  assert.equal(new Set(r.ranks).size,s.courses.length);
  assert.ok(r.courseSuccess.every(x=>x>=r.allWins/s.trials&&x<=1));
  close(r.expectedCourses,r.courseSuccess.reduce((a,b)=>a+b,0));
  for(const [slot,rank] of r.ranks.entries()){
    const c=s.courses.find(x=>x.rank===rank);
    if(c.capacity>c.rivals)assert.equal(r.courseSuccess[slot],1);
    wilsonRef(Math.round(r.courseSuccess[slot]*s.trials),s.trials).forEach((v,i)=>{if(!r.guaranteed)close(v,r.uncertainty.courseSuccess[slot][i]);});
  }
  assert.deepEqual([r.uncertainty.assumptionRange.min,r.uncertainty.assumptionRange.max],[Math.min(...cases)/s.trials,Math.max(...cases)/s.trials]);
  return {ms,r,cases,rssMB:Math.round(process.memoryUsage().rss/2**20)};
};
const rows=[];
for(const n of [3,5,8])for(const high of [false,true])for(const seed of [17,20261125]){
  const s=sample(n,seed,100,high),{ms,r,cases}=check(s);
  assert.deepEqual(r,simulate({...s,courses:[...s.courses].reverse()}));
  rows.push([n,high?'높음':'낮음',seed,...cases,r.expectedCourses.toFixed(2),r.uncertainty.allWins.map(x=>(x*100).toFixed(1)).join('–'),ms]);
}
const guaranteed=sample(8,43);
for(const c of guaranteed.courses)c.capacity=c.rivals+1;
assert.deepEqual(check(guaranteed).cases,[100,100,100,100]);
assert.deepEqual(simulate(guaranteed).uncertainty.allWins,[1,1]);
const reaction=profileFromSamples([80,120,160,200,250,300,450,3000],2e12);
const store={value:JSON.stringify(reaction),getItem(key){assert.equal(key,REACTION_KEY);return this.value;}};
assert.deepEqual(readProfile(store,2e12+30*86400000),reaction);
assert.equal(readProfile(store,2e12+30*86400000+1),null);assert.equal(readProfile(store,2e12-1),null);
store.value='{malformed';assert.equal(readProfile(store,2e12),null);store.value=null;assert.equal(readProfile(store,2e12),null);
const measurements={frame:summarizeFrames(Array(180).fill(1000/60)),longTasks:0,drift:5,timerCount:20,network:networkStats([35,40,35,40,35],[10,11],0),connectionType:'4g',threads:8,memory:8,reactionMs:200};
assert.deepEqual(Object.values(gradeReadiness(measurements)).map(x=>x.grade),Array(11).fill('A'));
const frame120=summarizeFrames(Array(360).fill(1000/120));assert.equal(gradeReadiness({...measurements,frame:frame120}).frame.grade,'A');
const unavailable=gradeReadiness({...measurements,frame:null,longTasks:null,drift:null,timerCount:0,network:null,connectionType:undefined,threads:undefined,memory:undefined,reactionMs:undefined});
assert.deepEqual(Object.values(unavailable).map(x=>x.grade),Array(11).fill(null));
const failed=gradeReadiness({...measurements,network:networkStats([null,null,null,null,null],[],7)});assert.equal(failed.error.grade,'F');assert.equal(failed.speed.grade,null);
const excluded=gradeReadiness({...measurements,network:networkStats([null,null,null,null,null],[],0)});assert.equal(excluded.error.grade,null);
const partial=gradeReadiness({...measurements,network:networkStats([40,null,80,40,null],[10],0)});assert.equal(partial.latency.grade,'A');assert.equal(partial.jitter.grade,null);assert.equal(partial.speed.grade,null);assert.match(partial.error.note,/잠정/);
const t={startTime:20,responseEnd:120,transferSize:1200,encodedBodySize:1000,workerStart:0,deliveryType:''};
assert.equal(networkSample(t,'HEAD'),100);assert.equal(networkSample(t,'GET'),0.08);
for(const patch of [{transferSize:0},{deliveryType:'cache'},{workerStart:1}])assert.equal(networkSample({...t,...patch},'GET'),null);
// 수식 식별자 개수만 검증합니다. 수식 자체의 의미와 브라우저 배치는 별도로 확인해야 합니다.
const html=readFileSync(new URL('../html/strategy-lab.html',import.meta.url),'utf8');const formulaIds=Array.from(html.matchAll(/<math\b[^>]*data-formula="([^"]+)"/g),m=>m[1]);assert.equal(formulaIds.length,39);assert.equal(new Set(formulaIds).size,39);
console.log(JSON.stringify({columns:['과목 수','경합','시드','기본 성공','낮은 중복도 성공','높은 중복도 성공','동시 진입 성공','기대 성공 과목 수','Wilson 구간(%)','실행 ms'],trialsPerCondition:100,node:process.version,sha:spawnSync('git',['-C',fileURLToPath(new URL('..',import.meta.url)),'rev-parse','HEAD'],{encoding:'utf8'}).stdout?.trim()||null,vectors:{service:13,queue:120,dp:35,scenarioRows:rows.length,formulaIds},rows},null,2));
for(const trials of (process.argv.includes('--benchmark')?[1000,5000]:[])){
  const s=sample(8,4294967295,trials,true);
  for(const c of s.courses){c.capacity=1;c.rivals=200;}
  const before=process.memoryUsage(),{ms,r,cases,rssMB}=check(s),after=process.memoryUsage();
  console.log(JSON.stringify({maximum:{trials,ms,caseWins:cases,expected:r.expectedCourses,rssMB,heapDeltaMB:Math.round((after.heapUsed-before.heapUsed)/2**20),processMaxRssMiB:Math.round(process.resourceUsage().maxRSS/1024)}}));
}
