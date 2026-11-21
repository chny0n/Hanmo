// @ts-check
/** @typedef {import("../../contracts/index.js").AcademicAuditVNext} AcademicAuditVNext */
/** @typedef {'EARNED'|'IN_PROGRESS'|'PLANNED'} LedgerSlot */
/** @typedef {'RECOGNIZED'|'PENDING'|'EXCLUDED'} LedgerRecognition */
/** @typedef {'MISSING'|'DRAFT'|'NEEDS_REVIEW'|'APPROVED'} RulePackGate */
/** @typedef {{ attemptToken:string;; canonicalCourseId:string;; creditUnits:number;; ledger:LedgerSlot;; areaIds:readonly string[];; recognition:LedgerRecognition;; term?:string;; supersedesAttemptToken?:string;; retakeApprovalRef?:string; }} LedgerAttempt */
/** @typedef {{ id:string;; evidenceRefs?:readonly string[]; }} RequirementBase */
/** @typedef {| (RequirementBase & {kind:'CREDIT_TOTAL'; requiredCreditUnits:number}) | (RequirementBase & {kind:'CATEGORY_MINIMUM'; areaId:string; requiredCreditUnits:number}) | (RequirementBase & {kind:'REQUIRED_COURSE'; canonicalCourseId:string}) | (RequirementBase & {kind:'K_OF_N'; courseIds:readonly string[]; k:number}) | (RequirementBase & {kind:'AREA_SPREAD'; areaIds:readonly string[]; minAreas:number; requiredCreditUnits:number}) | (RequirementBase & {kind:'GROUP_CHOICE'; groups:readonly (readonly string[])[]; k:number}) | (RequirementBase & { kind:'NON_CREDIT'; criterionId:string; verificationMode:'OFFICIAL'|'MANUAL'|'GPA_NOT_COLLECTED'; })} LedgerRequirement */
/** @typedef {{ asOf:string;; rulePackVersion:string;; rulePackState:RulePackGate;; attempts:readonly LedgerAttempt[];; requirements:readonly LedgerRequirement[]; }} AcademicLedgerRequest */
/** @typedef {'SATISFIED'|'UNSATISFIED'|'NEEDS_REVIEW'|'NOT_APPLICABLE'|'NOT_CHECKED'} ProgressState */
/** @typedef {'RETAKE_SUPERSEDED'|'DUPLICATE'|'PENDING_RECOGNITION'|'OFFICIAL_EXCLUSION'|'NEEDS_REVIEW'} ExclusionReason */
/** @typedef {{ requirementId:string;; state:ProgressState;; evidenceRefs:string[];; requiredCreditUnits?:number;; earnedCreditUnits?:number;; remainingCreditUnits?:number;; projectedCreditUnits?:number;; matchedCoursesCount?:number;; requiredCoursesCount?:number;; matchedAreasCount?:number;; requiredAreasCount?:number;; matchedGroupsCount?:number;; requiredGroupsCount?:number;; notCheckedReason?:'GPA_NOT_COLLECTED'; }} ProgressRow */
/** @typedef {{ earned:number;; projected:number; }} AreaTotals */
/** @typedef {{ winners:Map<string, LedgerAttempt>;; reasons:Map<string, ExclusionReason>;; pendingUnits:number;; ambiguous:boolean; }} Classified */
/** @typedef {{ winners:ReadonlyMap<string, LedgerAttempt>;; reasons:ReadonlyMap<string, ExclusionReason>; }} LedgerAttemptClassification */
import { AcademicAuditVNextSchema } from '../../contracts/index.js';
/**
 * 학점 세 원장 계약(A08.2, A08.5 CREDIT-01~06).
 * 1단위는 0.5학점이며 합산은 정수로만 수행한다. 동일 대표 과목은 고유 합계에 한 번만 포함하며 승인된 영역 배정은 여러 영역에 적용할 수 있다.
 * asOf는 호출자가 제공하며 현재 시각·네트워크·난수에 의존하지 않는다.
 * READY는 승인된 규칙을 확인했다는 뜻이지 졸업 판정이 아니다.
 */
