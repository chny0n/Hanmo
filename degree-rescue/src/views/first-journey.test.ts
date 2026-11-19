import {describe,it,expect} from 'vitest';
import {AcademicEventSchema,buildAcademicAgenda,type AcademicEvent,type AcademicEventInput} from '../core/academic-schedule.js';
import {importantNotices} from '../core/important-notices.js';
import {studentDeadlineDisplay,academicSourceLink} from '../core/academic-display.js';
import {forecastOffering} from '../core/forecast/offering.js';
import {studentForecastInput} from './forecast-student-input.js';
import {normalizeStudentEntry} from './student-entry.js';

const NOW='2026-11-20T07:00:00+09:00';
const entry=normalizeStudentEntry({campus:'SEOUL',major:'경제학부',cohort:2024});
const profile={campus:entry.campus,majors:[entry.major],cohort:entry.cohort};
const notice=(id:string,extra:Partial<AcademicEventInput>={}):AcademicEvent=>
  AcademicEventSchema.parse({
    id,revision:'r1',title:'수강 관련 학사 안내 '+id,type:'COURSE_REGISTRATION',
    source:{title:'공식 게시목록에서 참고한 제목',url:'https://hufs.ac.kr/example',
      publishedDate:'2026-11-18',review:'REFERENCE_ONLY'},
    studentActionRequired:true,...extra,
  });

describe('#39 phase-one student journey trust regression',()=>{
  it('keeps a title-only university-domain notice as a review candidate without a D-day',()=>{
    const e=notice('TITLE');
    const agenda=buildAcademicAgenda({asOf:NOW,profile,events:[e]});
    const top=importantNotices(profile,agenda.items);
    expect(academicSourceLink(e.source.url)).toBe('HUFS_DOMAIN');
    expect(top.mode).toBe('MAJOR_SELECTED');
    expect(top.confirmed).toEqual([]);
    expect(top.toCheck.map(i=>i.event.id)).toEqual(['TITLE']);
    expect(top.toCheck[0]?.appliesTo).toBe('UNKNOWN');
    expect(studentDeadlineDisplay(top.toCheck[0]!).kind).toBe('NONE');
    expect(agenda.dueSoonCount).toBe(0);
  });
  it('does not approve a user-provided SOURCE_REVIEWED claim or mint a verified deadline',()=>{
    const e=notice('USER-FLAG',{
      source:{title:'자가 표시한 검수 자료',url:'https://hufs.ac.kr/example',
        publishedDate:'2026-11-18',review:'SOURCE_REVIEWED',reviewedAt:'2026-11-19T06:00:00+09:00'},
      scope:{campuses:['SEOUL'],majors:['경제학부']},
      deadlineAt:'2026-11-24T17:00:00+09:00',
    });
    const agenda=buildAcademicAgenda({asOf:NOW,profile,events:[e]});
    expect(importantNotices(profile,agenda.items).confirmed).toHaveLength(0);
    expect(agenda.items[0]?.evidence).toBe('NEEDS_SOURCE_CHECK');
    expect(studentDeadlineDisplay(agenda.items[0]!).kind).toBe('UNVERIFIED');
    expect(studentDeadlineDisplay(agenda.items[0]!).status).toMatch(/D-day 없음/);
  });
  it('keeps later cancellations and duplicate revision IDs out of pinned notices',()=>{
    const older=notice('REV',{
      source:{title:'기존 검수 원문',url:'https://hufs.ac.kr/example',
        publishedDate:'2026-11-18',review:'SOURCE_REVIEWED',reviewedAt:'2026-11-19T06:00:00+09:00'},
      scope:{campuses:['SEOUL'],majors:['경제학부']},
      deadlineAt:'2026-11-24T17:00:00+09:00',
    });
    const cancelled=AcademicEventSchema.parse({...older,revision:'r2',state:'CANCELLED'});
    const agenda=buildAcademicAgenda({
      asOf:NOW,profile,events:[older,cancelled],trustedReviewedEvents:[older],
    });
    expect(agenda.items).toHaveLength(0);
    expect(agenda.excluded).toHaveLength(2);
    expect(importantNotices(profile,agenda.items).confirmed).toHaveLength(0);
  });
  it('never promotes missing course history to confirmed offering or a probability',()=>{
    const request=studentForecastInput({
      courseId:'ABC1234',year:2027,semester:'1',asOf:NOW,
    });
    const forecast=forecastOffering(request);
    expect(forecast.signal).toBe('UNKNOWN');
    expect(forecast.evidenceRefs).toEqual([]);
    expect(forecast.sameSeasonObservedTerms).toBe(0);
    expect(forecast.sameSeasonOfferedTerms).toBe(0);
  });
  it('does not identify a student or decide eligibility from an unverified major entry',()=>{
    expect(entry).toEqual({schemaVersion:1,campus:'SEOUL',major:'경제학부',cohort:2024});
    const other=notice('DIFFERENT-MAJOR',{scope:{majors:['철학과']}});
    const agenda=buildAcademicAgenda({asOf:NOW,profile,events:[other]});
    expect(agenda.items[0]?.appliesTo).toBe('NO');
    expect(importantNotices(profile,agenda.items).toCheck).toHaveLength(0);
  });
});
