// @ts-check
/** @typedef {import('./academic-schedule.js').AcademicAgendaItem} AcademicAgendaItem */
/** @typedef {'NONE'|'HUFS_DOMAIN'|'OTHER_HTTPS'} AcademicSourceLink */
/** @typedef {{kind:'NONE'|'VERIFIED'|'SYNTHETIC'|'UNVERIFIED',status:string}} DeadlineDisplay */

/**
 * 주전공을 선택하지 않았다면 이중전공 입력만으로 화면의 전공 목록을 만들지 않는다.
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
 * 학교 도메인과 주소가 일치해도 공지 내용의 실제 검수·승인을 증명하지 않는다.
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
 * 검수하지 않았거나 학생에게 적용되지 않는 마감일을 확정된 학생용 D-day로 표시하지 않는다.
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
