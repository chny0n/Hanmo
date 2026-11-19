import {describe,expect,it} from 'vitest';
import {
  AcademicEventSchema,AcademicEventTypeSchema,AcademicProfileSchema,
  GRADUATION_STEPS,academicGroupFor,buildAcademicAgenda,noticeApplicability,
  openRequirementsFromAudit,parseAcademicSchedule,
  type AcademicEvent,type AcademicEventInput,
} from './academic-schedule.js';

const NOW='2026-11-17T15:00:00+09:00';
const profile=AcademicProfileSchema.parse({
  campus:'SEOUL',cohort:2023,majors:['경제학부'],targetGraduationTerm:'2028-2',
  enrollmentState:'ENROLLED',openRequirementIds:['GRAD-EXAM','SYN-TOTAL'],
});
const event=(over:Partial<AcademicEventInput>={}):AcademicEvent=>AcademicEventSchema.parse({
  id:'SYN-DOUBLE-01',revision:'r1',
  title:'가상 이중전공 신청',type:'DOUBLE_MAJOR_APPLICATION',
  source:{title:'가상 공지',review:'SYNTHETIC'},
  opensAt:'2026-11-16T09:00:00+09:00',
  deadlineAt:'2026-11-20T17:00:00+09:00',
  studentActionRequired:true,
  ...over,
});
const agenda=(events:AcademicEvent[],user=profile,asOf=NOW)=>
  buildAcademicAgenda({asOf,profile:user,events});

