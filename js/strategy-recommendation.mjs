/**
 * @typedef {{id:string,name:string,rank:number,capacity:number,rivals:number}} Course
 */
export const MAX_COURSES=8;
// 이전 합성 엔진의 응답 범위(1~3초)를 상대 차례 비교용 눈금으로만 사용합니다.
const RESPONSE_STEPS=[1,2,3];

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
    // 대상 과목이 각 신청 차례에 고르게 흩어진 경우의 마감 차례입니다.
    const closing=courses.map(({capacity,rivals})=>
      rivals<capacity?Infinity:Math.ceil(capacity*rivalCourses/rivals));
    for(const rivalStep of RESPONSE_STEPS){
      for(const rivalFirst of [false,true]){
        const visited=new Set();
        function visit(slot,elapsed,deadlines){
          const rivalRounds=rivalFirst?1+Math.floor(elapsed/rivalStep):Math.ceil(elapsed/rivalStep);
          const next=deadlines.map((deadline,index)=>{
            const round=closing[index];
            if(round===Infinity)return slots-1;
            return rivalRounds<round?slot:deadline;
          });
          if(slot===slots-1||next.every((deadline,index)=>deadline===deadlines[index])){
            record(next);
            return;
          }
          const key=slot+':'+elapsed+':'+next.join(',');
          if(visited.has(key))return;
          visited.add(key);
          for(const response of RESPONSE_STEPS)visit(slot+1,elapsed+response,next);
        }
        visit(0,0,closing.map(round=>round===Infinity?slots-1:-1));
      }
    }
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
  const scenarios=openingScenarios(byRank);
  if(!scenarios.length)return byRank;

  const order=[];
  let best=[];
  let bestLoss=Infinity,bestReversals=Infinity;
  function search(used,reversals){
    // 손실 0은 더 줄일 수 없습니다. 동점 순서는 중요 순위대로 먼저 방문합니다.
    if(bestLoss===0&&reversals>=bestReversals)return;
    if(order.length===byRank.length){
      let worstLoss=0;
      for(const {deadlines,bestCount} of scenarios){
        let count=0;
        for(let slot=0;slot<order.length;slot++){
          if(slot<=deadlines[order[slot]])count++;
        }
        worstLoss=Math.max(worstLoss,bestCount-count);
        if(worstLoss>bestLoss)return;
      }
      if(worstLoss<bestLoss||(worstLoss===bestLoss&&reversals<bestReversals)){
        best=[...order];
        bestLoss=worstLoss;
        bestReversals=reversals;
      }
      return;
    }
    let remainingHigherPriority=0;
    for(let next=0;next<byRank.length;next++){
      const bit=1<<next;
      if(used&bit)continue;
      order.push(next);
      search(used|bit,reversals+remainingHigherPriority);
      order.pop();
      remainingHigherPriority++;
    }
  }
  search(0,0);
  return best.map(index=>byRank[index]);
}
