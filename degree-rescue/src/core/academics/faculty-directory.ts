import {importWisTimetable,withoutBlocks,type TimetableImport,type TimetableImportRequest,type TimetableRow} from './wis-timetable.js';

/**
 * The original HUFS One AI WIS parser discards the publicly displayed 담당교수 cell.
 * This add-on preserves only that display label, bound to the verified saved-page
 * course row. It does NOT establish a faculty identity, employment status,
 * enrollment capacity, professor review, or university endorsement.
 *
 * The HTML is supplied by the user and processed locally; nothing is fetched.
 */
export type FacultyTimetableRow=TimetableRow&{instructor:string|null};
export type FacultyTimetableImport=Omit<TimetableImport,'rows'>&{rows:FacultyTimetableRow[]};

const entities:Readonly<Record<string,string>>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#39':"'"};
function plainText(fragment:string):string{
  const stripped=fragment.replace(/<[^>]*>/g,' ');
  const decoded=stripped.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi,(whole,name:string)=>{
    const key=name.toLowerCase();
    if(Object.prototype.hasOwnProperty.call(entities,key))return entities[key]!;
    if(key.startsWith('#x')){
      const point=Number.parseInt(key.slice(2),16);
      return point>=0&&point<=0x10ffff?String.fromCodePoint(point):whole;
    }
    if(key.startsWith('#')){
      const point=Number(key.slice(1));
      return Number.isInteger(point)&&point>=0&&point<=0x10ffff?String.fromCodePoint(point):whole;
    }
    return whole;
  });
  return decoded.replace(/\s+/g,' ').trim();
}
const columns=(row:string):string[]=>
  [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(match=>match[1]!);
const undecided=/^(?:미정|미배정|담당교수\s*미정|tba|unknown|–|-|)$/i;

export function extractFacultyFromSavedTimetable(input:TimetableImportRequest):FacultyTimetableImport{
  if(input.html.length>5_000_000)throw new RangeError('Saved timetable is too large');
  // The original strict parser first validates the save-source URL, header,
  // completeness of table/card listing, course links, and term.
  const verified=importWisTimetable(input);
  const page=withoutBlocks(withoutBlocks(input.html,'script'),'comment');
  const cellRows=[...page.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(match=>columns(match[1]!))
    .filter(cells=>cells.length>0&&/^\d+$/.test(plainText(cells[0]!)));
  if(cellRows.length!==verified.rows.length)
    throw new TypeError('Saved timetable course/lecturer row count does not match');

  const rows=verified.rows.map((course,index):FacultyTimetableRow=>{
    const cells=cellRows[index]!;
    if(cells.length!==13
      || Number(plainText(cells[0]!))!==course.no
      || plainText(cells[3]!).toUpperCase()!==course.rawCode
      || plainText(cells[4]!)!==course.title){
      throw new TypeError('Saved timetable course/lecturer row alignment differs');
    }
    const name=plainText(cells[7]!);
    return {...course,instructor:undecided.test(name)?null:name};
  });
  return {...verified,rows};
}
