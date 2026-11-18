import type {FacultyTimetableRow} from './faculty-directory.js';

/** Search within a browser-held saved timetable; no network or student record. */
export function searchFacultyTimetable(rows:readonly FacultyTimetableRow[],query:string):FacultyTimetableRow[]{
  const q=query.trim().normalize('NFKC').toLocaleLowerCase('ko');
  if(q==='')return [...rows];
  return rows.filter(row=>
    [row.rawCode,row.title,row.instructor??''].some(field=>
      field.normalize('NFKC').toLocaleLowerCase('ko').includes(q)
    )
  );
}
