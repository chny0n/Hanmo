import type {AcademicAgendaItem} from './academic-schedule.js';

/** Explicit primary-major selection is needed before optional double-major data is considered. */
export function selectedMajors(primary:string,secondary:string):string[]{
  const main=primary.trim();
  if(!main)return [];
  const double=secondary.trim();
  return double&&double!==main?[main,double]:[main];
}

/** HTTPS under hufs.ac.kr is a domain clue, not an attestation of notice contents. */
export type AcademicSourceLink='NONE'|'HUFS_DOMAIN'|'OTHER_HTTPS';
export function academicSourceLink(raw:string|undefined):AcademicSourceLink{
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

export type DeadlineDisplay={kind:'NONE'|'VERIFIED'|'SYNTHETIC'|'UNVERIFIED';status:string};
/** Never turn self-declared JSON deadlines into official-looking D-day claims. */
export function studentDeadlineDisplay(item:AcademicAgendaItem):DeadlineDisplay{
  if(!item.studentDeadline)return {kind:'NONE',status:'신청 마감일 미확인'};
  const trusted=item.evidence==='SOURCE_REVIEWED'&&item.appliesTo==='YES';
  const synthetic=item.evidence==='SYNTHETIC';
  if(!trusted&&!synthetic)return {kind:'UNVERIFIED',status:'D-day 없음 · 학교 공지 원문 확인'};
  const kind=trusted?'VERIFIED':'SYNTHETIC';
  const prefix=synthetic?'가상 ':'';
  if(item.priority==='OVERDUE')return {kind,status:prefix+'마감 시점 경과'};
  if(item.daysLeft===0)return {kind,status:prefix+'오늘'};
  if(item.daysLeft!==null&&item.daysLeft>0)return {kind,status:prefix+'D-'+item.daysLeft};
  return {kind,status:prefix+'일정 확인 필요'};
}
