/**
 * @typedef {{id:string,name:string,rank:number,capacity:number,rivals:number}} Course
 */
export const MAX_COURSES=8;

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

/** @param {Course[]} courses 입력 과목 */
export function recommendCourses(courses){
  validateCourses(courses);
  const byRank=[...courses].sort((a,b)=>a.rank-b.rank);
  const pressure=byRank.map(({rivals,capacity})=>rivals/(capacity+rivals));
  if(pressure.every((value,index)=>index===0||pressure[index-1]>=value))return byRank;
  const pairCount=courses.length*(courses.length-1)/2;
  // 더 경쟁이 큰 과목을 뒤에 놓았을 때 발생하는 과목 쌍별 비용입니다.
  const delay=pressure.map(first=>pressure.map(later=>Math.max(0,later-first)));

  const order=[];
  let best=[];
  let bestWorst=Infinity,bestTotal=Infinity;
  const tolerance=1e-12;
  function search(used,reversals,delayCost){
    if(order.length===byRank.length){
      const rankLoss=reversals/pairCount,competitionLoss=delayCost/pairCount;
      const worst=Math.max(rankLoss,competitionLoss),total=rankLoss+competitionLoss;
      if(worst<bestWorst-tolerance||(Math.abs(worst-bestWorst)<=tolerance&&total<bestTotal-tolerance)){
        best=[...order];
        bestWorst=worst;
        bestTotal=total;
      }
      return;
    }
    for(let next=0;next<byRank.length;next++){
      const bit=1<<next;
      if(used&bit)continue;
      let addedReversals=0,addedDelay=0;
      for(const previous of order){
        if(previous>next)addedReversals++;
        addedDelay+=delay[previous][next];
      }
      order.push(next);
      search(used|bit,reversals+addedReversals,delayCost+addedDelay);
      order.pop();
    }
  }
  search(0,0,0);
  return best.map(index=>byRank[index]);
}