export const ID = /^[A-Za-z0-9_.:-]{1,128}$/;
export const AS_OF = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const SLOT_RANK = { EARNED: 0, IN_PROGRESS: 1, PLANNED: 2 };
const TERM = /^(\d{4})-(1|S|2|W)$/;
const SEASON_RANK = { '1': 0, S: 1, '2': 2, W: 3 };
/**
 * @param {string} term
 * @returns {number} 기능 결과
 */
export function termKey(term) {
    const match = TERM.exec(term);
    if (!match)
        throw new TypeError(`term must be YYYY-1|S|2|W; refused ${term}`);
    return Number(match[1]) * 4 + SEASON_RANK[match[2]];
}
/** 한국시간 기준 학점 취득 처리가 가능해지는 학기 종료 시각이다. */
/**
 * @param {string} term
 * @returns {number} 기능 결과
 */
export function termEndMs(term) {
    const match = TERM.exec(term);
    if (!match)
        throw new TypeError(`term must be YYYY-1|S|2|W; refused ${term}`);
    const year = Number(match[1]);
    const end = {
        '1': `${year}-07-01`,
        S: `${year}-09-01`,
        '2': `${year + 1}-01-01`,
        W: `${year + 1}-03-01`,
    }[match[2]];
    return Date.parse(`${end}T00:00:00.000+09:00`);
}
/** 취득 기록은 학기가 확인되고 asOf까지 종료된 경우에만 합산한다. */
/**
 * @param {LedgerAttempt} attempt
 * @param {number} asOfMs
 * @returns {boolean} 기능 결과
 */
function earnedByAsOf(attempt, asOfMs) {
    return attempt.term !== undefined && termEndMs(attempt.term) <= asOfMs;
}
/**
 * @param {LedgerAttempt} target
 * @param {LedgerAttempt} successor
 * @returns {boolean} 기능 결과
 */
function isApprovedRetake(target, successor) {
    return target.canonicalCourseId === successor.canonicalCourseId
        && target.ledger === 'EARNED'
        && successor.ledger === 'EARNED'
        && successor.recognition === 'RECOGNIZED'
        && successor.retakeApprovalRef !== undefined
        && target.term !== undefined
        && successor.term !== undefined
        && termKey(successor.term) > termKey(target.term);
}
/**
 * @param {string} label
 * @param {unknown} value
 * @returns {never} 기능 결과
 */
function refuse(label, value) {
    throw new TypeError(`${label} must be a non-negative safe integer credit unit (1 unit = 0.5 credit); refused ${String(value)}`);
}
/**
 * @param {unknown} value
 * @param {string} label
 * @returns {void} 기능 결과
 */
export function assertUnits(value, label) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
        refuse(label, value);
}
/**
 * @param {unknown} value
 * @param {string} label
 * @returns {void} 기능 결과
 */
export function assertPositiveUnits(value, label) {
    assertUnits(value, label);
    if (value <= 0)
        refuse(label, value);
}
/**
 * @param {unknown} value
 * @param {string} label
 * @returns {void} 기능 결과
 */
export function assertId(value, label) {
    if (typeof value !== 'string' || !ID.test(value)) {
        throw new TypeError(`${label} must be a synthetic id token`);
    }
}
/**
 * @param {number} sum
 * @param {number} units
 * @returns {number} 기능 결과
 */
export function addUnits(sum, units) {
    const next = sum + units;
    if (!Number.isSafeInteger(next))
        refuse('credit unit sum', next);
    return next;
}
/**
 * @param {string} a
 * @param {string} b
 * @returns {number} 기능 결과
 */
