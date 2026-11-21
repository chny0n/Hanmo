// @ts-check
/** @import { TimetableAttribute as WisTimetableAttribute, TimetableImport as WisTimetableImport, TimetableRow as WisTimetableRow } from './wis-timetable.js' */

/**
 * 사용자가 저장한 학교 시간표를 운영자가 가져올 수 있는 8열 CSV로 변환한다(#133).
 * 분반마다 별도 행을 만들고 원시 9자리 학수번호·개설영역을 보존한다. 입학년도는 UNKNOWN이며 캠퍼스는 페이지에 표시된 것만 사용한다.
 * CSV에 담을 수 없는 이수구분·비고·검토 정보는 details에 보존한다. 검토가 필요한 행은 보류하고 자동 승인하지 않는다.
 */

/** 같은 저장 페이지의 변환 결과가 바뀔 때 변환기 판본을 올린다. */
export const WIS_TIMETABLE_CONVERTER_VERSION = 'hufs-wis-timetable-3';

/** apps/api의 permitted-curriculum courseCsvHeaders와 일치해야 하며 테스트로 동기화한다. */
export const SAVED_CURRICULUM_CSV_HEADERS = /** @type {const} */ (['courseCode', 'courseName', 'credits', 'category', 'major', 'semester', 'campus', 'cohort']);

/** @typedef {'NEEDS_REVIEW'|'TERM_FROM_PAGE'|'NOT_A_REGULAR_TERM'|'CELL_NOT_ACCEPTED'} WithheldReason */
/**
 * @typedef {{
 *   rawCode:string,
 *   completion:'REQUIRED'|'NOT_STATED',
 *   attributes:WisTimetableAttribute[],
 *   instructionLanguage:string|null,
 *   note:string,
 *   noteHints:WisTimetableRow['noteHints']
 * }} SavedCurriculumDetail
 * 페이지에 표시된 이수구분과 비고를 자동 공식 판정 없이 보존한다.
 */
/**
 * @typedef {{
 *   csv:string,rows:number,campus:string,details:SavedCurriculumDetail[],
 *   withheld:{no:number,rawCode:string,reason:WithheldReason}[]
 * }} SavedCurriculumCsv
 * 승인할 수 없는 행은 자동 보정하지 않고 보류한다.
 */

/** 빈 셀, 200자 초과 셀 또는 =·+·@로 시작하는 셀이 있으면 CSV 전체 가져오기를 거부한다. */
/** @param {string} cell @returns {boolean} 안전한 CSV 셀인지 확인 */
const acceptable = (cell) => cell.trim() !== '' && cell.trim().length <= 200 && !/^[=+@]/.test(cell.trim());

/** @param {string} cell @returns {string} CSV 인용 규칙에 따른 셀 */
function quote(cell) {
  return /[",\r\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}

/** @param {WisTimetableImport} page @param {{campus?:string}} [options] @returns {SavedCurriculumCsv} 검증된 시간표의 CSV 변환 결과 */
export function toSavedCurriculumCsv(page,options={}) {
  // 캠퍼스는 페이지의 값을 확인할 때만 사용하며 UNKNOWN을 임의 값으로 변경하지 않는다.
  if (options.campus !== undefined && options.campus !== page.campus) {
    throw new TypeError(`campus ${options.campus} does not match the page, which shows ${page.campus}`);
  }
  const campus = page.campus;
  if (!acceptable(page.departmentLabel)) throw new TypeError('department label is not accepted by the import');
  const lines = [SAVED_CURRICULUM_CSV_HEADERS.join(',')];
  /** @type {SavedCurriculumDetail[]} */
  const details = [];
  /** @type {SavedCurriculumCsv['withheld']} */
  const withheld = [];
  for (const row of page.rows) {
    /** @param {WithheldReason} reason */
    const hold = (reason) => withheld.push({no:row.no, rawCode:row.rawCode, reason});
    if (!page.term.academicTerm) { hold('NOT_A_REGULAR_TERM'); continue; }
    if (row.termEvidence === 'PAGE_ONLY') { hold('TERM_FROM_PAGE'); continue; }
    if (row.needsReview || row.creditUnits === null) { hold('NEEDS_REVIEW'); continue; }
    const cells = [row.rawCode, row.title, String(row.creditUnits / 2), row.areaLabel, page.departmentLabel,
      page.term.academicTerm, campus, 'UNKNOWN'];
    if (!cells.every(acceptable) || !/^[A-Za-z0-9_.-]{1,40}$/.test(row.rawCode)) { hold('CELL_NOT_ACCEPTED'); continue; }
    lines.push(cells.map(quote).join(','));
    details.push({rawCode:row.rawCode, completion:row.attributes.includes('REQUIRED') ? 'REQUIRED' : 'NOT_STATED',
      attributes:[...row.attributes], instructionLanguage:row.instructionLanguage, note:row.note, noteHints:{...row.noteHints}});
  }
  return {csv:`${lines.join('\n')}\n`, rows:lines.length - 1, campus, details, withheld};
}
