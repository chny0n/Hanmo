import type {AcademicLedgerRequest} from '../core/academics/ledger.js';
import type {ForecastOfferingInput} from '../core/forecast/offering.js';
import type {AcademicPlanRequest} from '../core/academics/plan.js';

export const DEMO_FORECAST:ForecastOfferingInput={
  courseId:'SYN-COURSE-A',targetTerm:'2027-1',asOf:'2026-11-16T00:00:00.000Z',
  courseIdentity:'RESOLVED',
  observations:[
    {term:'2023-1',state:'OFFERED',coverage:'COMPLETE_TERM_CATALOG',sourceRef:'SYN-2023-1',publishedAt:'2023-02-10T00:00:00.000Z',verifiedAt:'2023-02-11T00:00:00.000Z'},
    {term:'2024-1',state:'OFFERED',coverage:'COMPLETE_TERM_CATALOG',sourceRef:'SYN-2024-1',publishedAt:'2024-02-10T00:00:00.000Z',verifiedAt:'2024-02-11T00:00:00.000Z'},
    {term:'2025-1',state:'CONFIRMED_NOT_OFFERED',coverage:'COMPLETE_TERM_CATALOG',sourceRef:'SYN-2025-1',publishedAt:'2025-02-10T00:00:00.000Z',verifiedAt:'2025-02-11T00:00:00.000Z'},
    {term:'2026-1',state:'OFFERED',coverage:'COMPLETE_TERM_CATALOG',sourceRef:'SYN-2026-1',publishedAt:'2026-02-10T00:00:00.000Z',verifiedAt:'2026-02-11T00:00:00.000Z'}
  ],
};
export const DEMO_LEDGER:AcademicLedgerRequest={
  asOf:'2026-11-16T00:00:00.000Z',rulePackVersion:'SYN-DEMO-V1',rulePackState:'APPROVED',
  attempts:[
    {attemptToken:'SYN-ATTEMPT-1',canonicalCourseId:'SYN-COURSE-A',creditUnits:6,ledger:'EARNED',areaIds:['SYN-MAJOR'],recognition:'RECOGNIZED',term:'2025-1'},
    {attemptToken:'SYN-ATTEMPT-2',canonicalCourseId:'SYN-COURSE-B',creditUnits:6,ledger:'PLANNED',areaIds:['SYN-MAJOR'],recognition:'RECOGNIZED',term:'2027-1'}
  ],
  requirements:[
    {id:'SYN-TOTAL',kind:'CREDIT_TOTAL',requiredCreditUnits:24,evidenceRefs:['SYN-CLAUSE-TOTAL']},
    {id:'SYN-REQUIRED-B',kind:'REQUIRED_COURSE',canonicalCourseId:'SYN-COURSE-B',evidenceRefs:['SYN-CLAUSE-REQUIRED']}
  ],
};
export const DEMO_PLAN:AcademicPlanRequest={
  ...DEMO_LEDGER,
  termPlan:{term:'2027-1',creditCapUnits:36,capEvidenceRefs:['SYN-CAP-EVIDENCE'],sections:[],prerequisites:[]}
};
