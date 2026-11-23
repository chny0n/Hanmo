// @ts-check
// 실제 학교 수강 데이터가 없는 합성 환경에서 기대점수 최대 신청 순서를 탐색합니다.
import {DIRECT_SUBMIT_MS} from './reaction-profile.mjs';
const requireInteger=(value,min,max,label)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(label+' 입력값을 확인하세요.');
};
export function validateScenario(input){
  if(!input||!Array.isArray(input.courses))throw new RangeError('과목이 없습니다.');
  const c=input.courses;
  requireInteger(c.length,2,MAX_COURSES,'과목 수');
  const ranks=new Set(),ids=new Set();
  for(const course of c){
    if(typeof course?.id!=='string'||!course.id||ids.has(course.id))throw new RangeError('과목 ID가 중복되었습니다.');
    ids.add(course.id);
    if(typeof course.name!=='string'||!course.name.trim()||course.name.length>30)
      throw new RangeError('과목 이름은 1~30자로 입력하세요.');
    requireInteger(course.rank,1,c.length,'중요 순위');
    if(ranks.has(course.rank))throw new RangeError('중요 순위는 1부터 과목 수까지 중복 없이 설정하세요.');
    ranks.add(course.rank);
    requireInteger(course.capacity,1,300,'정원');
    requireInteger(course.rivals,0,200,'경쟁자');
  }
  requireInteger(input.seed,0,4294967295,'실험 식별값');
  requireInteger(input.trials,100,5000,'실험 반복 수');
  for(const key of ['startDelayMs','actionMs','jitterMs']){
    requireInteger(input[key],key==='actionMs'?300:0,key==='actionMs'?3000:key==='jitterMs'?1500:5000,key);
  }
  return input;
}
const MAX_COURSES=8;
const RIVAL_REACTION_MEAN_MS=270;
const REACTION_SHAPE=20;
const RIVAL_STEP_MS=RIVAL_REACTION_MEAN_MS+DIRECT_SUBMIT_MS;
const OVERLAP={less:1,baseline:2,more:4};
function random01(seed,trial,stream,draw){
  let x=(seed^Math.imul(trial+1,0x9e3779b9)^
    Math.imul(stream+3,0x85ebca6b)^Math.imul(draw+17,0xc2b2ae35))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return (((x^(x>>>16))>>>0)+0.5)/4294967296;
}
function actionTimes(s,trial){
  const times=[];let elapsed=s.startDelayMs;
  for(let slot=0;slot<s.courses.length;slot++){
    const u1=random01(s.seed,trial,100,slot*2),u2=random01(s.seed,trial,100,slot*2+1);
    const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    elapsed+=Math.max(DIRECT_SUBMIT_MS+80,s.actionMs+s.jitterMs*z);
    times.push(elapsed);
  }
  return times;
}

function rivalReaction(draw){
  let product=1;
  for(let i=0;i<REACTION_SHAPE;i++)product*=draw();
  return -Math.log(product)*RIVAL_REACTION_MEAN_MS/REACTION_SHAPE;
}

/** @param {{capacity:number,rivals:number}} course 가상 과목 */
export function urgencyWeight({capacity,rivals}){
  return Math.sqrt(1+rivals/capacity);
}

function assignCourses(courses,population,seed,trial){
  const portfolios=Array.from({length:population},()=>[]);
  const candidates=Array.from({length:population},(_,i)=>i);
  const membershipSeed=seed^0x5f9b0163;
  for(const [index,{rivals}] of courses.entries()){
    for(let i=0;i<rivals;i++){
      const j=i+Math.floor(random01(membershipSeed,trial,index,i)*(population-i));
      [candidates[i],candidates[j]]=[candidates[j],candidates[i]];
      portfolios[candidates[i]].push(index);
    }
  }
  return portfolios;
}

export function rivalOrder(known,urgency,draw){
  const size=known.length+Math.floor(draw()*(MAX_COURSES-known.length+1));
  // 가중치가 클수록 작은 키를 뽑아 앞 순서에 놓입니다. 기타 과목의 가중치는 1입니다.
  const entries=known.map(course=>({course,key:-Math.log(draw())/urgency[course]}));
  while(entries.length<size)entries.push({course:-1,key:-Math.log(draw())});
  return entries.sort((a,b)=>a.key-b.key);
}

