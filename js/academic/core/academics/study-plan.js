// @ts-check
/** @typedef {import("../../contracts/index.js").AcademicAuditVNext} AcademicAuditVNext */
/** @typedef {import("../../contracts/index.js").OwnerStudyPlanCheckResponse} OwnerStudyPlanCheckResponse */
/** @typedef {import("../../contracts/index.js").OwnerWorkspaceValue} OwnerWorkspaceValue */
/** @typedef {import("./ledger.js").LedgerAttempt} LedgerAttempt */
/** @typedef {import("./ledger.js").RulePackGate} RulePackGate */
/** @typedef {import("./plan.js").PrerequisiteRule} PrerequisiteRule */
/** @typedef {import("./plan.js").VerifiedSection} VerifiedSection */
/** @typedef {AcademicAuditVNext['planIssues'][number]} PlanIssue */
/** @typedef {OwnerStudyPlanCheckResponse['caveats'][number]} StudyPlanCaveat */
/** @typedef {Extract<OwnerWorkspaceValue, {kind:'STUDY_PLAN'}>} StudyPlanItem */
/** @typedef {'TERM_UNDECIDED'|'TERM_ENDED'|'CREDITS_UNKNOWN'} UncheckedReason */
/** @typedef {{ asOf:string;; term:string;; rulePack:{version:string; state:RulePackGate};; attempts:readonly LedgerAttempt[];; studyPlan:readonly unknown[];; courseCreditUnits:Readonly<Record<string, number>>;; termRules:{creditCapUnits:number; capEvidenceRefs:readonly string[]; prerequisites?:readonly PrerequisiteRule[]};; sections?:readonly VerifiedSection[];; versions?:Partial<Record<'rulePack'|'plan'|'catalog'|'transcript', string>>; }} StudyPlanCheckRequest */
/** @typedef {{ state:'READY'|'NEEDS_REVIEW'|'INSUFFICIENT_DATA';; asOf:string;; term:string;; versions:Partial<Record<'rulePack'|'plan'|'catalog'|'transcript', string>>;; termLoadCreditUnits:number;; creditCapUnits?:number;; planIssues:PlanIssue[];; unchecked:{courseId:string; reason:UncheckedReason}[];; caveats:StudyPlanCaveat[]; }} StudyPlanCheck */
import { OwnerWorkspaceValueSchema, } from '../../contracts/index.js';
import { AS_OF, assertId, assertPositiveUnits, byCodeUnit, termEndMs } from './ledger.js';
import { checkAcademicPlan } from './plan.js';
const REGULAR_TERM = /^(19|20|21)\d{2}-[12]$/;
const MAX_PLAN_ITEMS = 200;
const VERSION_KEYS = ['rulePack', 'plan', 'catalog', 'transcript'];
/** @type {ReadonlySet<PlanIssue['code']>} */
const REVIEW_CODES = new Set(['NEEDS_REVIEW', 'SEARCH_LIMIT_REVIEW']);
/**
 * #62는 미승인 규칙집의 상한·선수요건 경고를 보류하면서 시간 충돌을 보고할 수 있다.
 * 하지만 #103 응답 계약은 승인 없는 모든 확정 경고를 금지하므로 충돌도 이유를 남기고 보류한다.
 */
/**
 * @param {PlanIssue} issue
 * @returns {PlanIssue} 실행 결과
 */
function holdUnapproved(issue) {
    return issue.code === 'TIMETABLE_CONFLICT' ? { ...issue, code: 'NEEDS_REVIEW' } : issue;
}
/**
 * @param {readonly unknown[]} raw
 * @returns {StudyPlanItem[]} 실행 결과
 */
function readPlan(raw) {
    if (!Array.isArray(raw))
        throw new TypeError('studyPlan must be an array');
    if (raw.length > MAX_PLAN_ITEMS)
        throw new RangeError(`studyPlan accepts at most ${MAX_PLAN_ITEMS} items`);
    return raw.map((item, index) => {
        const parsed = OwnerWorkspaceValueSchema.safeParse(item);
        if (!parsed.success || parsed.data.kind !== 'STUDY_PLAN')
            throw new TypeError(`studyPlan[${index}] is not a STUDY_PLAN item`);
        return parsed.data;
    });
}
/**
 * @param {Readonly<Record<string, number>>} table
 * @param {string} courseId
 * @returns {number|undefined} 실행 결과
 */
function credits(table, courseId) {
    if (!Object.prototype.hasOwnProperty.call(table, courseId))
        return undefined;
    const units = table[courseId];
    assertPositiveUnits(units, `courseCreditUnits of ${courseId}`);
    return units;
}
/**
 * @param {StudyPlanCheckRequest} input
 * @returns {StudyPlanCheck} 실행 결과
 */
