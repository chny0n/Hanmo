import type {AcademicAgendaItem,AcademicProfile,AcademicEventType} from './academic-schedule.js';

/**
 * An advisory shortlist, never an eligibility decision.
 * Officially reviewed due notices are the only notices eligible for the prominent pinned area.
 * Title-only, user-imported, unverified and synthetic notices stay in a separate "check" area.
 */
const ACTION_TYPES:ReadonlySet<AcademicEventType>=new Set([
  'COURSE_PRE_REGISTRATION','COURSE_REGISTRATION','COURSE_CHANGE','COURSE_WITHDRAWAL',
  'DOUBLE_MAJOR_APPLICATION','DOUBLE_MAJOR_CHANGE','DOUBLE_MAJOR_WITHDRAWAL',
  'PRIMARY_MAJOR_DECLARATION','MINOR_APPLICATION','MINOR_CHANGE',
  'GRADUATION_EXAM','GRADUATION_THESIS','GRADUATION_CERTIFICATION',
  'LANGUAGE_CERTIFICATION','GRADUATION_APPLICATION','GRADUATION_DOCUMENT',
]);
const TYPE_ORDER:Partial<Record<AcademicEventType,number>>={
  GRADUATION_EXAM:0,DOUBLE_MAJOR_APPLICATION:1,DOUBLE_MAJOR_CHANGE:2,
  COURSE_PRE_REGISTRATION:3,COURSE_REGISTRATION:4,
  GRADUATION_THESIS:5,LANGUAGE_CERTIFICATION:6,GRADUATION_DOCUMENT:7,
};

/** No major: show the general feed only, do not pretend to personalize. */
export type ImportantNoticeMode='CHOOSE_MAJOR'|'MAJOR_SELECTED';
export interface ImportantNoticeSummary {
  mode:ImportantNoticeMode;
  /** At most two independently verified, definitely applicable, unexpired student deadlines. */
  confirmed:AcademicAgendaItem[];
  /** Unverified or not definitely applicable: suggestions requiring official-source checks. */
  toCheck:AcademicAgendaItem[];
}
function matchedMajor(item:AcademicAgendaItem,profile:AcademicProfile):boolean{
  const scoped=item.event.scope?.majors;
  return !!scoped?.length&&!!profile.majors?.some(m=>scoped.includes(m));
}
function sourceDate(item:AcademicAgendaItem):string{
  return item.event.source.publishedDate??'';
}
function order(a:AcademicAgendaItem,b:AcademicAgendaItem,profile:AcademicProfile):number{
  const match=Number(matchedMajor(b,profile))-Number(matchedMajor(a,profile));
  if(match)return match;
  const impact=(TYPE_ORDER[a.event.type]??99)-(TYPE_ORDER[b.event.type]??99);
  if(impact)return impact;
  return sourceDate(b).localeCompare(sourceDate(a))||a.event.id.localeCompare(b.event.id);
}
export function importantNotices(profile:AcademicProfile,items:readonly AcademicAgendaItem[]):ImportantNoticeSummary{
  if(!profile.majors?.some(x=>x.trim().length>0)){
    return {mode:'CHOOSE_MAJOR',confirmed:[],toCheck:[]};
  }
  const eligible=items.filter(item=>
    item.appliesTo!=='NO'&&item.event.studentActionRequired&&
    ACTION_TYPES.has(item.event.type)&&item.priority!=='OVERDUE'
  );
  const verified=eligible.filter(item=>
    item.evidence==='SOURCE_REVIEWED'&&item.appliesTo==='YES'&&
    item.studentDeadline!==null
  ).sort((a,b)=>a.sortTimestamp-b.sortTimestamp||order(a,b,profile));
  const confirmed=verified.slice(0,2);
  // Other independently reviewed notices remain in the full feed, not in the unverified group.
  const trustedIds=new Set(verified.map(item=>item.event.id));
  const toCheck=eligible.filter(item=>!trustedIds.has(item.event.id))
    .sort((a,b)=>order(a,b,profile)).slice(0,4);
  return {mode:'MAJOR_SELECTED',confirmed,toCheck};
}
