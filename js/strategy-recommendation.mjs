/**
 * @typedef {{id:string,name:string,rank:number,capacity:number,rivals:number,important?:boolean}} Course
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

export const IMPORTANT_WEIGHT=2;

/** @param {Course[]} courses 입력 과목 */
export function recommendCourses(courses){
  validateCourses(courses);
  return courses.map(course=>{
    const {capacity,rivals,important}=course;
    const weight=important?IMPORTANT_WEIGHT:1;
    const weightedRivals=rivals>=capacity?rivals*weight:0;
    return {...course,weight,weightedRivals};
  }).sort((a,b)=>
    b.weightedRivals*a.capacity-a.weightedRivals*b.capacity||
    b.weight-a.weight||a.rank-b.rank);
}
