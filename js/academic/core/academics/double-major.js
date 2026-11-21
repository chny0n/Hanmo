// @ts-check
/** @typedef {import("../../contracts/index.js").AcademicAuditVNext} AcademicAuditVNext */
/** @typedef {import("./ledger.js").LedgerAttempt} LedgerAttempt */
/** @typedef {import("./ledger.js").LedgerRequirement} LedgerRequirement */
/** @typedef {import("./ledger.js").RulePackGate} RulePackGate */
/** @typedef {Omit<LedgerAttempt, 'areaIds'>} DoubleMajorAttempt */
/** @typedef {{ rulePackVersion:string;; rulePackState:RulePackGate;; requirements:readonly LedgerRequirement[];; courseAreas:Readonly<Record<string, readonly string[]>>; }} MajorRulePack */
/** @typedef {{ maxSharedCreditUnits:number;; evidenceRefs:readonly string[]; }} OverlapRule */
/** @typedef {| {status:'NONE'}
  | {status:'UNSET'}
  | {status:'SELECTED'; pack?:MajorRulePack & {overlapRule?:OverlapRule}}} DoubleMajorSelection */
/** @typedef {{ asOf:string;; attempts:readonly DoubleMajorAttempt[];; primary:MajorRulePack;; doubleMajor:DoubleMajorSelection; }} DoubleMajorRequest */
/** @typedef {{ courseId:string;; ledger:LedgerAttempt['ledger'];; creditUnits:number;; primaryAreaIds:string[];; doubleMajorAreaIds:string[]; }} SharedCourse */
/** @typedef {'NONE'|'NO_APPROVED_RULE'|'COVERED_BY_APPROVED_RULE'|'OVER_APPROVED_LIMIT'} OverlapStatus */
/** @typedef {{ requirementId:string;; decided:boolean;; metWithShared:boolean;; metWithoutShared:boolean;; earnedCreditUnitsWithoutShared?:number;; remainingCreditUnitsWithoutShared?:number;; projectedCreditUnitsWithoutShared?:number;; matchedCoursesCountWithoutShared?:number; }} OverlapRowImpact */
/** @typedef {{ state:'READY'|'NEEDS_REVIEW'|'INSUFFICIENT_DATA';; asOf:string;; uniqueCredits:{earnedCreditUnits:number; inProgressCreditUnits:number; plannedCreditUnits:number; projectedCreditUnits:number};; primary:AcademicAuditVNext;; doubleMajor:
    | {status:'NOT_APPLICABLE'}
    | {status:'INPUT_REQUIRED'}
    | {status:'RULES_MISSING'}
    | {status:'CHECKED'; audit:AcademicAuditVNext};; overlap:{
    status:OverlapStatus;
    sharedCourses:SharedCourse[];
    /** 공유 과목의 취득·진행 중·계획 학점을 모두 포함한 수치다. */
    sharedCreditUnits:number;
    evidenceRefs:string[];
    /** 중복 인정 여부에 따라 결과가 달라져 NEEDS_REVIEW로 보류된 요건 ID다. */
    heldRequirementIds:{primary:string[]; doubleMajor:string[]};
    /** 승인된 중복 인정 규칙이 없을 때 공유 과목이 영향을 주는 모든 요건을 나타낸다. */
    rowImpacts:{primary:OverlapRowImpact[]; doubleMajor:OverlapRowImpact[]};
  };; caveats:string[]; }} DoubleMajorAudit */
import { AcademicAuditVNextSchema } from '../../contracts/index.js';
import { assertId, assertUnits, buildAcademicLedger } from './ledger.js';
const MAX_AREAS_PER_COURSE = 30;
/**
 * @param {MajorRulePack} pack
 * @param {string} label
 * @returns {Map<string, string[]>} 실행 결과
 */
function readAreas(pack, label) {
    if (!pack.courseAreas || typeof pack.courseAreas !== 'object')
        throw new TypeError(`${label} courseAreas must be an object`);
    const map = new Map();
    for (const [courseId, areas] of Object.entries(pack.courseAreas)) {
        assertId(courseId, `${label} course`);
        if (!Array.isArray(areas) || areas.length > MAX_AREAS_PER_COURSE)
            throw new TypeError(`${label} areas of ${courseId} must be an array`);
        const seen = new Set();
        for (const areaId of areas) {
            assertId(areaId, `${label} area of ${courseId}`);
            if (seen.has(areaId))
                throw new TypeError(`${label} repeats area ${areaId} for ${courseId}`);
            seen.add(areaId);
        }
        map.set(courseId, [...areas]);
    }
    return map;
}
/** 영역 배정 이외에 RulePack 요건에서 직접 지정한 과목 목록이다. */
/**
 * @param {readonly LedgerRequirement[]} requirements
 * @returns {Set<string>} 실행 결과
 */
