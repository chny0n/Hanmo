// @ts-check
/** @import { FacultyTimetableRow } from './faculty-directory.js' */

/**
 * 학생이 제공한 시간표 안에서만 검색하며 네트워크 요청이나 학교 학적 조회는 하지 않는다.
 * @param {readonly FacultyTimetableRow[]} rows
 * @param {string} query
 * @returns {FacultyTimetableRow[]}
 */
export function searchFacultyTimetable(rows,query){
  const q=query.trim().normalize('NFKC').toLocaleLowerCase('ko');
  if(q==='')return [...rows];
  return rows.filter(row=>
    [row.rawCode,row.title,row.instructor??''].some(field=>
      field.normalize('NFKC').toLocaleLowerCase('ko').includes(q)
    )
  );
}
