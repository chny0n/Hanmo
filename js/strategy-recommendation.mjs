/**
 * @typedef {{id:string,name:string,rank:number,capacity:number,rivals:number}} Course
 */
export const MAX_COURSES=8;
const AREA_STEPS=128;
const COMPARISON_EPSILON=1e-12;

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


/** @param {number} rivals @param {number} capacity @param {number} share */
function binomialTail(rivals,capacity,share){
  if(share===0||share===1)return share;
  const complement=capacity<=Math.floor((rivals+1)*share);
  const boundary=complement?capacity-1:capacity;
  let term=share**boundary*(1-share)**(rivals-boundary);
  for(let i=1;i<=boundary;i++)term*= (rivals+1-i)/i;
  let total=term;
  if(complement){
    const ratio=(1-share)/share;
    for(let i=boundary;i>0;i--){
      term*=i/(rivals+1-i)*ratio;
      total+=term;
    }
    return Math.max(0,1-total);
  }
  const ratio=share/(1-share);
  for(let i=boundary;i<rivals;i++){
    term*=(rivals-i)/(i+1)*ratio;
    total+=term;
  }
  return Math.min(1,total);
}

/** @param {number} slope 경합 과목들의 마감 상한 기울기 합 */
function clusteredArea(slope){
  return slope<=1?1-slope/2:1/(2*slope);
}

/** @param {Course[]} courses 중요 순위순 경합 과목 */
function makeScenarios(courses){
  const progress=Float64Array.from({length:AREA_STEPS+1},(_,i)=>(i/AREA_STEPS)**2);
  const weights=progress.map((_,i)=>((progress[i+1]??1)-(progress[i-1]??0))/2);
  // 경쟁자가 한 과목만 신청하는 경우에는 모든 신청 순서의 점수가 같습니다.
  return Array.from({length:MAX_COURSES-1},(_,index)=>{
    const rivalLoad=index+2;
    const exposure=courses.map((_,slot)=>Math.min(slot+1,rivalLoad)/rivalLoad);
    const tails=courses.map(({capacity,rivals})=>exposure.map(share=>
      progress.map(x=>binomialTail(rivals,capacity,x*share))));
    return {rivalLoad,exposure,tails,weights};
  });
}

/** @param {Course[]} courses 중요 순위순 경합 과목 */
function* permutations(courses){
  const size=courses.length;
  const positions=new Uint8Array(size);
  const sameDemandMasks=courses.map(({capacity,rivals},index)=>
    courses.slice(0,index).reduce((mask,earlier,i)=>
      earlier.capacity===capacity&&earlier.rivals===rivals?mask|(1<<i):mask,0));
  function* visit(slot,used){
    if(slot===size){
      yield positions.slice();
      return;
    }
    for(let index=0;index<size;index++){
      if(used&(1<<index))continue;
      // 정원과 경쟁자가 같은 과목들은 중요 순위를 지킵니다.
      if(sameDemandMasks[index]&~used)continue;
      positions[index]=slot;
      yield* visit(slot+1,used|(1<<index));
    }
  }
  yield* visit(0,0);
}
/**
 * @param {ReturnType<typeof makeScenarios>[number]} scenario
 * @param {number[]} pressures 자리당 경쟁자 수
 * @param {Uint8Array} positions 중요 순위별 신청 위치
 * @param {Float64Array} totals 지점별 누적 마감 상한
 * @param {Float64Array} areas 기준 상황과 중요 순위 묶음별 면적
 */
function scoreScenario({exposure,tails,weights},pressures,positions,totals,areas){
  totals.fill(0);
  let clusteredSlope=0;
  let offset=0;
  for(let rank=0;rank<positions.length;rank++){
    const arrivalTail=tails[rank][positions[rank]];
    let area=0;
    for(let i=0;i<totals.length;i++){
      totals[i]+=arrivalTail[i];
      area+=weights[i]*Math.max(0,1-totals[i]);
    }
    clusteredSlope+=pressures[rank]*exposure[positions[rank]];
    areas[offset++]=area;
    areas[offset++]=clusteredArea(clusteredSlope);
    // 묶음 안의 과목을 하나씩 골라 경쟁자들이 그 과목을 첫 번째로 신청하는 상황을 비교합니다.
    for(let firstChoice=0;firstChoice<=rank;firstChoice++){
      const extra=pressures[firstChoice]*(1-exposure[positions[firstChoice]]);
      areas[offset++]=clusteredArea(clusteredSlope+extra);
    }
  }
}

/**
 * @param {ReturnType<typeof makeScenarios>[number]} scenario
 * @param {number[]} pressures
 * @param {Uint8Array[]} orders
 * @param {Float64Array} worstLosses
 */
function compareScenario(scenario,pressures,orders,worstLosses){
  const count=pressures.length;
  // 묶음마다 분산·동시 신청과 묶음 안 각 과목의 첫 선택을 비교합니다.
  const scoreCount=count*(count+5)/2;
  const best=new Float64Array(scoreCount);
  const totals=new Float64Array(scenario.weights.length);
  const cached=new Map();
  const rows=orders.map(positions=>{
    // 상대 신청이 끝난 뒤의 위치들은 같은 점수 행을 공유합니다.
    const key=positions.reduce((code,slot)=>(code<<3)|Math.min(slot,scenario.rivalLoad-1),0);
    if(cached.has(key))return cached.get(key);
    const scores=new Float64Array(scoreCount);
    scoreScenario(scenario,pressures,positions,totals,scores);
    for(let i=0;i<scoreCount;i++)best[i]=Math.max(best[i],scores[i]);
    cached.set(key,scores);
    return scores;
  });
  for(let order=0;order<orders.length;order++){
    const scores=rows[order];
    let worst=worstLosses[order];
    for(let i=0;i<scoreCount;i++)worst=Math.max(worst,1-scores[i]/best[i]);
    worstLosses[order]=worst;
  }
}

/** @param {Course[]} courses 입력 과목 */
export function recommendCourses(courses){
  validateCourses(courses);
  const ranked=[...courses].sort((a,b)=>a.rank-b.rank);
  const contested=ranked.filter(course=>course.rivals>=course.capacity);
  const unfilled=ranked.filter(course=>course.rivals<course.capacity);
  if(contested.length<=1)return [...contested,...unfilled];

  const orders=[...permutations(contested)];
  const losses=new Float64Array(orders.length);
  const pressures=contested.map(course=>course.rivals/course.capacity);
  for(const scenario of makeScenarios(contested))compareScenario(scenario,pressures,orders,losses);

  let best=0;
  for(let i=1;i<losses.length;i++){
    if(losses[i]<losses[best]-COMPARISON_EPSILON)best=i;
  }
  const recommended=new Array(contested.length);
  orders[best].forEach((slot,rank)=>{recommended[slot]=contested[rank];});
  return recommended.concat(unfilled);
}
