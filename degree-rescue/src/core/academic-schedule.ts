import {z} from 'zod';
import {openRequirementIdsFromAudit} from './academics/notice-links.js';
import type {AcademicAuditVNext} from '../contracts/academics/vnext.js';

/**
 * Academic-only, browser-safe adaptation of the archived HUFS One AI notice and
 * academic-calendar design. No career/opportunity feed, login, network or clock
 * dependency. Explicit asOf, source dates and applicability are mandatory.
 */
const Iso=z.iso.datetime({offset:true});
const Id=z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const Label=z.string().trim().min(1).max(240);
const Major=z.string().trim().min(1).max(100);
export const CampusSchema=z.enum(['SEOUL','GLOBAL']);
export const AcademicEventTypeSchema=z.enum([
  'SEMESTER_START','SEMESTER_END','VACATION_START','ACADEMIC_CALENDAR',
  'COURSE_PRE_REGISTRATION','COURSE_REGISTRATION','COURSE_CHANGE','COURSE_WITHDRAWAL',
  'SUMMER_COURSE','WINTER_COURSE','COURSE_OPENING','COURSE_SURVEY',
  'PRIMARY_MAJOR_DECLARATION','DOUBLE_MAJOR_APPLICATION','DOUBLE_MAJOR_CHANGE',
  'DOUBLE_MAJOR_WITHDRAWAL','MINOR_APPLICATION','MINOR_CHANGE','MAJOR_TRACK_CHANGE',
  'GRADUATION_AUDIT','GRADUATION_APPLICATION','GRADUATION_EXAM','GRADUATION_THESIS',
  'GRADUATION_CERTIFICATION','LANGUAGE_CERTIFICATION','GRADUATION_DOCUMENT',
  'GRADUATION_CEREMONY','DEGREE_CERTIFICATE','GRADUATION_WAITING',
  'GRADE_RELEASE','GRADE_CORRECTION','CREDIT_FORFEIT','CREDIT_RETAKE','CREDIT_TRANSFER',
  'ACADEMIC_LEAVE','RETURN_TO_SCHOOL','READMISSION','TUITION_PAYMENT',
  'EXCHANGE_APPLICATION','EXCHANGE_CREDIT_RECOGNITION','TEACHING_CERTIFICATE',
  'ACADEMIC_ADVICE','OTHER_ACADEMIC',
]);
export type AcademicEventType=z.infer<typeof AcademicEventTypeSchema>;
export const AcademicGroupSchema=z.enum(['SEMESTER','COURSE','MAJOR','GRADUATION','GRADE','STATUS','EXCHANGE','ACADEMIC_SUPPORT']);
export type AcademicGroup=z.infer<typeof AcademicGroupSchema>;
const GROUP:Record<AcademicEventType,AcademicGroup>={
  SEMESTER_START:'SEMESTER',SEMESTER_END:'SEMESTER',VACATION_START:'SEMESTER',ACADEMIC_CALENDAR:'SEMESTER',
  COURSE_PRE_REGISTRATION:'COURSE',COURSE_REGISTRATION:'COURSE',COURSE_CHANGE:'COURSE',
  COURSE_WITHDRAWAL:'COURSE',SUMMER_COURSE:'COURSE',WINTER_COURSE:'COURSE',
  COURSE_OPENING:'COURSE',COURSE_SURVEY:'COURSE',
  PRIMARY_MAJOR_DECLARATION:'MAJOR',DOUBLE_MAJOR_APPLICATION:'MAJOR',
  DOUBLE_MAJOR_CHANGE:'MAJOR',DOUBLE_MAJOR_WITHDRAWAL:'MAJOR',
  MINOR_APPLICATION:'MAJOR',MINOR_CHANGE:'MAJOR',MAJOR_TRACK_CHANGE:'MAJOR',
  GRADUATION_AUDIT:'GRADUATION',GRADUATION_APPLICATION:'GRADUATION',
  GRADUATION_EXAM:'GRADUATION',GRADUATION_THESIS:'GRADUATION',
  GRADUATION_CERTIFICATION:'GRADUATION',LANGUAGE_CERTIFICATION:'GRADUATION',
  GRADUATION_DOCUMENT:'GRADUATION',GRADUATION_CEREMONY:'GRADUATION',
  DEGREE_CERTIFICATE:'GRADUATION',GRADUATION_WAITING:'GRADUATION',
  GRADE_RELEASE:'GRADE',GRADE_CORRECTION:'GRADE',CREDIT_FORFEIT:'GRADE',
  CREDIT_RETAKE:'GRADE',CREDIT_TRANSFER:'GRADE',
  ACADEMIC_LEAVE:'STATUS',RETURN_TO_SCHOOL:'STATUS',READMISSION:'STATUS',TUITION_PAYMENT:'STATUS',
  EXCHANGE_APPLICATION:'EXCHANGE',EXCHANGE_CREDIT_RECOGNITION:'EXCHANGE',
  TEACHING_CERTIFICATE:'ACADEMIC_SUPPORT',ACADEMIC_ADVICE:'ACADEMIC_SUPPORT',
  OTHER_ACADEMIC:'ACADEMIC_SUPPORT',
};
export function academicGroupFor(type:AcademicEventType):AcademicGroup{return GROUP[type];}
const Term=z.string().regex(/^20\d{2}-(?:1|2|SUMMER|WINTER)$/);
const Scope=z.strictObject({
  campuses:z.array(CampusSchema).min(1).max(2).optional(),
  cohortFrom:z.number().int().min(1900).max(2100).optional(),
  cohortTo:z.number().int().min(1900).max(2100).optional(),
  majors:z.array(Major).max(40).optional(),
  graduationTerms:z.array(Term).max(20).optional(),
  enrollmentStates:z.array(z.enum(['ENROLLED','LEAVE','RETURNING','GRADUATION_PENDING'])).max(4).optional(),
}).superRefine((v,ctx)=>{
  if(v.cohortFrom!==undefined&&v.cohortTo!==undefined&&v.cohortFrom>v.cohortTo){
    ctx.addIssue({code:'custom',message:'cohortFrom must not exceed cohortTo'});
  }
});
export const AcademicEventSchema=z.strictObject({
  id:Id,revision:Id,title:Label,type:AcademicEventTypeSchema,
  state:z.enum(['ACTIVE','CANCELLED']).default('ACTIVE'),
  term:Term.optional(),
  source:z.strictObject({
    title:Label,
    url:z.url().refine(v=>v.startsWith('https://'),{message:'HTTPS source required'}).optional(),
    publishedDate:z.iso.date().optional(),
    review:z.enum(['SYNTHETIC','REFERENCE_ONLY','SOURCE_REVIEWED']),
    reviewedAt:Iso.optional(),
  }),
  scope:Scope.optional(),
  opensAt:Iso.optional(),deadlineAt:Iso.optional(),eventAt:Iso.optional(),
  /** Internal department report deadline is NEVER the student's deadline. */
  adminDeadlineAt:Iso.optional(),
  requirementRefs:z.array(Id).max(40).optional(),
  requiresOpenRequirement:z.boolean().optional(),
  courseRefs:z.array(Id).max(40).optional(),
  studentActionRequired:z.boolean().default(true),
  memo:z.string().trim().max(1000).optional(),
}).superRefine((v,ctx)=>{
  if(v.opensAt&&v.deadlineAt&&Date.parse(v.opensAt)>Date.parse(v.deadlineAt)){
    ctx.addIssue({code:'custom',path:['deadlineAt'],message:'deadline must not precede opening'});
  }
  if(v.source.review==='SOURCE_REVIEWED'&&(!v.source.url||!v.source.reviewedAt)){
    ctx.addIssue({code:'custom',path:['source'],message:'reviewed source requires HTTPS URL and reviewedAt'});
  }
  if(v.requiresOpenRequirement&&!v.requirementRefs?.length){
    ctx.addIssue({code:'custom',path:['requirementRefs'],message:'required evidence-linked event has no requirement refs'});
  }
});
export type AcademicEvent=z.infer<typeof AcademicEventSchema>;
export type AcademicEventInput=z.input<typeof AcademicEventSchema>;
export const AcademicScheduleSchema=z.strictObject({
  schemaVersion:z.literal(1),events:z.array(z.unknown()).max(1000),
});
export type AcademicScheduleImport={events:AcademicEvent[];invalid:{index:number;reason:string}[]};
export function parseAcademicSchedule(source:unknown):AcademicScheduleImport{
  const parsed=AcademicScheduleSchema.parse(source);
  const events:AcademicEvent[]=[];const invalid:{index:number;reason:string}[]=[];
  for(let i=0;i<parsed.events.length;i++){
    const item=AcademicEventSchema.safeParse(parsed.events[i]);
    if(item.success)events.push(item.data);
    else invalid.push({index:i,reason:item.error.issues.slice(0,3).map(x=>x.path.join('.')+': '+x.message).join('; ')});
  }
  return {events,invalid};
}
/** Same-origin, tab-scoped, untrusted hints from the standalone ledger calculator.
 * Never move the complete student ledger into the timeline or treat this as school evidence. */
