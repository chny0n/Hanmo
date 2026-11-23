// @ts-check
// 실제 학교 수강 데이터가 없는 합성 환경에서 기대점수 최대 신청 순서를 탐색합니다.
const requireInteger=(value,min,max,label)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError(label+' 입력값을 확인하세요.');
};
export function validateScenario(input){
  if(!input||!Array.isArray(input.courses))throw new RangeError('과목이 없습니다.');
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
const SYNTHETIC_RATES=[0.08,0.06,0.09,0.05,0.075,0.055,0.085,0.065];

/** @param {number} index 과목의 입력 위치 */
export function syntheticRate(index){
  return SYNTHETIC_RATES[index%SYNTHETIC_RATES.length];
}
function random01(seed,trial,course,draw){
  let x=(seed^Math.imul(trial+1,0x9e3779b9)^
    Math.imul(course+3,0x85ebca6b)^Math.imul(draw+17,0xc2b2ae35))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  return (((x^(x>>>16))>>>0)+0.5)/4294967296;
}
function actionTimes(s,trial){
  const times=[];let elapsed=s.startDelayMs/1000;
  for(let slot=0;slot<s.courses.length;slot++){
    const u1=random01(s.seed,trial,100,slot*2),u2=random01(s.seed,trial,100,slot*2+1);
    const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
    elapsed+=Math.max(100,s.actionMs+s.jitterMs*z)/1000;
    times.push(elapsed);
  }
  return times;
}

const logFactorials=[0];
for(let i=1;i<=200;i++)logFactorials.push(logFactorials[i-1]+Math.log(i));

// 평균에서 바깥쪽으로 향하는 꼬리를 합산해 극단적인 도착률에서도 오차를 줄입니다.
function binomialTail(n,k,p,q){
  const logChoose=logFactorials[n]-logFactorials[k]-logFactorials[n-k];
  let term=Math.exp(logChoose+k*Math.log(p)+(n-k)*Math.log(q));
  let sum=term;
  for(let i=k;i>0;i--){
    term*=i/(n-i+1)*(q/p);
    sum+=term;
    if(term<=sum*Number.EPSILON)break;
  }
  return Math.min(1,sum);
}

function seatProbability({capacity,rivals},rate,time){
  if(capacity>rivals)return 1;
  const arrived=-Math.expm1(-rate*time);
  const pending=Math.exp(-rate*time);
  if(capacity<=rivals*arrived)return binomialTail(rivals,capacity-1,arrived,pending);
  return 1-binomialTail(rivals,rivals-capacity,pending,arrived);
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
/** 표본마다 행동시간을 뽑고, 그 시간에 자리가 남을 확률을 이항분포로 계산합니다. */
export function simulate(raw){
  const s=validateScenario(raw),n=s.courses.length;
  const success=Array.from({length:n},()=>new Float64Array(n));
  const rates=s.courses.map((_,index)=>syntheticRate(index));
  const timings=[];
  for(let trial=0;trial<s.trials;trial++){
    const times=actionTimes(s,trial);
    timings.push(times);
    for(let j=0;j<n;j++){
      for(let slot=0;slot<n;slot++){
        success[j][slot]+=seatProbability(s.courses[j],rates[j],times[slot]);
      }
    }
  }
  const probability=success.map(row=>Array.from(row,v=>v/s.trials));
  const weights=s.courses.map(c=>n-c.rank+1);
  const order=bestOrder(weights,probability);
  const sum=weights.reduce((a,b)=>a+b,0);
  const meanScore=order.reduce((score,j,slot)=>score+weights[j]*probability[j][slot],0)*100/sum;
  const rateFactors=[0.75,1,1.25];
  const allRates=rateFactors.map(factor=>{
    let total=0;
    // 같은 시도의 행동시간을 공유하므로 시도별 결합 확률을 구한 뒤 평균을 냅니다.
    for(const times of timings){
      total+=order.reduce((joint,j,slot)=>
        joint*seatProbability(s.courses[j],rates[j]*factor,times[slot]),1);
    }
    return total*100/s.trials;
  });
  return {
    seed:s.seed,trials:s.trials,order:order.map(index=>s.courses[index].name),
    ranks:order.map(index=>s.courses[index].rank),
    allRate:allRates[1],meanScore,
    sensitivity:{faster:allRates[2],slower:allRates[0]},
    model:'SYNTHETIC_ONLY',
  };
}
