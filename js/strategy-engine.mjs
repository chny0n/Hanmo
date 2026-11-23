// @ts-check
// 학교 자료 없이 가상 경쟁 환경에서만 전략의 상대적 성과를 계산합니다.
const STRATEGIES=[
  {id:'priority',label:'중요도 우선'},
  {id:'urgency',label:'가상 소진속도 우선'},
  {id:'custom',label:'직접 정한 순서'},
];
const error=message=>{throw new RangeError(message);};
const integer=(value,min,max,name)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)error(name+'의 범위를 확인하세요.');
};
const number=(value,min,max,name)=>{
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)
    error(name+'의 범위를 확인하세요.');
};

/** 순서·범위를 검증한 안전한 합성 시나리오를 돌려줍니다. */
export function validateScenario(input){
  if(!input||typeof input!=='object'||!Array.isArray(input.courses))error('가상 과목 목록이 없습니다.');
  const courses=input.courses;
  integer(courses.length,2,8,'가상 과목 수');
  const orders=new Set(),ids=new Set();
  for(const [index,course] of courses.entries()){
    if(!course||typeof course!=='object')error('가상 과목 입력이 잘못되었습니다.');
    if(typeof course.name!=='string'||!course.name.trim()||course.name.length>30)
      error((index+1)+'번째 과목 이름을 확인하세요.');
    if(typeof course.id!=='string'||!course.id||ids.has(course.id))error('과목 ID가 중복되거나 비어 있습니다.');
    ids.add(course.id);
    integer(course.weight,1,5,'중요도');
    integer(course.capacity,1,50,'가상 정원');
    integer(course.rivals,0,200,'가상 경쟁자 수');
    number(course.rate,0.01,1,'가상 도착률');
    integer(course.manualOrder,1,courses.length,'사용자 신청 순서');
    if(orders.has(course.manualOrder))error('직접 정한 순서는 중복할 수 없습니다.');
    orders.add(course.manualOrder);
  }
  integer(input.seed,0,4294967295,'난수 시드');
  if(![100,1000,5000].includes(input.trials))error('반복 횟수는 100·1,000·5,000 중 선택하세요.');
  integer(input.startDelayMs,0,5000,'시작 지연');
  integer(input.actionMs,300,3000,'신청 간격');
  integer(input.jitterMs,0,1500,'행동시간 변동');
  return input;
}

/** 각 회차·과목·경쟁자에 같은 무작위값을 부여하여 비교 조건을 맞춥니다. */
function uniform(seed,trial,course,draw){
  let x=(seed^Math.imul(trial+1,0x9e3779b9)^
    Math.imul(course+3,0x85ebca6b)^Math.imul(draw+17,0xc2b2ae35))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d);
  x=Math.imul(x^(x>>>15),0x846ca68b);
  x=(x^(x>>>16))>>>0;
  return (x+0.5)/4294967296;
}
function orderedCourses(courses){
  const indices=courses.map((_,index)=>index);
  const priority=[...indices].sort((a,b)=>courses[b].weight-courses[a].weight||a-b);
  const urgency=[...indices].sort((a,b)=>{
    const first=courses[a],second=courses[b];
    const t1=first.rivals?first.capacity/(first.rivals*first.rate):Infinity;
    const t2=second.rivals?second.capacity/(second.rivals*second.rate):Infinity;
    return t1-t2||second.weight-first.weight||a-b;
  });
  const custom=[...indices].sort((a,b)=>courses[a].manualOrder-courses[b].manualOrder);
  return [priority,urgency,custom];
}
function interval(sum,squareSum,count){
  if(count<2)return 0;
  const variance=Math.max(0,(squareSum-sum*sum/count)/(count-1));
  return 1.96*Math.sqrt(variance/count);
}

/** 한 고정 가상 환경에서 세 전략을 짝지어 비교하는 Monte Carlo 계산입니다. */
export function simulate(raw){
  const scenario=validateScenario(raw);
  const {courses,trials,seed}=scenario;
  const n=courses.length;
  const orders=orderedCourses(courses);
  const weightTotal=courses.reduce((total,item)=>total+item.weight,0);
  const sums=[0,0,0],squares=[0,0,0],all=[0,0,0];
  const successes=Array.from({length:3},()=>Array(n).fill(0));
  const diffSums=[0,0],diffSquares=[0,0];
  for(let trial=0;trial<trials;trial++){
    const competitors=courses.map((course,index)=>{
      const arrivalTimes=new Float64Array(course.rivals);
      for(let k=0;k<course.rivals;k++){
        arrivalTimes[k]=-Math.log(1-uniform(seed,trial,index,k))/course.rate;
      }
      return arrivalTimes;
    });
    const times=[];
    let elapsed=scenario.startDelayMs/1000;
    for(let step=0;step<n;step++){
      const u1=uniform(seed,trial,100,2*step);
      const u2=uniform(seed,trial,100,2*step+1);
      const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      elapsed+=Math.max(100,scenario.actionMs+scenario.jitterMs*z)/1000;
      times.push(elapsed);
    }
    const scores=[];
    for(let strategy=0;strategy<3;strategy++){
      let earned=0,successCount=0;
      for(let step=0;step<n;step++){
        const index=orders[strategy][step];
        const course=courses[index];
        let ahead=0;
        for(const arrival of competitors[index])if(arrival<=times[step])ahead++;
        if(ahead<course.capacity){
          earned+=course.weight;
          successCount++;
          successes[strategy][index]++;
        }
      }
      const score=100*earned/weightTotal;
      sums[strategy]+=score;
      squares[strategy]+=score*score;
      if(successCount===n)all[strategy]++;
      scores.push(score);
    }
    for(let pair=0;pair<2;pair++){
      const difference=scores[pair]-scores[2];
      diffSums[pair]+=difference;
      diffSquares[pair]+=difference*difference;
    }
  }
  const results=STRATEGIES.map((strategy,index)=>({
    ...strategy,
    order:orders[index].map(position=>courses[position].name),
    mean:sums[index]/trials,
    margin:interval(sums[index],squares[index],trials),
    allRate:100*all[index]/trials,
    courseRates:successes[index].map(count=>100*count/trials),
  }));
  const comparisons=[0,1].map(index=>({
    first:STRATEGIES[index].id,second:'custom',
    meanDifference:diffSums[index]/trials,
    margin:interval(diffSums[index],diffSquares[index],trials),
  }));
  return {trials,seed,results,comparisons};
}

/** 혼잡도와 행동 간격을 변화시킨 다섯 가지 합성 가정을 생성합니다. */
export function sensitivityScenarios(raw){
  const base=validateScenario(raw);
  const rate=(factor)=>base.courses.map(course=>({
    ...course,rate:Math.min(1,Math.max(0.01,Math.round(course.rate*factor*10000)/10000)),
  }));
  return [
    {id:'base',label:'기준 조건',scenario:base},
    {id:'rivals-low',label:'도착률 25% 낮음',scenario:{...base,courses:rate(0.75)}},
    {id:'rivals-high',label:'도착률 25% 높음',scenario:{...base,courses:rate(1.25)}},
    {id:'action-fast',label:'신청 간격 0.3초 감소',scenario:{...base,actionMs:Math.max(300,base.actionMs-300)}},
    {id:'action-slow',label:'신청 간격 0.3초 증가',scenario:{...base,actionMs:Math.min(3000,base.actionMs+300)}},
  ];
}