export const ACADEMIC_AUDIT_BRIDGE_KEY='hanmo:degree-rescue:local-audit-hints:v1';
export const AcademicAuditHintSchema=z.strictObject({
  schemaVersion:z.literal(1),
  origin:z.literal('LOCAL_CALCULATOR'),
  generatedAt:Iso,
  asOf:Iso,
  rulePackVersion:Id,
  state:z.enum(['READY','NEEDS_REVIEW','INSUFFICIENT_DATA']),
  candidateOpenRequirementIds:z.array(Id).max(200).nullable(),
});
export const AcademicProfileSchema=z.strictObject({
  campus:CampusSchema.optional(),
  cohort:z.number().int().min(1900).max(2100).optional(),
  majors:z.array(Major).max(5).optional(),
  targetGraduationTerm:Term.optional(),
  enrollmentState:z.enum(['ENROLLED','LEAVE','RETURNING','GRADUATION_PENDING']).optional(),
  /** null is unknown; [] is a verified no-open-requirements state, not the same thing. */
  /** Independently confirmed results only; never populated from student-entered JSON. */
  openRequirementIds:z.array(Id).max(200).nullable().optional(),
  /** Student/locally computed hints; may prioritize but MUST NOT prove applicability or completion. */
  candidateOpenRequirementIds:z.array(Id).max(200).optional(),
});
export type AcademicProfile=z.infer<typeof AcademicProfileSchema>;
export type Applies='YES'|'NO'|'UNKNOWN';
export type Evidence='SYNTHETIC'|'SOURCE_REVIEWED'|'NEEDS_SOURCE_CHECK';
export type Priority='DUE_SOON'|'UPCOMING'|'OVERDUE'|'DATE_UNKNOWN'|'INFORMATION';
export interface AcademicAgendaItem{
  event:AcademicEvent;group:AcademicGroup;appliesTo:Applies;scopeUnknown:readonly string[];
  candidateRequirementMatch:boolean;
  evidence:Evidence;priority:Priority;studentDeadline:string|null;daysLeft:number|null;sortTimestamp:number;
}
export interface AcademicAgenda{
  asOf:string;items:AcademicAgendaItem[];
  excluded:{id:string;reason:'DUPLICATE_ID'|'CANCELLED'|'FUTURE_PUBLICATION'|'INVALID_TIME'}[];
  dueSoonCount:number;reviewNeededCount:number;relevantCount:number;
}
const one=(required:readonly string[]|undefined,actual:string|undefined,field:string,unknown:string[]):boolean=>{
  if(!required?.length)return false;
  if(actual===undefined){unknown.push(field);return false;}
  return !required.includes(actual);
};
/** Missing student attributes are UNKNOWN, never inferred from the person's other fields. */
export function noticeApplicability(profile:AcademicProfile,event:AcademicEvent,independentlyReviewed=false):{state:Applies;unknown:string[]}{
  const scope=event.scope;const unknown:string[]=[];
  let mismatch=false;
  if(scope){
  mismatch=one(scope.campuses,profile.campus,'campus',unknown);
  if(scope.cohortFrom!==undefined||scope.cohortTo!==undefined){
    if(profile.cohort===undefined)unknown.push('cohort');
    else if((scope.cohortFrom!==undefined&&profile.cohort<scope.cohortFrom)||
      (scope.cohortTo!==undefined&&profile.cohort>scope.cohortTo))mismatch=true;
  }
  if(scope.majors?.length){
    if(!profile.majors?.length)unknown.push('major');
    else if(!scope.majors.some(m=>profile.majors!.includes(m)))mismatch=true;
  }
  if(one(scope.graduationTerms,profile.targetGraduationTerm,'graduationTerm',unknown))mismatch=true;
  if(one(scope.enrollmentStates,profile.enrollmentState,'enrollmentState',unknown))mismatch=true;
  }
  // A title-only notice cannot prove which students actually qualify.
  if(event.source.review==='REFERENCE_ONLY')unknown.push('noticeDetails');
  // SOURCE_REVIEWED inside a JSON file is self-asserted. It is not an operator attestation.
  if(event.source.review==='SOURCE_REVIEWED'&&!independentlyReviewed)unknown.push('sourceVerification');
  if(event.requiresOpenRequirement){
    if(profile.openRequirementIds===null||profile.openRequirementIds===undefined){
      const candidateMatch=event.requirementRefs?.some(ref=>profile.candidateOpenRequirementIds?.includes(ref));
      unknown.push(candidateMatch?'localRequirementCandidate':'graduationRequirement');
    }else if(!event.requirementRefs?.some(ref=>profile.openRequirementIds!.includes(ref)))mismatch=true;
  }
  return {state:mismatch?'NO':unknown.length?'UNKNOWN':'YES',unknown:mismatch?[]:unknown};
}
export function openRequirementsFromAudit(audit:AcademicAuditVNext|null|undefined):string[]|null{
  return openRequirementIdsFromAudit(audit);
}
const KST=9*3600000,DAY=86400000;
const kstDateNumber=(iso:string):number=>Math.floor((Date.parse(iso)+KST)/DAY);
const anyTimestamp=(e:AcademicEvent):number=>{
  const v=e.deadlineAt??e.eventAt??e.opensAt;
  return v?Date.parse(v):Number.POSITIVE_INFINITY;
};
function sourceEvidence(event:AcademicEvent,independentlyReviewed:boolean):Evidence{
  if(event.source.review==='SYNTHETIC')return 'SYNTHETIC';
  return independentlyReviewed?'SOURCE_REVIEWED':'NEEDS_SOURCE_CHECK';
}
/** Local viewer, no live institution lookup, no fabricated or inferred deadlines. */
export function buildAcademicAgenda(request:{
  asOf:string;profile:AcademicProfile;events:readonly AcademicEvent[];
  /** In-memory references supplied ONLY by the operator-reviewed bundled-data loader.
   * Never populate from a user-uploaded JSON field, URL, timestamp, or event ID. */
  trustedReviewedEvents?:readonly AcademicEvent[];
}):AcademicAgenda{
  if(!Iso.safeParse(request.asOf).success)throw new RangeError('asOf needs offset-aware ISO time');
  const profile=AcademicProfileSchema.parse(request.profile);
  const now=Date.parse(request.asOf);
  const reviewedObjects=new Set(request.trustedReviewedEvents??[]);
  const counts=new Map<string,number>();
  request.events.forEach(e=>counts.set(e.id,(counts.get(e.id)||0)+1));
  const items:AcademicAgendaItem[]=[];const excluded:AcademicAgenda['excluded']=[];
  for(const event of request.events){
    if((counts.get(event.id)||0)>1){excluded.push({id:event.id,reason:'DUPLICATE_ID'});continue;}
    if(event.state==='CANCELLED'){excluded.push({id:event.id,reason:'CANCELLED'});continue;}
    if(event.source.publishedDate
      &&Date.parse(event.source.publishedDate+'T00:00:00+09:00')>now){
      excluded.push({id:event.id,reason:'FUTURE_PUBLICATION'});continue;
    }
    const times=[event.opensAt,event.deadlineAt,event.eventAt,event.adminDeadlineAt];
    if(times.some(v=>v!==undefined&&!Number.isFinite(Date.parse(v)))){
      excluded.push({id:event.id,reason:'INVALID_TIME'});continue;
    }
    const independentlyReviewed=event.source.review==='SOURCE_REVIEWED'
      &&!!event.source.reviewedAt&&Date.parse(event.source.reviewedAt)<=now
      &&reviewedObjects.has(event);
    const applicability=noticeApplicability(profile,event,independentlyReviewed);
    const candidateRequirementMatch=!!event.requirementRefs?.some(ref=>
      profile.candidateOpenRequirementIds?.includes(ref));
    const due=event.deadlineAt?Date.parse(event.deadlineAt):null;
    const daysLeft=due===null?null:kstDateNumber(event.deadlineAt!)-kstDateNumber(request.asOf);
    const priority:Priority=due!==null
      ?due<=now?'OVERDUE':daysLeft!==null&&daysLeft<=7?'DUE_SOON':'UPCOMING'
      :(event.eventAt||event.opensAt)?'INFORMATION':'DATE_UNKNOWN';
    items.push({
      event,group:academicGroupFor(event.type),appliesTo:applicability.state,scopeUnknown:applicability.unknown,
      candidateRequirementMatch,evidence:sourceEvidence(event,independentlyReviewed),priority,studentDeadline:event.deadlineAt??null,
      daysLeft,sortTimestamp:anyTimestamp(event),
    });
  }
  const rank:Record<Applies,number>={YES:0,UNKNOWN:1,NO:2};
  items.sort((a,b)=>rank[a.appliesTo]-rank[b.appliesTo]
    ||Number(b.candidateRequirementMatch)-Number(a.candidateRequirementMatch)
    ||a.sortTimestamp-b.sortTimestamp||
    a.event.id.localeCompare(b.event.id));
  return {
    asOf:request.asOf,items,excluded,
    dueSoonCount:items.filter(x=>x.appliesTo==='YES'&&x.priority==='DUE_SOON'&&x.evidence==='SOURCE_REVIEWED').length,
    reviewNeededCount:items.filter(x=>x.appliesTo!=='NO'&&(x.appliesTo==='UNKNOWN'||x.evidence==='NEEDS_SOURCE_CHECK')).length,
    relevantCount:items.filter(x=>x.appliesTo==='YES').length,
  };
}
export const GRADUATION_STEPS=[
  {id:'TOTAL_CREDITS',title:'총 졸업 이수학점',description:'학번·캠퍼스·전공구성에 맞는 기준과 취득/수강중 학점을 구분',group:'GRADUATION'},
  {id:'GENERAL_ED',title:'교양필수·교양영역',description:'교양필수와 영역별 이수 요건, 인정·면제 여부 확인',group:'GRADUATION'},
  {id:'PRIMARY_MAJOR',title:'주전공 필수·선택',description:'전공필수 및 전공선택 학점·필수과목 확인',group:'MAJOR'},
  {id:'DOUBLE_MAJOR',title:'이중전공 신청·배정·이수',description:'신청자격·기간·변경·이중전공 필수요건 확인',group:'MAJOR'},
  {id:'MINOR_TRACK',title:'부전공·전공심화 경로',description:'본인 이수경로에 해당하면 신청·변경·요건 확인',group:'MAJOR'},
  {id:'REGISTRATION_COUNT',title:'등록학기·학적 상태',description:'이수학기/휴학/복학/등록 상태가 졸업 가능한지 확인',group:'STATUS'},
  {id:'PLAN_NEXT_TERM',title:'다음 학기 수강계획',description:'미이수 필수과목·선수요건·분반·개설 전망·신청 일정 확인',group:'COURSE'},
  {id:'GRADE_GPA',title:'성적 및 평점 요건',description:'성적정정·재수강·학점포기 가능성은 최신 규정으로 확인',group:'GRADE'},
  {id:'GRADUATION_EXAM',title:'주전공·이중전공 졸업시험',description:'시험/대체시험·응시·합격·성적보고서 일정 확인',group:'GRADUATION'},
  {id:'THESIS',title:'졸업논문 또는 대체요건',description:'학과별 논문·대체 인증·보고서 제출 일정 확인',group:'GRADUATION'},
  {id:'LANGUAGE',title:'외국어 및 졸업 인증',description:'입학년도와 전공별 인정시험·점수·제출기한 확인',group:'GRADUATION'},
  {id:'CREDIT_TRANSFER',title:'교류·교환·대체 인정학점',description:'계절학기·학점교류·교환/해외학점 인정 결과 확인',group:'GRADE'},
  {id:'GRADUATION_AUDIT',title:'최종 졸업사정 및 학적 결과',description:'졸업/수료(졸업대기)/추가 등록 여부를 학교에서 최종 확인',group:'GRADUATION'},
  {id:'FINAL_DOCUMENTS',title:'학위 수여 및 제출 서류',description:'졸업 신청·서류·학위수여식·증명서 관련 공지 확인',group:'GRADUATION'},
] as const satisfies readonly {id:string;title:string;description:string;group:AcademicGroup}[];
export type GraduationStepId=typeof GRADUATION_STEPS[number]['id'];
