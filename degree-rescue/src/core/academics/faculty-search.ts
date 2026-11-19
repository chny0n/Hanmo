import type {FacultyTimetableRow} from './faculty-directory.js';

/** Search within a browser-held saved timetable; no network or student record. */
export function searchFacultyTimetable(rows:readonly FacultyTimetableRow[],query:string):FacultyTimetableRow[]{
  // 전각 문자·유니코드 표기 차이를 줄여 강좌명, 학수번호, 교수명에 같은 기준을 적용한다.
  const q=query.trim().normalize('NFKC').toLocaleLowerCase('ko');
  // 빈 검색어는 모든 결과를 돌려주되 배열만 복사해 목록 정렬이 원본에 영향을 주지 않게 한다.
  if(q==='')return [...rows];
  return rows.filter(row=>
    [row.rawCode,row.title,row.instructor??''].some(field=>
      field.normalize('NFKC').toLocaleLowerCase('ko').includes(q)
    )
  );
}