export function byCodeUnit(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/**
 * @param {LedgerRequirement} requirement
 * @returns {string[]} 기능 결과
 */
function evidenceOf(requirement) {
    const refs = requirement.evidenceRefs ?? [];
    const seen = new Set();
    for (const ref of refs) {
        assertId(ref, `${requirement.id} evidence`);
        if (seen.has(ref))
            throw new TypeError(`${requirement.id} repeats evidence ${ref}`);
        seen.add(ref);
    }
    return [...refs];
}
/**
 * @param {ProgressRow} row
 * @param {boolean} packApproved
 * @returns {ProgressRow} 기능 결과
 */
function applyPackGate(row, packApproved) {
    if (row.state === 'NOT_CHECKED')
        return row;
    if (!packApproved || (row.state === 'SATISFIED' && row.evidenceRefs.length === 0)) {
        return { ...row, state: 'NEEDS_REVIEW' };
    }
    return row;
}
/**
 * @param {readonly LedgerAttempt[]} attempts
 * @param {number} asOfMs
 * @returns {Classified} 기능 결과
 */
function classify(attempts, asOfMs) {
    const byToken = new Map();
    for (const attempt of attempts) {
        assertId(attempt.attemptToken, 'attemptToken');
        assertId(attempt.canonicalCourseId, 'canonicalCourseId');
        assertUnits(attempt.creditUnits, `creditUnits of ${attempt.attemptToken}`);
        if (attempt.ledger !== 'EARNED' && attempt.ledger !== 'IN_PROGRESS' && attempt.ledger !== 'PLANNED') {
            throw new TypeError(`${attempt.attemptToken} has no ledger slot`);
        }
        if (attempt.recognition !== 'RECOGNIZED' && attempt.recognition !== 'PENDING' && attempt.recognition !== 'EXCLUDED') {
            throw new TypeError(`${attempt.attemptToken} has no recognition`);
        }
        const areas = new Set();
        for (const areaId of attempt.areaIds) {
            assertId(areaId, `${attempt.attemptToken} area`);
            if (areas.has(areaId))
                throw new TypeError(`${attempt.attemptToken} repeats area ${areaId}`);
            areas.add(areaId);
        }
        if (attempt.supersedesAttemptToken !== undefined)
            assertId(attempt.supersedesAttemptToken, 'supersedesAttemptToken');
        if (attempt.retakeApprovalRef !== undefined)
            assertId(attempt.retakeApprovalRef, 'retakeApprovalRef');
        if (attempt.term !== undefined)
            termKey(attempt.term);
        if (byToken.has(attempt.attemptToken))
            throw new TypeError(`duplicate attempt ${attempt.attemptToken}`);
        byToken.set(attempt.attemptToken, attempt);
    }
    const claimers = new Map();
    for (const attempt of attempts) {
        const target = attempt.supersedesAttemptToken;
        if (target === undefined)
            continue;
        const list = claimers.get(target) ?? [];
        list.push(attempt.attemptToken);
        claimers.set(target, list);
    }
    const cycles = new Set();
    for (const attempt of attempts) {
        if (attempt.supersedesAttemptToken === undefined)
            continue;
        const seen = new Set();
        let cursor = attempt.attemptToken;
        while (cursor !== undefined) {
            if (seen.has(cursor)) {
                for (const token of seen)
                    cycles.add(token);
                break;
            }
            seen.add(cursor);
            cursor = byToken.get(cursor)?.supersedesAttemptToken;
        }
    }
    const needsReview = new Set(cycles);
    const notYetEarned = new Set();
    for (const attempt of attempts) {
        if (attempt.ledger === 'EARNED' && !earnedByAsOf(attempt, asOfMs)) {
            notYetEarned.add(attempt.attemptToken);
            needsReview.add(attempt.attemptToken);
        }
    }
    const superseded = new Set();
    for (const [target, tokens] of claimers) {
        if (cycles.has(target) || tokens.some(token => cycles.has(token)))
            continue;
        const targetAttempt = byToken.get(target);
        const successor = tokens.length === 1 ? byToken.get(tokens[0]) : undefined;
        if (!targetAttempt || !successor || notYetEarned.has(successor.attemptToken)
            || !isApprovedRetake(targetAttempt, successor)) {
            for (const token of tokens)
                needsReview.add(token);
            continue;
        }
        superseded.add(target);
    }
    const reasons = new Map();
    const mark = (token, reason) => {
        if (!reasons.has(token))
            reasons.set(token, reason);
    };
    const recognized = new Map();
    const pending = new Map();
    for (const attempt of attempts) {
        const token = attempt.attemptToken;
        if (needsReview.has(token)) {
            mark(token, 'NEEDS_REVIEW');
            continue;
        }
        if (superseded.has(token)) {
            mark(token, 'RETAKE_SUPERSEDED');
            continue;
        }
        if (attempt.recognition === 'PENDING') {
            const list = pending.get(attempt.canonicalCourseId) ?? [];
            list.push(attempt);
            pending.set(attempt.canonicalCourseId, list);
            continue;
        }
        if (attempt.recognition === 'EXCLUDED') {
            mark(token, 'OFFICIAL_EXCLUSION');
            continue;
        }
        const list = recognized.get(attempt.canonicalCourseId) ?? [];
        list.push(attempt);
        recognized.set(attempt.canonicalCourseId, list);
    }
    const winners = new Map();
    let ambiguous = needsReview.size > 0;
    const blocked = new Set();
    for (const [courseId, group] of recognized) {
        const bySlot = new Map();
        for (const attempt of group) {
            const list = bySlot.get(attempt.ledger) ?? [];
            list.push(attempt);
            bySlot.set(attempt.ledger, list);
        }
        const crowded = [...bySlot.values()].some(list => list.length > 1);
        if (crowded) {
            ambiguous = true;
            blocked.add(courseId);
            for (const attempt of group)
                mark(attempt.attemptToken, 'NEEDS_REVIEW');
            continue;
        }
        const ordered = [...group].sort((a, b) => SLOT_RANK[a.ledger] - SLOT_RANK[b.ledger]);
        const winner = ordered[0];
        if (!winner)
            continue;
        winners.set(courseId, winner);
        for (const other of ordered.slice(1))
            mark(other.attemptToken, 'DUPLICATE');
    }
    let pendingUnits = 0;
    for (const [courseId, group] of pending) {
        if (group.length !== 1 || winners.has(courseId) || blocked.has(courseId)) {
            if (group.length !== 1 || blocked.has(courseId))
                ambiguous = true;
            const reason = winners.has(courseId) && group.length === 1 ? 'DUPLICATE' : 'NEEDS_REVIEW';
            for (const attempt of group)
                mark(attempt.attemptToken, reason);
            continue;
        }
        const only = group[0];
        pendingUnits = addUnits(pendingUnits, only.creditUnits);
        mark(only.attemptToken, 'PENDING_RECOGNITION');
    }
    return { winners, reasons, pendingUnits, ambiguous };
}
/**
 * 학점 원장과 동일한 수강 시도 판정·입력 검증을 제공한다.
 * 다른 코어(경험 증빙 #260)도 어떤 기록을 계산할지 동일하게 결정하도록 사용한다.
 */
/**
 * @param {readonly LedgerAttempt[]} attempts
 * @param {string} asOf
 * @returns {LedgerAttemptClassification} 기능 결과
 */
export function classifyLedgerAttempts(attempts, asOf) {
    if (!AS_OF.test(asOf) || !Number.isFinite(Date.parse(asOf))) {
        throw new TypeError('asOf must be an ISO-8601 datetime with a timezone offset');
    }
    if (!Array.isArray(attempts))
        throw new TypeError('attempts must be an array');
    const { winners, reasons } = classify(attempts, Date.parse(asOf));
    return { winners, reasons };
}
/**
 * @param {LedgerRequirement} requirement
 * @param {number} earned
 * @param {number} projected
 * @param {ReadonlyMap<string, AreaTotals>} areas
 * @param {ReadonlyMap<string, LedgerAttempt>} winners
 * @returns {ProgressRow} 기능 결과
 */
function evaluateRequirement(requirement, earned, projected, areas, winners) {
    assertId(requirement.id, 'requirement id');
    const evidenceRefs = evidenceOf(requirement);
    if (requirement.kind === 'NON_CREDIT') {
        assertId(requirement.criterionId, `${requirement.id} criterion`);
        if (requirement.verificationMode === 'GPA_NOT_COLLECTED') {
            return {
                requirementId: requirement.id,
                state: 'NOT_CHECKED',
                notCheckedReason: 'GPA_NOT_COLLECTED',
                evidenceRefs: [],
            };
        }
        return { requirementId: requirement.id, state: 'NEEDS_REVIEW', evidenceRefs };
    }
    if (requirement.kind === 'CREDIT_TOTAL') {
        assertPositiveUnits(requirement.requiredCreditUnits, `${requirement.id} requiredCreditUnits`);
        const remaining = Math.max(0, requirement.requiredCreditUnits - earned);
        return {
            requirementId: requirement.id,
            state: earned >= requirement.requiredCreditUnits ? 'SATISFIED' : 'UNSATISFIED',
            requiredCreditUnits: requirement.requiredCreditUnits,
            earnedCreditUnits: earned,
            remainingCreditUnits: remaining,
            projectedCreditUnits: projected,
            evidenceRefs,
        };
    }
    if (requirement.kind === 'CATEGORY_MINIMUM') {
        assertId(requirement.areaId, `${requirement.id} area`);
        assertPositiveUnits(requirement.requiredCreditUnits, `${requirement.id} requiredCreditUnits`);
        const area = areas.get(requirement.areaId) ?? { earned: 0, projected: 0 };
        const remaining = Math.max(0, requirement.requiredCreditUnits - area.earned);
        return {
            requirementId: requirement.id,
            state: area.earned >= requirement.requiredCreditUnits ? 'SATISFIED' : 'UNSATISFIED',
            requiredCreditUnits: requirement.requiredCreditUnits,
            earnedCreditUnits: area.earned,
            remainingCreditUnits: remaining,
            projectedCreditUnits: area.projected,
            evidenceRefs,
        };
    }
    if (requirement.kind === 'REQUIRED_COURSE') {
        assertId(requirement.canonicalCourseId, `${requirement.id} course`);
        const winner = winners.get(requirement.canonicalCourseId);
        const satisfied = winner?.ledger === 'EARNED';
        return {
            requirementId: requirement.id,
            state: satisfied ? 'SATISFIED' : 'UNSATISFIED',
            evidenceRefs,
        };
    }
    if (requirement.kind === 'AREA_SPREAD') {
        const allowed = new Set(requirement.areaIds);
        if (requirement.areaIds.length < 2 || requirement.areaIds.length > 30 || allowed.size !== requirement.areaIds.length)
            throw new TypeError('AREA_SPREAD requires 2 to 30 distinct areas');
        for (const id of allowed)
            assertId(id, 'spread area');
        assertPositiveUnits(requirement.minAreas, 'minimum areas');
        assertPositiveUnits(requirement.requiredCreditUnits, 'spread credit units');
        if (requirement.minAreas > allowed.size)
            throw new TypeError('minimum areas exceeds available areas');
        // 미완료 다영역 과목은 취득 영역 판정에 영향을 주지 않는다.
        // 취득한 과목도 여러 영역의 학점을 지원할 수 있지만 서로 다른 두 영역을 동시에 차지할 수는 없다.
        const earnedAreas = new Set();
        const ambiguousEarned = [];
        let earnedUnits = 0, projectedUnits = 0;
        for (const course of winners.values()) {
            if (course.creditUnits === 0)
                continue;
            const eligible = course.areaIds.filter(id => allowed.has(id));
            if (eligible.length === 0)
                continue;
            projectedUnits = addUnits(projectedUnits, course.creditUnits);
            if (course.ledger !== 'EARNED')
                continue;
            earnedUnits = addUnits(earnedUnits, course.creditUnits);
            if (eligible.length === 1)
                earnedAreas.add(eligible[0]);
            else
                ambiguousEarned.push(eligible);
        }
        // 영역 수 최대치는 영역 태그의 합집합이 아닌 이분 매칭으로 계산한다.
        // 취득 과목 하나는 가능한 영역 하나에만 배정할 수 있다.
        const matched = new Map();
        const augment = (index, visited) => {
            for (const area of ambiguousEarned[index] ?? []) {
                if (earnedAreas.has(area) || visited.has(area))
                    continue;
                visited.add(area);
                const previous = matched.get(area);
                if (previous === undefined || augment(previous, visited)) {
                    matched.set(area, index);
                    return true;
                }
            }
            return false;
        };
        for (let i = 0; i < ambiguousEarned.length; i++)
            augment(i, new Set());
        const maxPossibleAreas = earnedAreas.size + matched.size;
        // 집합 덮개 탐색으로 합법적인 배정 중 최소 영역 수 미달 사례가 있는지 확인한다.
        // 탐색 예산을 초과하면 임의로 확정하지 않고 검토 보류한다.
        const uncovered = ambiguousEarned.filter(xs => !xs.some(a => earnedAreas.has(a)));
        let searches = 0;
        const canStayBelow = (groups, slots) => {
            if (groups.length === 0)
                return true;
            if (slots <= 0)
                return false;
            if (++searches > 50000)
                return true;
            const fewest = groups.reduce((best, next) => next.length < best.length ? next : best);
            return fewest.some(a => canStayBelow(groups.filter(xs => !xs.includes(a)), slots - 1));
        };
        let state;
        if (earnedUnits < requirement.requiredCreditUnits || maxPossibleAreas < requirement.minAreas)
            state = 'UNSATISFIED';
        else if (earnedAreas.size >= requirement.minAreas
            || !canStayBelow(uncovered, requirement.minAreas - earnedAreas.size - 1))
            state = 'SATISFIED';
        else
            state = 'NEEDS_REVIEW';
        return { requirementId: requirement.id,
            state,
            requiredCreditUnits: requirement.requiredCreditUnits, earnedCreditUnits: earnedUnits,
            remainingCreditUnits: Math.max(0, requirement.requiredCreditUnits - earnedUnits),
            // 확정 SAT는 미승인 배정 가능성을 고려해도 최소 영역 수를 보장해야 한다.
            // 한 과목을 동시에 두 영역으로 세지 않는다.
            projectedCreditUnits: projectedUnits,
            matchedAreasCount: state === 'SATISFIED' ? Math.max(earnedAreas.size, requirement.minAreas) : earnedAreas.size,
            requiredAreasCount: requirement.minAreas, evidenceRefs };
    }
    if (requirement.kind === 'GROUP_CHOICE') {
        if (requirement.groups.length < 2 || requirement.groups.length > 10)
            throw new TypeError('GROUP_CHOICE requires 2 to 10 groups');
        assertPositiveUnits(requirement.k, 'required groups');
        if (requirement.k > requirement.groups.length)
            throw new TypeError('k exceeds available groups');
        const seen = new Set();
        let matchedGroupsCount = 0;
        for (const group of requirement.groups) {
            if (group.length < 1 || group.length > 10)
                throw new TypeError('Groups need 1 to 10 courses');
            for (const id of group) {
                assertId(id, 'group course');
                if (seen.has(id))
                    throw new TypeError('Groups must contain distinct courses');
                seen.add(id);
            }
            if (group.every(id => winners.get(id)?.ledger === 'EARNED'))
                matchedGroupsCount += 1;
        }
        return { requirementId: requirement.id, state: matchedGroupsCount >= requirement.k ? 'SATISFIED' : 'UNSATISFIED',
            matchedGroupsCount, requiredGroupsCount: requirement.k, evidenceRefs };
    }
    if (requirement.kind !== 'K_OF_N')
        throw new TypeError('Unknown academic requirement kind');
    const seen = new Set();
    if (requirement.courseIds.length < 2)
        throw new TypeError(`${requirement.id} needs at least two courses`);
    for (const courseId of requirement.courseIds) {
        assertId(courseId, `${requirement.id} course`);
        if (seen.has(courseId))
            throw new TypeError(`${requirement.id} repeats course ${courseId}`);
        seen.add(courseId);
    }
    assertPositiveUnits(requirement.k, `${requirement.id} k`);
    if (requirement.k > requirement.courseIds.length)
        throw new TypeError(`${requirement.id} k exceeds its courses`);
    let matchedCoursesCount = 0;
    let matchedUnits = 0;
    for (const courseId of requirement.courseIds) {
        const winner = winners.get(courseId);
        if (winner?.ledger !== 'EARNED')
            continue;
        matchedCoursesCount += 1;
        matchedUnits = addUnits(matchedUnits, winner.creditUnits);
    }
    const row = {
        requirementId: requirement.id,
        state: matchedCoursesCount >= requirement.k ? 'SATISFIED' : 'UNSATISFIED',
        earnedCreditUnits: matchedUnits,
        matchedCoursesCount,
        evidenceRefs,
    };
    if (matchedCoursesCount <= requirement.k)
        row.requiredCoursesCount = requirement.k;
    return row;
}
/**
 * 취득·진행 중·계획 학점의 고유 합계와 CREDIT-01~06 요건을 계산한다.
 * 정수가 아닌 학점 단위는 형 변환하지 않고 오류로 거부한다.
 */
/**
 * @param {AcademicLedgerRequest} input
 * @returns {AcademicAuditVNext} 기능 결과
 */
export function buildAcademicLedger(input) {
    if (!AS_OF.test(input.asOf) || !Number.isFinite(Date.parse(input.asOf))) {
        throw new TypeError('asOf must be an ISO-8601 datetime with a timezone offset');
    }
    assertId(input.rulePackVersion, 'rulePackVersion');
    if (!Array.isArray(input.attempts) || !Array.isArray(input.requirements)) {
        throw new TypeError('attempts and requirements must be arrays');
    }
    if (input.requirements.length > 200)
        throw new RangeError('too many requirements');
    const seenRequirements = new Set();
    for (const requirement of input.requirements) {
        if (seenRequirements.has(requirement.id))
            throw new TypeError(`duplicate requirement ${requirement.id}`);
        seenRequirements.add(requirement.id);
    }
    const { winners, reasons, pendingUnits, ambiguous } = classify(input.attempts, Date.parse(input.asOf));
    if (reasons.size > 150)
        throw new RangeError('too many excluded attempts');
    let earned = 0;
    let inProgress = 0;
    let planned = 0;
    const areas = new Map();
    const winnerList = [...winners.values()].sort((a, b) => byCodeUnit(a.canonicalCourseId, b.canonicalCourseId));
    for (const winner of winnerList) {
        if (winner.ledger === 'EARNED')
            earned = addUnits(earned, winner.creditUnits);
        else if (winner.ledger === 'IN_PROGRESS')
            inProgress = addUnits(inProgress, winner.creditUnits);
        else
            planned = addUnits(planned, winner.creditUnits);
        for (const areaId of winner.areaIds) {
            const area = areas.get(areaId) ?? { earned: 0, projected: 0 };
            area.projected = addUnits(area.projected, winner.creditUnits);
            if (winner.ledger === 'EARNED')
                area.earned = addUnits(area.earned, winner.creditUnits);
            areas.set(areaId, area);
        }
    }
    if (areas.size > 30)
        throw new RangeError('too many areas');
    const projected = addUnits(addUnits(earned, inProgress), planned);
    const packApproved = input.rulePackState === 'APPROVED';
    const requirements = input.requirements.map(requirement => applyPackGate(evaluateRequirement(requirement, earned, projected, areas, winners), packApproved));
    const excludedAttempts = input.attempts.flatMap(attempt => {
        const reason = reasons.get(attempt.attemptToken);
        return reason ? [{ attemptToken: attempt.attemptToken, reason }] : [];
    });
    const areaProgress = [...areas.entries()]
        .sort((a, b) => byCodeUnit(a[0], b[0]))
        .map(([areaId, area]) => ({
        areaId,
        earnedCreditUnits: area.earned,
        projectedCreditUnits: area.projected,
    }));
    const caveats = ['Computed credit ledger only; not an official graduation decision.'];
    if (input.rulePackState === 'MISSING')
        caveats.push('Approved rule pack is missing; graduation is not claimed.');
    else if (!packApproved)
        caveats.push('Rule pack is not APPROVED; graduation is not claimed.');
    if (ambiguous) {
        caveats.push('Some attempts are held for review: an earned row needs a term that ended by asOf, and a retake needs one explicit approval.');
    }
    let state;
    if (input.rulePackState === 'MISSING')
        state = 'INSUFFICIENT_DATA';
    else if (!packApproved || ambiguous || requirements.some(row => row.state === 'NEEDS_REVIEW' || row.state === 'NOT_CHECKED')) {
        state = 'NEEDS_REVIEW';
    }
    else
        state = 'READY';
    const parsed = AcademicAuditVNextSchema.safeParse({
        state,
        rulePackVersion: input.rulePackVersion,
        asOf: input.asOf,
        earnedCreditUnits: earned,
        inProgressCreditUnits: inProgress,
        plannedCreditUnits: planned,
        projectedUniqueCreditUnits: projected,
        pendingRecognitionCreditUnits: pendingUnits,
        areaProgress,
        excludedAttempts,
        requirements,
        planIssues: [],
        caveats,
    });
    if (!parsed.success) {
        throw new TypeError(`academic ledger result is not a valid audit: ${parsed.error.issues.map(issue => issue.message).join('; ')}`);
    }
    return parsed.data;
}