export function simulateStudyPlan(input) {
    if (!AS_OF.test(input.asOf) || !Number.isFinite(Date.parse(input.asOf))) {
        throw new TypeError('asOf must be an ISO-8601 datetime with a timezone offset');
    }
    if (!REGULAR_TERM.test(input.term))
        throw new TypeError('term must be a regular term YYYY-1 or YYYY-2');
    const asOfMs = Date.parse(input.asOf);
    if (termEndMs(input.term) <= asOfMs)
        throw new TypeError(`term ${input.term} has already ended by asOf`);
    const versions = {};
    for (const key of VERSION_KEYS) {
        const value = input.versions?.[key];
        if (value === undefined)
            continue;
        assertId(value, `versions.${key}`);
        versions[key] = value;
    }
    for (const attempt of input.attempts) {
        if (attempt.ledger === 'PLANNED') {
            throw new TypeError(`attempt ${attempt.attemptToken} is PLANNED; plans come only from studyPlan`);
        }
    }
    const unchecked = new Map();
    const seen = new Set();
    const planned = [];
    for (const item of readPlan(input.studyPlan)) {
        if (!item.planned)
            continue;
        if (item.targetTerm === 'UNDECIDED') {
            if (!unchecked.has(item.courseId))
                unchecked.set(item.courseId, 'TERM_UNDECIDED');
            continue;
        }
        if (termEndMs(item.targetTerm) <= asOfMs) {
            if (!unchecked.has(item.courseId))
                unchecked.set(item.courseId, 'TERM_ENDED');
            continue;
        }
        const key = `${item.courseId}\u0000${item.targetTerm}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        const units = credits(input.courseCreditUnits, item.courseId);
        if (units === undefined) {
            unchecked.set(item.courseId, 'CREDITS_UNKNOWN');
            continue;
        }
        planned.push({
            attemptToken: `PLAN:${item.courseId}:${item.targetTerm}`,
            canonicalCourseId: item.courseId,
            creditUnits: units,
            ledger: 'PLANNED',
            areaIds: [],
            recognition: 'RECOGNIZED',
            term: item.targetTerm,
        });
    }
    const { audit, termLoadCreditUnits } = checkAcademicPlan({
        asOf: input.asOf,
        rulePackVersion: input.rulePack.version,
        rulePackState: input.rulePack.state,
        attempts: [...input.attempts, ...planned],
        requirements: [],
        termPlan: {
            term: input.term,
            creditCapUnits: input.termRules.creditCapUnits,
            capEvidenceRefs: input.termRules.capEvidenceRefs,
            ...(input.termRules.prerequisites === undefined ? {} : { prerequisites: input.termRules.prerequisites }),
            ...(input.sections === undefined ? {} : { sections: input.sections }),
        },
    });
    const approved = input.rulePack.state === 'APPROVED';
    const planIssues = approved ? audit.planIssues : audit.planIssues.map(holdUnapproved);
    const uncheckedRows = [...unchecked].map(([courseId, reason]) => ({ courseId, reason }))
        .sort((a, b) => byCodeUnit(a.courseId, b.courseId));
    const sectionsUnconfirmed = planIssues.some(issue => issue.reasonCode === 'COURSE_NOT_CONFIRMED');
    // READY 응답에는 모든 판본이 있어야 하며 화면에서 입력에 대응시킬 수 없는 결과는 보류한다.
    const versionsComplete = VERSION_KEYS.every(key => versions[key] !== undefined);
    let state;
    if (input.rulePack.state === 'MISSING')
        state = 'INSUFFICIENT_DATA';
    else if (!approved || audit.state !== 'READY' || uncheckedRows.length > 0 || !versionsComplete
        || planIssues.some(issue => REVIEW_CODES.has(issue.code)))
        state = 'NEEDS_REVIEW';
    else
        state = 'READY';
    const caveats = ['NOT_OFFICIAL_REGISTRATION', 'NOT_GRADUATION_DECISION'];
    if (!approved)
        caveats.push('RULEPACK_UNVERIFIED');
    if (sectionsUnconfirmed)
        caveats.push('SECTIONS_UNCONFIRMED');
    if (uncheckedRows.length > 0)
        caveats.push('PLAN_PARTIALLY_CHECKED');
    const result = {
        state, asOf: input.asOf, term: input.term, versions,
        termLoadCreditUnits,
        planIssues,
        unchecked: uncheckedRows,
        caveats,
    };
    if (approved)
        result.creditCapUnits = input.termRules.creditCapUnits;
    return result;
}
