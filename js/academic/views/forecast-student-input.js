// @ts-check
/** @typedef {import('../core/forecast/offering.js').ForecastOfferingInput} ForecastOfferingInput */

/**
 * 학생 입력만으로 학교의 실제 개설 이력이나 과목 동일성을 검증했다고 판단하지 않는다.
 * 승인된 개설 원장이 연결되지 않았을 때는 UNKNOWN으로 평가될 요청을 구성한다.
 * @param {{courseId:string,year:number,semester:string,asOf:string}} args 학생이 입력한 조회 조건
 * @returns {ForecastOfferingInput} 미검수 개설 전망 요청
 */
export function studentForecastInput(args){
  const courseId=args.courseId.trim();
  if(!courseId)throw new RangeError('과목 학수번호를 입력해 주세요.');
  if(courseId.length>80)throw new RangeError('학수번호는 80자 이하로 입력해 주세요.');
  if(!Number.isSafeInteger(args.year)||args.year<2020||args.year>2099){
    throw new RangeError('학년도는 2020~2099년 사이의 숫자로 입력해 주세요.');
  }
  if(args.semester!=='1'&&args.semester!=='2'){
    throw new RangeError('1학기 또는 2학기를 선택해 주세요.');
  }
  return {
    courseId,
    targetTerm:`${args.year}-${args.semester}`,
    asOf:args.asOf,
    courseIdentity:'EQUIVALENCE_UNVERIFIED',
    observations:[],
    officialEvents:[],
    alternatives:[],
  };
}
