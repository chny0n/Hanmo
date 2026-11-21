// @ts-check
/** @typedef {import('./academic-schedule.js').AcademicAgendaItem} AcademicAgendaItem */
/** @typedef {'NONE'|'HUFS_DOMAIN'|'OTHER_HTTPS'} AcademicSourceLink */
/** @typedef {{kind:'NONE'|'VERIFIED'|'SYNTHETIC'|'UNVERIFIED',status:string}} DeadlineDisplay */

/**
 * Require a primary major before a secondary major can affect the local display.
 * @param {string} primary
 * @param {string} secondary
 * @returns {string[]}
 */
export function selectedMajors(primary,secondary){
  const main=primary.trim();
  if(!main)return [];
  const double=secondary.trim();
  return double&&double!==main?[main,double]:[main];
}

/**
 * Domain matching alone does not prove the contents are officially reviewed.
 * @param {string|undefined} raw
 * @returns {AcademicSourceLink}
 */
export function academicSourceLink(raw){
  if(!raw)return 'NONE';
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:')return 'NONE';
    const hostname=url.hostname.toLowerCase();
    if(url.username||url.password)return 'OTHER_HTTPS';
    return hostname==='hufs.ac.kr'||hostname.endsWith('.hufs.ac.kr')
      ?'HUFS_DOMAIN':'OTHER_HTTPS';
  }catch{return 'NONE';}
}

/**
 * Do not show unreviewed or inapplicable deadlines as verified student D-days.
 * @param {AcademicAgendaItem} item
 * @returns {DeadlineDisplay}
 */
export function studentDeadlineDisplay(item){
  if(!item.studentDeadline)return {kind:'NONE',status:'신청 마감일 미확인'};
  const trusted=item.evidence==='SOURCE_REVIEWED'&&item.appliesTo==='YES';
  const synthetic=item.evidence==='SYNTHETIC';
  if(!trusted&&!synthetic)return {kind:'UNVERIFIED',status:'D-day 없음 · 학교 공지 원문 확인'};
  /** @type {'VERIFIED'|'SYNTHETIC'} */
  const kind=trusted?'VERIFIED':'SYNTHETIC';
  const prefix=synthetic?'가상 ':'';
  if(item.priority==='OVERDUE')return {kind,status:prefix+'마감 시점 경과'};
  if(item.daysLeft===0)return {kind,status:prefix+'오늘'};
  if(item.daysLeft!==null&&item.daysLeft>0)return {kind,status:prefix+'D-'+item.daysLeft};
  return {kind,status:prefix+'일정 확인 필요'};
}