function namedCourses(requirements) {
    const named = new Set();
    for (const requirement of requirements) {
        if (requirement.kind === 'REQUIRED_COURSE')
            named.add(requirement.canonicalCourseId);
        if (requirement.kind === 'K_OF_N')
            for (const courseId of requirement.courseIds)
                named.add(courseId);
        if (requirement.kind === 'GROUP_CHOICE')
            for (const courseId of requirement.groups.flat())
                named.add(courseId);
    }
    return named;
}
/**
 * @param {string} asOf
 * @param {readonly DoubleMajorAttempt[]} attempts
 * @param {MajorRulePack} pack
 * @param {ReadonlyMap<string, string[]>} areas
 * @returns {AcademicAuditVNext} 실행 결과
 */
function runPack(asOf, attempts, pack, areas) {
    return buildAcademicLedger({
        asOf,
        rulePackVersion: pack.rulePackVersion,
        rulePackState: pack.rulePackState,
        attempts: attempts.map(attempt => ({ ...attempt, areaIds: areas.get(attempt.canonicalCourseId) ?? [] })),
        requirements: pack.requirements,
    });
}
/**
 * 원장 계산 수치로 공유 과목 포함·제외 시의 각 요건 판정을 비교한다.
 * 총 학점 및 비학점 요건은 이중전공 중복 인정 여부에 좌우되지 않는다.
 */
/**
 * @param {readonly LedgerRequirement[]} requirements
 * @param {AcademicAuditVNext} audit
 * @param {ReadonlyMap<string, SharedCourse>} shared
 * @param {(course:SharedCourse) => readonly string[]} sharedAreas
 * @param {AcademicAuditVNext} withoutShared
 * @returns {OverlapRowImpact[]} 실행 결과
 */
function rowImpacts(requirements, audit, shared, sharedAreas, withoutShared) {
    const rows = new Map(audit.requirements.map(row => [row.requirementId, row]));
    const earned = (course) => course.ledger === 'EARNED';
    const impacts = [];
    for (const requirement of requirements) {
        const row = rows.get(requirement.id);
        if (!row)
            continue;
        if (requirement.kind === 'CATEGORY_MINIMUM') {
            const inArea = [...shared.values()].filter(course => sharedAreas(course).includes(requirement.areaId));
            if (inArea.length === 0)
                continue;
            const earnedWith = row.earnedCreditUnits ?? 0;
            const earnedWithout = earnedWith - inArea.filter(earned).reduce((sum, course) => sum + course.creditUnits, 0);
            const projectedWithout = (row.projectedCreditUnits ?? 0) - inArea.reduce((sum, course) => sum + course.creditUnits, 0);
            const metWithShared = earnedWith >= requirement.requiredCreditUnits;
            const metWithoutShared = earnedWithout >= requirement.requiredCreditUnits;
            impacts.push({ requirementId: requirement.id, decided: metWithShared === metWithoutShared, metWithShared, metWithoutShared,
                earnedCreditUnitsWithoutShared: earnedWithout,
                remainingCreditUnitsWithoutShared: Math.max(0, requirement.requiredCreditUnits - earnedWithout),
                projectedCreditUnitsWithoutShared: projectedWithout });
        }
        else if (requirement.kind === 'REQUIRED_COURSE') {
            const course = shared.get(requirement.canonicalCourseId);
            if (!course)
                continue;
            const metWithShared = earned(course);
            impacts.push({ requirementId: requirement.id, decided: !metWithShared, metWithShared, metWithoutShared: false });
        }
        else if (requirement.kind === 'AREA_SPREAD' || requirement.kind === 'GROUP_CHOICE') {
            const contributes = requirement.kind === 'AREA_SPREAD'
                ? [...shared.values()].some(course => sharedAreas(course).some(id => requirement.areaIds.includes(id)))
                : requirement.groups.some(group => group.some(id => shared.has(id)));
            if (!contributes)
                continue;
            const without = withoutShared.requirements.find(item => item.requirementId === requirement.id);
            const metWithShared = row.state === 'SATISFIED', metWithoutShared = without.state === 'SATISFIED';
            impacts.push({ requirementId: requirement.id,
                decided: row.state !== 'NEEDS_REVIEW' && without.state !== 'NEEDS_REVIEW' && metWithShared === metWithoutShared,
                metWithShared, metWithoutShared });
        }
        else if (requirement.kind === 'K_OF_N') {
            const inList = requirement.courseIds.flatMap(courseId => shared.get(courseId) ?? []);
            if (inList.length === 0)
                continue;
            const matchedWith = row.matchedCoursesCount ?? 0;
            const matchedWithout = matchedWith - inList.filter(earned).length;
            const metWithShared = matchedWith >= requirement.k;
            const metWithoutShared = matchedWithout >= requirement.k;
            impacts.push({ requirementId: requirement.id, decided: metWithShared === metWithoutShared, metWithShared, metWithoutShared,
                matchedCoursesCountWithoutShared: matchedWithout });
        }
    }
    return impacts;
}
/**
 * @param {AcademicAuditVNext} audit
 * @param {readonly string[]} ids
 * @param {string} caveat
 * @returns {AcademicAuditVNext} 실행 결과
 */