function closingTimes(s,urgency,population,trial){
  const arrivals=s.courses.map(()=>[]);
  const portfolios=assignCourses(s.courses,population,s.seed,trial);
  const timingSeed=s.seed^0x729ab44d;
  for(const [rival,known] of portfolios.entries()){
    if(!known.length)continue;
    let count=0;
    const draw=()=>random01(timingSeed,trial,rival,count++);
    const first=DIRECT_SUBMIT_MS+rivalReaction(draw);
    rivalOrder(known,urgency,draw).forEach(({course},slot)=>{
      if(course>=0)arrivals[course].push(first+slot*RIVAL_STEP_MS);
    });
  }
  return s.courses.map(({capacity,rivals},i)=>capacity>rivals
    ?Infinity
    :arrivals[i].sort((a,b)=>a-b)[capacity-1]);
}

/** 비트마스크 DP로 8개 과목의 기대 가중 점수를 최대화합니다. */
export function bestOrder(weights,probability){
  const n=weights.length,size=1<<n;
  const dp=Array(size).fill(-Infinity),parent=Array(size).fill(null);
  dp[0]=0;
  for(let mask=0;mask<size-1;mask++){
    if(!Number.isFinite(dp[mask]))continue;
    let pos=0;
    for(let bit=mask;bit;bit&=bit-1)pos++;
    for(let j=0;j<n;j++){
      if(mask&(1<<j))continue;
      const next=mask|(1<<j);
      const score=dp[mask]+weights[j]*probability[j][pos];
      if(score>dp[next]+1e-12){dp[next]=score;parent[next]={mask,index:j};}
    }
  }
  const order=[];let mask=size-1;
  while(mask){
    const step=parent[mask];
    if(!step)throw new Error('전략 순서를 계산하지 못했습니다.');
    order.push(step.index);mask=step.mask;
  }
  return order.reverse();
}
/** 같은 경쟁자가 여러 과목을 신청하는 선착순 경쟁을 회차별로 계산합니다. */
export function simulate(raw){
  validateScenario(raw);
  const s={...raw,courses:[...raw.courses].sort((a,b)=>a.id<b.id?-1:1)};
  const n=s.courses.length;
  const urgency=s.courses.map(urgencyWeight);
  const demand=s.courses.reduce((total,c)=>total+c.rivals,0);
  const mostRivals=Math.max(...s.courses.map(c=>c.rivals));
  const population=overlap=>Math.max(mostRivals,Math.ceil(demand/overlap));
  const guaranteed=s.courses.every(course=>course.capacity>course.rivals);
  const success=Array.from({length:n},()=>new Float64Array(n));
  const baseline=population(OVERLAP.baseline);
  for(let trial=0;trial<s.trials;trial++){
    const times=actionTimes(s,trial);
    const closing=guaranteed?s.courses.map(()=>Infinity):closingTimes(s,urgency,baseline,trial);
    for(let j=0;j<n;j++){
      for(let slot=0;slot<n;slot++){
        if(times[slot]<closing[j])success[j][slot]++;
      }
    }
  }
  const probability=success.map(row=>Array.from(row,v=>v/s.trials));
  const weights=s.courses.map(c=>n-c.rank+1);
  const order=bestOrder(weights,probability);
  const sum=weights.reduce((a,b)=>a+b,0);
  const meanScore=order.reduce((score,j,slot)=>score+weights[j]*probability[j][slot],0)*100/sum;
  const evaluated=new Map();
  function allWins(overlap){
    if(guaranteed)return s.trials;
    const size=population(overlap);
    if(evaluated.has(size))return evaluated.get(size);
    let wins=0;
    // 추천 순서를 고른 회차와 전체 성공을 확인하는 회차는 서로 다릅니다.
    for(let trial=s.trials;trial<2*s.trials;trial++){
      const times=actionTimes(s,trial);
      const closing=closingTimes(s,urgency,size,trial);
      if(order.every((j,slot)=>times[slot]<closing[j]))wins++;
    }
    evaluated.set(size,wins);
    return wins;
  }
  return {
    seed:s.seed,trials:s.trials,order:order.map(index=>s.courses[index].name),
    ranks:order.map(index=>s.courses[index].rank),
    allWins:allWins(OVERLAP.baseline),meanScore,
    sensitivity:{lessOverlap:allWins(OVERLAP.less),moreOverlap:allWins(OVERLAP.more)},
    guaranteed,
    model:'SYNTHETIC_ONLY',
  };
}
