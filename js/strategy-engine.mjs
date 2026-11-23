// @ts-check
// 실제 학교 수강 데이터가 없는 합성 환경에서 기대점수 최대 신청 순서를 탐색합니다.
const requireInteger=(value,min,max,label)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(label+' 입력값을 확인하세요.');
};
export function validateScenario(input){
  if(!input||!Array.isArray(input.courses))throw new RangeError('가상 과목이 없습니다.');
  const c=input.courses;
  requireInteger(c.length,2,8,'과목 수');
  const ranks=new Set(),ids=new Set();
  for(const course of c){
    if(typeof course?.id!=='string'||!course.id||ids.has(course.id))throw new RangeError('과목 ID가 중복되었습니다.');
    ids.add(course.id);
    if(typeof course.name!=='string'||!course.name.trim()||course.name.length>30)
      throw new RangeError('과목 이름은 1~30자로 입력하세요.');
    requireInteger(course.rank,1,c.length,'중요 순위');
    if(ranks.has(course.rank))throw new RangeError('중요 순위는 1부터 과목 수까지 중복 없이 설정하세요.');
    ranks.add(course.rank);
    requireInteger(course.capacity,1,300,'가상 정원');
    requireInteger(course.rivals,0,200,'가상 경쟁자');
  }
  requireInteger(input.seed,0,4294967295,'실험 식별값');
  requireInteger(input.trials,100,5000,'실험 반복 수');
  for(const key of ['startDelayMs','actionMs','jitterMs']){
    requireInteger(input[key],key==='actionMs'?300:0,key==='actionMs'?3000:key==='jitterMs'?1500:5000,key);
  }
  return input;
}
// 고정된 가상 소진속도입니다. 실측 강좌 경쟁률이나 서버 처리속도에서 유래하지 않았습니다.
export function syntheticRate(index){
  return [0.08,0.06,0.09,0.05,0.075,0.055,0.085,0.065][index%8];
}
function uniform(seed,trial,course,draw){
  let x=(seed^Math.imul(trial+1,0x9e3779b9)^
    Math.imul(course+3,0x85ebca6b)^Math.imul(draw+17,0xc2b2ae35))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)+0.5;
}
function random01(seed,trial,course,draw){return uniform(seed,trial,course,draw)/4294967296;}
function trialState(s,trial){
  const times=[];let elapsed=s.startDelayMs/1000;
  for(let slot=0;slot<s.courses.length;slot++){
    const u1=random01(s.seed,trial,100,slot*2),u2=random01(s.seed,trial,100,slot*2+1);
    const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    elapsed+=Math.max(100,s.actionMs+s.jitterMs*z)/1000;
    times.push(elapsed);
  }
  const arrives=s.courses.map((course,index)=>{
    const arr=new Float64Array(course.rivals),rate=syntheticRate(index);
    for(let k=0;k<arr.length;k++){
      arr[k]=-Math.log(1-random01(s.seed,trial,index,k))/rate;
    }
    return arr;
  });
  return {times,arrives};
}
function succeeded(arr,capacity,at){
  let earlier=0;
  for(const arrival of arr)if(arrival<=at)earlier++;
  return earlier<capacity;
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
/** 반환되는 확률은 입력·임의 도착률로 만든 가상 실험의 빈도입니다. */
export function simulate(raw){
  const s=validateScenario(raw),n=s.courses.length;
  const success=Array.from({length:n},()=>new Float64Array(n));
  for(let trial=0;trial<s.trials;trial++){
    const state=trialState(s,trial);
    for(let j=0;j<n;j++){
      for(let slot=0;slot<n;slot++){
        if(succeeded(state.arrives[j],s.courses[j].capacity,state.times[slot]))success[j][slot]++;
      }
    }
  }
  const probability=success.map(row=>Array.from(row,v=>v/s.trials));
  const weights=s.courses.map(c=>n-c.rank+1);
  const order=bestOrder(weights,probability);
  let allSucceeded=0,totalWeighted=0;
  const sum=weights.reduce((a,b)=>a+b,0);
  for(let trial=0;trial<s.trials;trial++){
    const state=trialState(s,trial);
    let earned=0,all=true;
    for(let slot=0;slot<n;slot++){
      const j=order[slot];
      const ok=succeeded(state.arrives[j],s.courses[j].capacity,state.times[slot]);
      if(ok)earned+=weights[j];else all=false;
    }
    if(all)allSucceeded++;
    totalWeighted+=100*earned/sum;
  }
  return {
    seed:s.seed,trials:s.trials,order:order.map(index=>s.courses[index].name),
    ranks:order.map(index=>s.courses[index].rank),
    allRate:100*allSucceeded/s.trials,meanScore:totalWeighted/s.trials,
    model:'SYNTHETIC_ONLY',
  };
}