function hold(audit, ids, caveat) {
    if (ids.length === 0)
        return audit;
    const held = new Set(ids);
    const requirements = audit.requirements.map(row => held.has(row.requirementId) && row.state !== 'NOT_CHECKED' ? { ...row, state: 'NEEDS_REVIEW' } : row);
    const state = audit.state === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA' : 'NEEDS_REVIEW';
    const parsed = AcademicAuditVNextSchema.safeParse({ ...audit, state, requirements, caveats: [...audit.caveats, caveat] });
    if (!parsed.success) {
        throw new TypeError(`double-major result is not a valid audit: ${parsed.error.issues.map(issue => issue.message).join('; ')}`);
    }
    return parsed.data;
}
/**
 * @param {DoubleMajorRequest} input
 * @returns {DoubleMajorAudit} 실행 결과
 */
export function buildDoubleMajorAudit(input) {
    if (!Array.isArray(input.attempts))
        throw new TypeError('attempts must be an array');
    for (const attempt of input.attempts) {
        if (Object.prototype.hasOwnProperty.call(attempt, 'areaIds')) {
            throw new TypeError(`${attempt.attemptToken} carries areaIds; areas come from each major's courseAreas`);
        }
    }
    const primaryAreas = readAreas(input.primary, 'primary');
    const primaryRaw = runPack(input.asOf, input.attempts, input.primary, primaryAreas);
    const uniqueCredits = {
        earnedCreditUnits: primaryRaw.earnedCreditUnits,
        inProgressCreditUnits: primaryRaw.inProgressCreditUnits,
        plannedCreditUnits: primaryRaw.plannedCreditUnits,
        projectedCreditUnits: primaryRaw.projectedUniqueCreditUnits,
    };
    const none = { status: 'NONE', sharedCourses: [], sharedCreditUnits: 0, evidenceRefs: [],
        heldRequirementIds: { primary: [], doubleMajor: [] }, rowImpacts: { primary: [], doubleMajor: [] } };
    const caveats = ['Primary and double major checked on one transcript; not an official graduation decision.'];
    const selection = input.doubleMajor;
    const packMissing = selection.status === 'SELECTED' && (!selection.pack || selection.pack.rulePackState === 'MISSING');
    if (selection.status === 'NONE' || selection.status === 'UNSET' || packMissing) {
        const doubleMajor = selection.status === 'NONE' ? { status: 'NOT_APPLICABLE' }
            : selection.status === 'UNSET' ? { status: 'INPUT_REQUIRED' } : { status: 'RULES_MISSING' };
        if (doubleMajor.status === 'INPUT_REQUIRED')
            caveats.push('Double major is not entered yet; only the primary major is shown.');
        if (doubleMajor.status === 'RULES_MISSING')
            caveats.push('No rule pack for the selected double major; its requirements are not shown.');
        const state = primaryRaw.state === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA'
            : primaryRaw.state === 'READY' && doubleMajor.status === 'NOT_APPLICABLE' ? 'READY' : 'NEEDS_REVIEW';
        return { state, asOf: input.asOf, uniqueCredits, primary: primaryRaw, doubleMajor, overlap: none, caveats };
    }
    if (selection.status !== 'SELECTED')
        throw new TypeError('doubleMajor status must be NONE, UNSET, or SELECTED');
    const pack = selection.pack;
    assertId(pack.rulePackVersion, 'double major rulePackVersion');
    if (pack.rulePackVersion === input.primary.rulePackVersion) {
        throw new TypeError('primary and double major must use different rule packs');
    }
    if (pack.requirements.some(requirement => requirement.kind === 'CREDIT_TOTAL')) {
        throw new TypeError('the double major pack cannot hold the graduation credit total; that belongs to the primary pack');
    }
    const doubleAreas = readAreas(pack, 'double major');
    const doubleRaw = runPack(input.asOf, input.attempts, pack, doubleAreas);
    if (doubleRaw.projectedUniqueCreditUnits !== primaryRaw.projectedUniqueCreditUnits
        || doubleRaw.earnedCreditUnits !== primaryRaw.earnedCreditUnits) {
        throw new Error('both majors must read the same transcript totals');
    }
    // 원장이 제외한 중복·재수강·인정 대기 등의 수강 시도는 공유 과목으로 계산하지 않는다.
    const excluded = new Set(primaryRaw.excludedAttempts.map(row => row.attemptToken));
    const primaryNamed = namedCourses(input.primary.requirements);
    const doubleNamed = namedCourses(pack.requirements);
    const shared = new Map();
    for (const attempt of input.attempts) {
        if (excluded.has(attempt.attemptToken))
            continue;
        const id = attempt.canonicalCourseId;
        const inPrimary = (primaryAreas.get(id)?.length ?? 0) > 0 || primaryNamed.has(id);
        const inDouble = (doubleAreas.get(id)?.length ?? 0) > 0 || doubleNamed.has(id);
        if (!inPrimary || !inDouble)
            continue;
        shared.set(id, { courseId: id, ledger: attempt.ledger, creditUnits: attempt.creditUnits,
            primaryAreaIds: primaryAreas.get(id) ?? [], doubleMajorAreaIds: doubleAreas.get(id) ?? [] });
    }
    let sharedCreditUnits = 0;
    for (const course of shared.values()) {
        sharedCreditUnits += course.creditUnits;
        assertUnits(sharedCreditUnits, 'shared credit units');
    }
    const rule = pack.overlapRule;
    let status = 'NONE';
    let evidenceRefs = [];
    if (shared.size > 0) {
        status = 'NO_APPROVED_RULE';
        if (rule && pack.rulePackState === 'APPROVED') {
            assertUnits(rule.maxSharedCreditUnits, 'overlap maxSharedCreditUnits');
            if (!Array.isArray(rule.evidenceRefs) || rule.evidenceRefs.length === 0) {
                throw new TypeError('an overlap rule needs official evidence');
            }
            for (const ref of rule.evidenceRefs)
                assertId(ref, 'overlap evidence');
            evidenceRefs = [...rule.evidenceRefs];
            status = sharedCreditUnits <= rule.maxSharedCreditUnits ? 'COVERED_BY_APPROVED_RULE' : 'OVER_APPROVED_LIMIT';
        }
    }
    const covered = status === 'NONE' || status === 'COVERED_BY_APPROVED_RULE';
    const independentAttempts = input.attempts.filter(attempt => !shared.has(attempt.canonicalCourseId));
    const impactsPrimary = covered ? [] : rowImpacts(input.primary.requirements, primaryRaw, shared, course => course.primaryAreaIds, runPack(input.asOf, independentAttempts, input.primary, primaryAreas));
    const impactsDouble = covered ? [] : rowImpacts(pack.requirements, doubleRaw, shared, course => course.doubleMajorAreaIds, runPack(input.asOf, independentAttempts, pack, doubleAreas));
    const heldPrimary = impactsPrimary.filter(impact => !impact.decided).map(impact => impact.requirementId);
    const heldDouble = impactsDouble.filter(impact => !impact.decided).map(impact => impact.requirementId);
    const reason = status === 'OVER_APPROVED_LIMIT'
        ? 'Shared courses exceed the approved overlap limit; rows whose result depends on them are held for review.'
        : 'A course counts toward both majors without an approved overlap rule; rows whose result depends on it are held for review.';
    const primary = hold(primaryRaw, heldPrimary, reason);
    const doubleAudit = hold(doubleRaw, heldDouble, reason);
    if (!covered)
        caveats.push(reason);
    let state;
    if (primary.state === 'INSUFFICIENT_DATA')
        state = 'INSUFFICIENT_DATA';
    else if (primary.state === 'READY' && doubleAudit.state === 'READY')
        state = 'READY';
    else
        state = 'NEEDS_REVIEW';
    return {
        state, asOf: input.asOf, uniqueCredits, primary,
        doubleMajor: { status: 'CHECKED', audit: doubleAudit },
        overlap: {
            status,
            sharedCourses: [...shared.values()].sort((a, b) => (a.courseId < b.courseId ? -1 : a.courseId > b.courseId ? 1 : 0)),
            sharedCreditUnits, evidenceRefs,
            heldRequirementIds: { primary: heldPrimary, doubleMajor: heldDouble },
            rowImpacts: { primary: impactsPrimary, doubleMajor: impactsDouble },
        },
        caveats,
    };
}
