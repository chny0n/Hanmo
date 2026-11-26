/**
 * @typedef {{id:string,name:string,rank:number,capacity:number,rivals:number}} Course
 */
export const MAX_COURSES=8;
// 네트워크의 기준 및 느린 조건과 경쟁자의 응답 간격을 상대 눈금으로 비교합니다.
const NETWORK_STEPS=[1,2];
const RIVAL_PERIODS=[1,2,3];
// 내 첫 도착을 0으로 두고, 동시 도착에서는 두 순번을 모두 비교합니다.
const OPENING_OFFSETS=[-1,0,1];

/** @param {unknown} value 값 @param {number} min 최소 @param {number} max 최대 @param {string} label 항목 */
export function requireInteger(value,min,max,label){
  if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)
    throw new RangeError(label+' 입력값을 확인하세요.');
}

/** @param {Course[]} courses 입력 과목 */
export function validateCourses(courses){
  if(!Array.isArray(courses))throw new RangeError('과목이 없습니다.');
  requireInteger(courses.length,2,MAX_COURSES,'과목 수');
  const ranks=new Set(),ids=new Set();
  for(const course of courses){
    if(typeof course?.id!=='string'||!course.id||ids.has(course.id))
      throw new RangeError('과목 ID가 중복되었습니다.');
    ids.add(course.id);
    if(typeof course.name!=='string'||!course.name.trim()||course.name.length>30)
      throw new RangeError('과목 이름은 1~30자로 입력하세요.');
    requireInteger(course.rank,1,courses.length,'중요 순위');
    if(ranks.has(course.rank))throw new RangeError('중요 순위는 1부터 과목 수까지 중복 없이 설정하세요.');
    ranks.add(course.rank);
    requireInteger(course.capacity,1,300,'정원');
    requireInteger(course.rivals,0,200,'경쟁자');
  }
}

/** @param {Course[]} courses 중요 순위순 과목 */
function openingScenarios(courses){
  const scenarios=new Map();
  const slots=courses.length;
  function record(deadlines){
    const key=deadlines.join(',');
    if(scenarios.has(key)||deadlines.every(deadline=>deadline===slots-1))return;
    let bestCount=0;
    // 일찍 마감되는 과목부터 가능한 자리만 채우면 해당 조건의 최대 과목 수입니다.
    for(const deadline of [...deadlines].sort((a,b)=>a-b)){
      if(bestCount<=deadline)bestCount++;
    }
    if(bestCount>0)scenarios.set(key,{deadlines,bestCount});
  }
  for(let rivalCourses=1;rivalCourses<=MAX_COURSES;rivalCourses++){
    const closing=courses.map(({capacity,rivals})=>
      rivals<capacity?Infinity:Math.ceil(capacity*rivalCourses/rivals));
    for(const period of RIVAL_PERIODS){
      for(let drain=0;drain<=period;drain++){
        for(const rivalArrival of OPENING_OFFSETS){
          compareTiming(closing,rivalCourses,period,drain,rivalArrival,true);
          compareTiming(closing,rivalCourses,period,drain,rivalArrival,false);
        }
      }
    }
  }
  function compareTiming(closing,rivalCourses,period,drain,rivalArrival,rivalsFirst){
    const tie=rivalsFirst?0:1;
    const closesAt=closing.map(round=>rivalArrival+(round-1)*period+tie);
    const visited=new Set();
    function visit(slot,arrival,deadlines){
      const next=deadlines.map((deadline,index)=>{
        const closingTime=closesAt[index];
        if(closingTime===Infinity)return slots-1;
        return arrival<closingTime?slot:deadline;
      });
      if(slot===slots-1||next.every((deadline,index)=>deadline===deadlines[index])){
        record(next);
        return;
      }
      const key=slot+':'+arrival+':'+next.join(',');
      if(visited.has(key))return;
      visited.add(key);
      // 앞서 줄에 선 가장 최근 경쟁자 묶음까지 처리되어야 내 응답이 돌아옵니다.
      const lastAhead=Math.min(rivalCourses-1,Math.floor((arrival-rivalArrival-tie)/period));
      const ready=lastAhead<0?arrival:Math.max(arrival,rivalArrival+lastAhead*period+drain);
      for(const network of NETWORK_STEPS)visit(slot+1,ready+network,next);
    }
    visit(0,0,closesAt.map(time=>time===Infinity?slots-1:-1));
  }
  const distinct=[...scenarios.values()];
  // 최대 확보 수가 같으면 모든 과목이 더 일찍 또는 같은 때 마감되는 조건의 손실이 항상 더 큽니다.
  return distinct.filter(scenario=>!distinct.some(other=>other!==scenario&&other.bestCount===scenario.bestCount&&
    other.deadlines.every((deadline,index)=>deadline<=scenario.deadlines[index])));
}

/** @param {Course[]} courses 입력 과목 */
export function recommendCourses(courses){
  validateCourses(courses);
  const byRank=[...courses].sort((a,b)=>a.rank-b.rank);
  if(byRank.every(({capacity,rivals})=>rivals<capacity))return byRank;
  const opening=openingScenarios(byRank);
  if(!opening.length)return byRank;

  const slots=byRank.length;
  const maskCount=1<<slots;
  const usedCounts=new Uint8Array(maskCount);
  for(let mask=1;mask<maskCount;mask++)usedCounts[mask]=usedCounts[mask>>1]+(mask&1);
  const scenarios=opening.map(({deadlines,bestCount})=>{
    const byDeadline=[...deadlines.keys()].sort((a,b)=>deadlines[a]-deadlines[b]);
    const remainingBest=new Uint8Array(maskCount);
    // 이미 배치한 과목을 제외하고 마감이 빠른 순으로 남은 자리를 채웁니다.
    for(let mask=0;mask<maskCount;mask++){
      let slot=usedCounts[mask];
      for(const course of byDeadline){
        if(!(mask&(1<<course))&&slot<=deadlines[course])slot++;
      }
      remainingBest[mask]=slot-usedCounts[mask];
    }
    return {deadlines,bestCount,remainingBest};
  });
  const secured=Array.from({length:slots+1},()=>new Uint8Array(scenarios.length));
  const order=[];
  let best=[];
  let bestLoss=Infinity,bestReversals=Infinity;
  function search(used,reversals){
    const slot=order.length;
    const counts=secured[slot];
    let loss=0;
    for(let index=0;index<scenarios.length;index++){
      const {bestCount,remainingBest}=scenarios[index];
      // 남은 자리를 이 조건에 가장 유리하게 채워도 더 나빠지는 순서를 중단합니다.
      loss=Math.max(loss,bestCount-counts[index]-remainingBest[used]);
      if(loss>bestLoss||(loss===bestLoss&&reversals>=bestReversals))return;
    }
    if(slot===slots){
      best=[...order];
      bestLoss=loss;
      bestReversals=reversals;
      return;
    }
    let remainingHigherPriority=0;
    const nextCounts=secured[slot+1];
    for(let next=0;next<slots;next++){
      const bit=1<<next;
      if(used&bit)continue;
      for(let i=0;i<scenarios.length;i++){
        nextCounts[i]=counts[i]+Number(slot<=scenarios[i].deadlines[next]);
      }
      order.push(next);
      search(used|bit,reversals+remainingHigherPriority);
      order.pop();
      remainingHigherPriority++;
    }
  }
  search(0,0);
  return best.map(index=>byRank[index]);
}
