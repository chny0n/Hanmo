import {describe,it,expect} from 'vitest';
import {creditUnits,normalizeStudentCourse,upcomingTerms,compareProvisionalScenario} from './student-progress.js';

const AS_OF='2026-11-20T08:00:00+09:00';
const record={courseId:'ECON101',credits:3,term:'2025-1',slot:'EARNED' as const};
describe('#63 local-only student graduation/ABC scenario preview',()=>{
  it('supports 0.5-credit units and refuses rounding or unknown slots',()=>{
    expect(creditUnits(3)).toBe(6);
    expect(creditUnits(2.5)).toBe(5);
    expect(()=>creditUnits(3.3)).toThrow(/0.5/);
    expect(()=>normalizeStudentCourse({...record,slot:'APPROVED' as never})).toThrow(/취득/);
    expect(()=>normalizeStudentCourse({...record,courseId:'<script>'})).toThrow(/학수번호/);
  });
  it('uses Korea time for upcoming two to four regular semesters',()=>{
    expect(upcomingTerms(AS_OF,4)).toEqual(['2027-1','2027-2','2028-1','2028-2']);
    expect(upcomingTerms('2026-08-31T23:00:00+09:00',2)).toEqual(['2026-2','2027-1']);
    expect(upcomingTerms('2026-09-01T00:00:00+09:00',2)).toEqual(['2027-1','2027-2']);
  });
  it('reuses the credit ledger core but never generates an approved graduation state',()=>{
    const r=compareProvisionalScenario({
      asOf:AS_OF,scenario:'A',records:[record],
      plans:[{courseId:'ECON201',credits:3,term:'2027-1'}],
    });
    expect(r.officialDecisionAvailable).toBe(false);
    expect(r.audit.state).toBe('INSUFFICIENT_DATA');
    expect(r.audit.earnedCreditUnits).toBe(6);
    expect(r.audit.plannedCreditUnits).toBe(6);
    expect(r.audit.requirements).toEqual([]);
    expect(r.terms).toHaveLength(2);
  });
  it('keeps A/B/C scenarios separate, including their planning horizon',()=>{
    const a=compareProvisionalScenario({asOf:AS_OF,scenario:'A',records:[],
      plans:[{courseId:'ABC1',credits:2,term:'2027-1'}]});
    const b=compareProvisionalScenario({asOf:AS_OF,scenario:'B',records:[],
      plans:[{courseId:'ABC1',credits:2,term:'2027-1'},{courseId:'ABC2',credits:2,term:'2028-1'}]});
    const c=compareProvisionalScenario({asOf:AS_OF,scenario:'C',records:[],
      plans:[{courseId:'ABC1',credits:2,term:'2027-1'},{courseId:'ABC3',credits:2,term:'2028-2'}]});
    expect([a.audit.plannedCreditUnits,b.audit.plannedCreditUnits,c.audit.plannedCreditUnits])
      .toEqual([4,8,8]);
    expect([a.terms.length,b.terms.length,c.terms.length]).toEqual([2,3,4]);
    expect(()=>compareProvisionalScenario({asOf:AS_OF,scenario:'A',records:[],
      plans:[{courseId:'ABC4',credits:3,term:'2028-1'}]})).toThrow(/기간 밖/);
  });
  it('does not double-count a course already earned and reports uncertain rows',()=>{
    const r=compareProvisionalScenario({asOf:AS_OF,scenario:'A',records:[record],
      plans:[{courseId:'ECON101',credits:3,term:'2027-1'}]});
    expect(r.audit.earnedCreditUnits).toBe(6);
    expect(r.audit.plannedCreditUnits).toBe(0);
    expect(r.audit.excludedAttempts.length).toBeGreaterThan(0);
  });
  it('withholds future earned semesters and missing rule packs even with a valid ID',()=>{
    const r=compareProvisionalScenario({asOf:AS_OF,scenario:'B',
      records:[{courseId:'ECON101',credits:3,term:'2027-1',slot:'EARNED'}],plans:[]});
    expect(r.audit.earnedCreditUnits).toBe(0);
    expect(r.audit.state).toBe('INSUFFICIENT_DATA');
    expect(r.audit.caveats.some(x=>x.includes('rule pack'))).toBe(true);
  });
});
