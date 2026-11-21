// @ts-check
import Papa from 'papaparse';

/**
 * HUFS One AI에서 이식한 강의 요건 CSV 정규화 로직이다.
 * 운영자 검수 권한이 없는 브라우저 가져오기이므로 모든 입력 행을 UNVERIFIED로 둔다.
 */
export const LOCAL_CURRICULUM_CSV_HEADERS=/** @type {const} */ ([
  'courseCode','courseName','credits','category','major','semester','campus','cohort'
]);

/**
 * @typedef {{
 *   courseCode:string, courseName:string, creditUnits:number, category:string,
 *   major:string, semester:string, campus:string, cohort:string,
 *   verification:'UNVERIFIED'|'NEEDS_REVIEW'
 * }} LocalCurriculumCourse
 */
/**
 * @typedef {{
 *   courses:LocalCurriculumCourse[], duplicateRows:number,
 *   source:'USER_SUPPLIED_LOCAL_CSV', scope:'UNVERIFIED'
 * }} LocalCurriculumImport
 */

/**
 * CSV의 셀 수·공식과 유사한 수식·학수번호/학기 형식을 검사하고 신뢰 상태를 보수적으로 반환한다.
 * @param {string} csv 학생이 브라우저에서 제공한 CSV 문자열
 * @returns {LocalCurriculumImport} 검수를 주장하지 않는 로컬 강의 기록
 */
export function parseLocalCurriculumCsv(csv){
  if(new TextEncoder().encode(csv).length>1_000_000)throw new TypeError('CATALOG_INVALID: file too large');
  /** @type {import('papaparse').ParseResult<string[]>} */
  const parsed=Papa.parse(csv.replace(/^\uFEFF/,''),{skipEmptyLines:'greedy'});
  if(parsed.errors.length>0||parsed.data.length>5001
    ||JSON.stringify(parsed.data[0])!==JSON.stringify(LOCAL_CURRICULUM_CSV_HEADERS)){
    throw new TypeError('CATALOG_INVALID: expected exact eight-column header');
  }
  /** @type {LocalCurriculumCourse[]} */
  const courses=[];
  /** @type {Set<string>} */
  const seen=new Set();
  /** @type {Map<string,LocalCurriculumCourse[]>} */
  const byIdentity=new Map();
  let duplicateRows=0;
  for(const raw of parsed.data.slice(1)){
    if(raw.length!==8)throw new TypeError('CATALOG_INVALID: wrong column count');
    const cells=raw.map(x=>x.trim().normalize('NFKC'));
    if(cells.some(x=>x===''||x.length>200||/^[=+@]/.test(x))){
      throw new TypeError('CATALOG_INVALID: unsafe cell');
    }
    const [courseCode,courseName,credits,category,major,semester,campus,cohort]=
      /** @type {[string,string,string,string,string,string,string,string]} */ (cells);
    if(!/^[A-Za-z0-9_.-]{1,40}$/.test(courseCode)
      ||!/^\d+(?:\.[05])?$/.test(credits)
      ||Number(credits)>30
      ||!Number.isSafeInteger(Number(credits)*2)
      ||!/^(?:\d{4}-[12]|UNKNOWN)$/.test(semester)){
      throw new TypeError('CATALOG_INVALID: invalid course data');
    }
    const rowKey=JSON.stringify(cells);
    if(seen.has(rowKey)){duplicateRows++;continue;}
    seen.add(rowKey);
    /** @type {LocalCurriculumCourse} */
    const course={
      courseCode,courseName,creditUnits:Number(credits)*2,
      category,major,semester,campus,cohort,verification:'UNVERIFIED'
    };
    const identity=JSON.stringify([courseCode,major,semester,campus,cohort]);
    const existing=byIdentity.get(identity)??[];
    if(existing.length){
      course.verification='NEEDS_REVIEW';
      for(const old of existing)old.verification='NEEDS_REVIEW';
    }
    existing.push(course);
    byIdentity.set(identity,existing);
    courses.push(course);
  }
  return {courses,duplicateRows,source:'USER_SUPPLIED_LOCAL_CSV',scope:'UNVERIFIED'};
}
