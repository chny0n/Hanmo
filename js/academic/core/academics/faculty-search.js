// @ts-check
/** @typedef {import('./faculty-directory.js').FacultyTimetableRow} FacultyTimetableRow */

/**
 * Search a student-supplied timetable locally. No network requests or student record lookup.
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