describe('academic calendar + graduation continuity',()=>{
  it('classifies every declared event and all graduation milestones',()=>{
    for(const type of AcademicEventTypeSchema.options)expect(academicGroupFor(type)).toBeTruthy();
    expect(academicGroupFor('DOUBLE_MAJOR_CHANGE')).toBe('MAJOR');
    expect(academicGroupFor('GRADUATION_EXAM')).toBe('GRADUATION');
    expect(academicGroupFor('COURSE_CHANGE')).toBe('COURSE');
    expect(academicGroupFor('ACADEMIC_LEAVE')).toBe('STATUS');
    expect(GRADUATION_STEPS.length).toBeGreaterThanOrEqual(12);
    expect(GRADUATION_STEPS.map(x=>x.id)).toContain('LANGUAGE');
    expect(GRADUATION_STEPS.map(x=>x.id)).toContain('CREDIT_TRANSFER');
  });
  it('never confuses internal administrative reporting with a student deadline',()=>{
    const result=agenda([event({
      id:'SYN-GRAD-REPORT',type:'GRADUATION_THESIS',opensAt:undefined,deadlineAt:undefined,
      adminDeadlineAt:'2026-11-18T14:00:00+09:00',
    })]);
    expect(result.items[0]?.studentDeadline).toBeNull();
    expect(result.items[0]?.daysLeft).toBeNull();
    expect(result.items[0]?.priority).toBe('DATE_UNKNOWN');
  });
  it('scopes double-major notices to known cohort/campus without inventing absent student data',()=>{
    const n=event({scope:{campuses:['GLOBAL'],cohortFrom:2022,cohortTo:2025}});
    expect(noticeApplicability(profile,n).state).toBe('NO');
    expect(noticeApplicability({majors:['경제학부']},n)).toEqual({
      state:'UNKNOWN',unknown:['campus','cohort'],
    });
    expect(noticeApplicability({...profile,campus:'GLOBAL'},n).state).toBe('YES');
  });
  it('treats missing graduation requirements as unknown, not already done',()=>{
    const n=event({id:'SYN-GRAD-EXAM',type:'GRADUATION_EXAM',
      requirementRefs:['GRAD-EXAM'],requiresOpenRequirement:true});
    expect(noticeApplicability({...profile,openRequirementIds:null},n).state).toBe('UNKNOWN');
    expect(noticeApplicability({...profile,openRequirementIds:[]},n).state).toBe('NO');
    expect(noticeApplicability(profile,n).state).toBe('YES');
  });
  it('does not turn unknown or synthetic notice into a verified urgent alert',()=>{
    const a=agenda([event()]);
    expect(a.items[0]?.priority).toBe('DUE_SOON');
    expect(a.items[0]?.evidence).toBe('SYNTHETIC');
    expect(a.dueSoonCount).toBe(0);
    expect(a.relevantCount).toBe(1);
  });
  it('a reviewed source is countable only after the stated independent review time',()=>{
    const n=event({source:{
      title:'검토된 학사 공지',review:'SOURCE_REVIEWED',
      url:'https://www.hufs.ac.kr/hufs/11377/subview.do',
      reviewedAt:'2026-11-16T12:00:00+09:00',
    }});
    const result=agenda([n]);expect(result.items[0]?.evidence).toBe('SOURCE_REVIEWED');
    expect(result.dueSoonCount).toBe(1);
    const premature=agenda([n],profile,'2026-11-16T09:00:00+09:00');
    expect(premature.items[0]?.evidence).toBe('NEEDS_SOURCE_CHECK');
  });
  it('rejects a falsely reviewed record without source and reviewedAt',()=>{
    expect(()=>event({source:{title:'미상',review:'SOURCE_REVIEWED'}})).toThrow();
    expect(()=>event({source:{title:'위험',review:'SOURCE_REVIEWED',url:'javascript:alert(1)'}})).toThrow();
  });
  it('quarantines every duplicate ID instead of choosing a convenient revision',()=>{
    const a=event(),b=event({revision:'r2',title:'가상 변경'});
    const result=agenda([a,b]);
    expect(result.items).toEqual([]);
    expect(result.excluded).toEqual([
      {id:'SYN-DOUBLE-01',reason:'DUPLICATE_ID'},
      {id:'SYN-DOUBLE-01',reason:'DUPLICATE_ID'},
    ]);
  });
  it('ignores cancelled records and records not yet published as of the query',()=>{
    const a=event({id:'SYN-CANCEL',state:'CANCELLED'});
    const b=event({id:'SYN-FUTURE',source:{title:'가상',review:'SYNTHETIC',publishedDate:'2026-11-18'}});
    const result=agenda([a,b]);
    expect(result.items).toHaveLength(0);
    expect(result.excluded.map(x=>x.reason)).toEqual(['CANCELLED','FUTURE_PUBLICATION']);
  });
  it('uses Asia/Seoul day boundaries, not raw UTC or a fixed 24-hour countdown',()=>{
    const n=event({deadlineAt:'2026-11-18T00:10:00+09:00'});
    const r=agenda([n],profile,'2026-11-17T23:50:00+09:00');
    expect(r.items[0]?.daysLeft).toBe(1);
  });
  it('separates confirmed events, incomplete sources, and absent student deadline',()=>{
    const n=event({
      id:'SYN-REF-1',type:'GRADUATION_CERTIFICATION',deadlineAt:undefined,opensAt:undefined,
      source:{title:'원문 제목만 확인',review:'REFERENCE_ONLY',publishedDate:'2026-11-05'},
    });
    const r=agenda([n]);
    expect(r.items[0]?.evidence).toBe('NEEDS_SOURCE_CHECK');
    expect(r.items[0]?.priority).toBe('DATE_UNKNOWN');
    expect(r.reviewNeededCount).toBe(1);
    expect(r.items[0]?.appliesTo).toBe('UNKNOWN');
    expect(r.items[0]?.scopeUnknown).toContain('noticeDetails');
  });
  it('parses a mixed local JSON import without letting one broken event ruin the rest',()=>{
    const imported=parseAcademicSchedule({schemaVersion:1,events:[event(),{id:'BAD',title:'부실 자료'},event({id:'SYN-SECOND'})]});
    expect(imported.events).toHaveLength(2);
    expect(imported.invalid).toHaveLength(1);
    expect(imported.invalid[0]?.index).toBe(1);
    expect(()=>parseAcademicSchedule({schemaVersion:2,events:[]})).toThrow();
  });
  it('never treats admission requirements as universally applicable by default',()=>{
    const n=event({scope:{majors:['가상학과'],graduationTerms:['2027-2']}});
    expect(noticeApplicability(profile,n).state).toBe('NO');
    expect(noticeApplicability({campus:'SEOUL'},n).state).toBe('UNKNOWN');
  });
  it('keeps an absent official academic audit explicitly unknown',()=>{
    expect(openRequirementsFromAudit(null)).toBeNull();
    expect(openRequirementsFromAudit(undefined)).toBeNull();
  });
});
