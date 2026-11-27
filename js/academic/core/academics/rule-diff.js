// @ts-check
/** @import { AcademicAuditVNext, AcademicRulePackVNext } from "../../contracts/index.js" */
/** @import { LedgerAttempt, LedgerRequirement } from "./ledger.js" */
/** @typedef {AcademicRulePackVNext} Pack */
/** @typedef {Pack['requirements'][number]} Requirement */
/** @import { ProgressRow, ProgressState } from './ledger.js' */
/** @typedef {| 'NOT_APPROVED' | 'NOT_APPROVED_BY_AS_OF' | 'SAME_VERSION' | 'NOT_SUPERSEDING' | 'REQUIREMENT_ID_UNSTABLE' | 'SCOPE_MISMATCH' | 'HISTORY_INVERTED' | 'EFFECTIVE_GAP' | 'EFFECTIVE_OVERLAP'} RevisionBlockerCode */
/** @typedef {{ code:RevisionBlockerCode; side?:'previous'|'next'; }} RevisionBlocker */
/** @typedef {'UNCHANGED'|'CHANGED'|'ADDED'|'REMOVED'} DefinitionChange */
/** @typedef {'SAME'|'GAINED'|'LOST'|'UNKNOWN'} StateChange */
/** @typedef {| 'kind'|'requiredCreditUnits'|'areaId'|'areaIds'|'minAreas'|'groups'|'canonicalCourseId'|'courseIds'|'k' | 'criterionId'|'verificationMode'|'sourceClauseIds'|'exceptionClauseIds'|'clauses' | 'areaMembership'} ChangedField */
/** @typedef {{ state:ProgressState; requiredCreditUnits?:number; earnedCreditUnits?:number; remainingCreditUnits?:number; projectedCreditUnits?:number; clauseIds:string[]; }} SideResult */
/** @typedef {{ requirementId:string; semanticKey:string; definition:DefinitionChange; changedFields:ChangedField[]; stateChange?:StateChange; previous?:SideResult; next?:SideResult; }} RequirementRevision */
/** @typedef {{ state:'READY'|'NEEDS_REVIEW'; asOf:string; previousVersion?:string; nextVersion?:string; revisionKind?:'AMENDMENT'|'CORRECTION'; inEffectAtAsOf:'PREVIOUS'|'NEXT'|'NONE'|'BOTH'; blockers:RevisionBlocker[]; requirements:RequirementRevision[]; caveats:string[]; }} RulePackRevisionDiff */
/** @typedef {{ asOf:string; previous:unknown; next:unknown; attempts:readonly LedgerAttempt[]; nextAttempts?:readonly LedgerAttempt[]; }} RulePackRevisionRequest */
import { AcademicRulePackVNextSchema, stableAcademicRequirementIdsVNext, } from '../../contracts/index.js';
import { AS_OF, buildAcademicLedger, byCodeUnit } from './ledger.js';
/** areaIds 이외 필드는 행별로 완전히 동일해야 한다. 영역 배정만 바뀔 수 있다. */
/**
 * @param {readonly LedgerAttempt[]} previous
 * @param {readonly LedgerAttempt[]} next
 * @returns {Set<string>}
 */
function movedAreas(previous, next) {
    if (!Array.isArray(next))
        throw new TypeError('nextAttempts must be an array');
    if (next.length !== previous.length)
        throw new TypeError('nextAttempts must list the same ledger rows');
    /** @param {LedgerAttempt} row */
    const rest = (row) => JSON.stringify([row.canonicalCourseId, row.creditUnits, row.ledger,
        row.recognition, row.term ?? null, row.supersedesAttemptToken ?? null, row.retakeApprovalRef ?? null]);
    /** @type {Map<string, LedgerAttempt>} */
    const byToken = new Map();
    for (const row of previous) {
        if (byToken.has(row.attemptToken))
            throw new TypeError(`attempts repeat ${row.attemptToken}`);
        byToken.set(row.attemptToken, row);
    }
    const seen = /** @type {Set<string>} */ (new Set()), moved = /** @type {Set<string>} */ (new Set());
    for (const row of next) {
        const before = byToken.get(row.attemptToken);
        if (!before || seen.has(row.attemptToken) || rest(before) !== rest(row)) {
            throw new TypeError(`nextAttempts may change only areaIds (row ${String(row.attemptToken)})`);
        }
        seen.add(row.attemptToken);
        const a = /** @type {Set<string>} */ (new Set(before.areaIds)), b = /** @type {Set<string>} */ (new Set(row.areaIds));
        for (const id of a)
            if (!b.has(id))
                moved.add(id);
        for (const id of b)
            if (!a.has(id))
                moved.add(id);
    }
    return moved;
}
/** 요건 판정에 필요한 원장 행의 영역 목록이다. */
/**
 * @param {Requirement} requirement
 * @returns {readonly string[]}
 */
function areasRead(requirement) {
    if (requirement.kind === 'CATEGORY_MINIMUM')
        return [requirement.areaId];
    if (requirement.kind === 'AREA_SPREAD')
        return requirement.areaIds;
    return [];
}
/** @type {ReadonlySet<ProgressState>} */
const UNVERIFIED = new Set(['NEEDS_REVIEW', 'NOT_CHECKED', 'NOT_APPLICABLE']);
/**
 * @param {Requirement} requirement
 * @returns {LedgerRequirement}
 */
function toLedger(requirement) {
    const base = { id: requirement.id, evidenceRefs: requirement.evidenceRefs };
    switch (requirement.kind) {
        case 'CREDIT_TOTAL': return { ...base, kind: 'CREDIT_TOTAL', requiredCreditUnits: requirement.requiredCreditUnits };
        case 'CATEGORY_MINIMUM':
            return { ...base, kind: 'CATEGORY_MINIMUM', areaId: requirement.areaId, requiredCreditUnits: requirement.requiredCreditUnits };
        case 'REQUIRED_COURSE': return { ...base, kind: 'REQUIRED_COURSE', canonicalCourseId: requirement.canonicalCourseId };
        case 'K_OF_N': return { ...base, kind: 'K_OF_N', courseIds: requirement.courseIds, k: requirement.k };
        case 'AREA_SPREAD': return { ...base, kind: 'AREA_SPREAD', areaIds: requirement.areaIds,
            minAreas: requirement.minAreas, requiredCreditUnits: requirement.requiredCreditUnits };
        case 'GROUP_CHOICE': return { ...base, kind: 'GROUP_CHOICE', groups: requirement.groups, k: requirement.k };
        case 'NON_CREDIT':
            return { ...base, kind: 'NON_CREDIT', criterionId: requirement.criterionId, verificationMode: requirement.verificationMode };
    }
}
/**
 * @param {readonly string[]} values
 * @returns {string[]}
 */
function sorted(values) {
    return [...values].sort(byCodeUnit);
}
/**
 * @param {readonly string[]} a
 * @param {readonly string[]} b
 * @returns {boolean}
 */
function sameList(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}
/** 요건 결과를 바꾸는 규칙 필드다. 출처인 evidenceRefs는 차이 비교 대상이 아니다. */
/**
 * @param {Requirement} requirement
 * @returns {Partial<Record<ChangedField, string>>}
 */
function ruleFields(requirement) {
    /** @type {Partial<Record<ChangedField, string>>} */
    const fields = {
        kind: requirement.kind,
        sourceClauseIds: sorted(requirement.sourceClauseIds).join('\u0000'),
        exceptionClauseIds: sorted(requirement.exceptionClauseIds).join('\u0000'),
    };
    if (requirement.kind === 'CREDIT_TOTAL')
        fields.requiredCreditUnits = String(requirement.requiredCreditUnits);
    if (requirement.kind === 'CATEGORY_MINIMUM') {
        fields.areaId = requirement.areaId;
        fields.requiredCreditUnits = String(requirement.requiredCreditUnits);
    }
    if (requirement.kind === 'REQUIRED_COURSE')
        fields.canonicalCourseId = requirement.canonicalCourseId;
    if (requirement.kind === 'K_OF_N') {
        fields.courseIds = sorted(requirement.courseIds).join('\u0000');
        fields.k = String(requirement.k);
    }
    if (requirement.kind === 'AREA_SPREAD') {
        fields.areaIds = sorted(requirement.areaIds).join('\u0000');
        fields.minAreas = String(requirement.minAreas);
        fields.requiredCreditUnits = String(requirement.requiredCreditUnits);
    }
    if (requirement.kind === 'GROUP_CHOICE') {
        fields.groups = JSON.stringify(requirement.groups.map(group => JSON.stringify(sorted(group))).sort(byCodeUnit));
        fields.k = String(requirement.k);
    }
    if (requirement.kind === 'NON_CREDIT') {
        fields.criterionId = requirement.criterionId;
        fields.verificationMode = requirement.verificationMode;
    }
    return fields;
}
/** @type {readonly ChangedField[]} */
const FIELD_ORDER = [
    'kind', 'requiredCreditUnits', 'areaId', 'areaIds', 'minAreas', 'groups', 'canonicalCourseId', 'courseIds', 'k',
    'criterionId', 'verificationMode', 'sourceClauseIds', 'exceptionClauseIds', 'clauses',
];
/**
 * @param {Requirement} requirement
 * @returns {string[]}
 */
function clauseIdsOf(requirement) {
    return sorted([...new Set([...requirement.sourceClauseIds, ...requirement.exceptionClauseIds])]);
}
/** 같은 조항 ID라도 문구가 변경될 수 있으므로 조항 종류와 원본 위치를 함께 비교한다. */
/**
 * @param {Pack} previous
 * @param {Pack} next
 * @param {readonly string[]} ids
 * @returns {boolean}
 */
function clausesReworded(previous, next, ids) {
    const before = new Map(previous.clauseInventory.map(clause => [clause.clauseId, clause]));
    const after = new Map(next.clauseInventory.map(clause => [clause.clauseId, clause]));
    return ids.some(id => {
        const a = before.get(id), b = after.get(id);
        /** @param {Pack} pack @param {string|undefined} documentId */
        const sourceHash = (pack, documentId) => documentId === undefined
            ? pack.sourceDocumentSha256 : pack.sourceDocuments?.find(d => d.documentId === documentId)?.sha256;
        return !a || !b || a.kind !== b.kind || a.sourceSpanRef !== b.sourceSpanRef
            || a.sourceDocumentId !== b.sourceDocumentId
            || (a.sourceDocumentId !== undefined || b.sourceDocumentId !== undefined)
                && sourceHash(previous, a.sourceDocumentId) !== sourceHash(next, b.sourceDocumentId);
    });
}
/**
 * @param {Pack} previous
 * @param {Pack} next
 * @param {Requirement} a
 * @param {Requirement} b
 * @returns {ChangedField[]}
 */
function changedFields(previous, next, a, b) {
    const before = ruleFields(a), after = ruleFields(b);
    const changed = FIELD_ORDER.filter(field => field !== 'clauses' && before[field] !== after[field]);
    const ids = clauseIdsOf(a);
    if (sameList(ids, clauseIdsOf(b)) && clausesReworded(previous, next, ids))
        changed.push('clauses');
    return changed;
}
/**
 * @param {Requirement} requirement
 * @param {ProgressRow} row
 * @returns {SideResult}
 */
function side(requirement, row) {
    /** @type {SideResult} */
    const result = { state: row.state, clauseIds: clauseIdsOf(requirement) };
    if (row.requiredCreditUnits !== undefined)
        result.requiredCreditUnits = row.requiredCreditUnits;
    if (row.earnedCreditUnits !== undefined)
        result.earnedCreditUnits = row.earnedCreditUnits;
    if (row.remainingCreditUnits !== undefined)
        result.remainingCreditUnits = row.remainingCreditUnits;
    if (row.projectedCreditUnits !== undefined)
        result.projectedCreditUnits = row.projectedCreditUnits;
    return result;
}
/**
 * @param {ProgressState} before
 * @param {ProgressState} after
 * @returns {StateChange}
 */
function stateChange(before, after) {
    if (UNVERIFIED.has(before) || UNVERIFIED.has(after))
        return 'UNKNOWN';
    if (before === after)
        return 'SAME';
    return after === 'SATISFIED' ? 'GAINED' : 'LOST';
}
/**
 * @param {Pack} pack
 * @param {number} asOfMs
 * @returns {boolean}
 */
function inEffect(pack, asOfMs) {
    return Date.parse(pack.effectiveFrom) <= asOfMs
        && (pack.effectiveUntil === undefined || asOfMs < Date.parse(pack.effectiveUntil));
}
/**
 * @param {Pack['scope']} a
 * @param {Pack['scope']} b
 * @returns {boolean}
 */
function sameScope(a, b) {
    return a.campus === b.campus && a.primaryMajor === b.primaryMajor
        && a.secondaryMajor === b.secondaryMajor && a.majorRole === b.majorRole
        && a.admissionType === b.admissionType && a.curriculumVersion === b.curriculumVersion
        && a.cohortFrom === b.cohortFrom && a.cohortTo === b.cohortTo
        && a.degreePath === b.degreePath && a.track === b.track;
}
/**
 * @param {unknown} raw
 * @param {'previous'|'next'} sideName
 * @param {number} asOfMs
 * @param {RevisionBlocker[]} blockers
 * @returns {Pack|undefined}
 */
function approvedPack(raw, sideName, asOfMs, blockers) {
    const parsed = AcademicRulePackVNextSchema.safeParse(raw);
    if (!parsed.success || parsed.data.state !== 'APPROVED' || !parsed.data.approvedAt) {
        blockers.push({ code: 'NOT_APPROVED', side: sideName });
        return undefined;
    }
    const pack = parsed.data;
    if (Date.parse(pack.approvedAt) > asOfMs || Date.parse(pack.sourcePublishedAt) > asOfMs
        || (pack.validationReport && Date.parse(pack.validationReport.checkedAt) > asOfMs)) {
        blockers.push({ code: 'NOT_APPROVED_BY_AS_OF', side: sideName });
    }
    return pack;
}
/** 두 판본이 명확히 하나의 변경 관계인지 검증하고 관계 유형을 반환한다. */
/**
 * @param {Pack} previous
 * @param {Pack} next
 * @param {RevisionBlocker[]} blockers
 * @returns {'AMENDMENT'|'CORRECTION'|undefined}
 */
function checkRevision(previous, next, blockers) {
    if (previous.version === next.version) {
        blockers.push({ code: 'SAME_VERSION' });
        return undefined;
    }
    if (next.supersedesVersion !== previous.version)
        blockers.push({ code: 'NOT_SUPERSEDING', side: 'next' });
    else if (!stableAcademicRequirementIdsVNext(previous, next))
        blockers.push({ code: 'REQUIREMENT_ID_UNSTABLE', side: 'next' });
    if (!sameScope(previous.scope, next.scope))
        blockers.push({ code: 'SCOPE_MISMATCH' });
    const fromPrev = Date.parse(previous.effectiveFrom), fromNext = Date.parse(next.effectiveFrom);
    if (fromNext < fromPrev || Date.parse(next.approvedAt) < Date.parse(previous.approvedAt)) {
        blockers.push({ code: 'HISTORY_INVERTED' });
        return undefined;
    }
    if (fromNext === fromPrev) {
        // CORRECTION은 같은 유효 기간에 다시 발행한 판본이다. 다른 기간은 모호하므로 거부한다.
        if (previous.effectiveUntil !== next.effectiveUntil)
            blockers.push({ code: 'EFFECTIVE_OVERLAP' });
        return 'CORRECTION';
    }
    if (previous.effectiveUntil === undefined || Date.parse(previous.effectiveUntil) > fromNext) {
        blockers.push({ code: 'EFFECTIVE_OVERLAP' });
    }
    else if (Date.parse(previous.effectiveUntil) < fromNext) {
        blockers.push({ code: 'EFFECTIVE_GAP' });
    }
    return 'AMENDMENT';
}
/**
 * @param {string} asOf
 * @param {RevisionBlocker[]} blockers
 * @param {RulePackRevisionDiff['inEffectAtAsOf']} inEffectAtAsOf
 * @param {Pack} [previous]
 * @param {Pack} [next]
 * @returns {RulePackRevisionDiff}
 */
function blocked(asOf, blockers, inEffectAtAsOf, previous, next) {
    /** @type {RulePackRevisionDiff} */
    const result = {
        state: 'NEEDS_REVIEW', asOf, inEffectAtAsOf, blockers, requirements: [],
        caveats: ['Revision comparison is blocked; no requirement result is carried across this change.'],
    };
    if (previous)
        result.previousVersion = previous.version;
    if (next)
        result.nextVersion = next.version;
    return result;
}
/**
 * 한 원장 행 목록으로 같은 RulePack의 두 APPROVED 판본을 비교한다.
 * 이전에는 attempts, 새 판본에는 nextAttempts(없으면 attempts)를 사용하여 각 판본의 buildAcademicLedger 요건 결과와 맞춘다.
 */
/**
 * @param {RulePackRevisionRequest} input
 * @returns {RulePackRevisionDiff}
 */
export function compareRulePackRevisions(input) {
    if (!AS_OF.test(input.asOf) || !Number.isFinite(Date.parse(input.asOf))) {
        throw new TypeError('asOf must be an ISO-8601 datetime with a timezone offset');
    }
    const asOfMs = Date.parse(input.asOf);
    if (input.nextAttempts !== undefined && !Array.isArray(input.attempts))
        throw new TypeError('attempts must be an array');
    /** 새 판본에서 어떤 과목이 새로 속하거나 제외된 학점 영역이다. 공급되지 않으면 undefined다. */
    const moved = input.nextAttempts === undefined ? undefined : movedAreas(input.attempts, input.nextAttempts);
    /** @type {RevisionBlocker[]} */
    const blockers = [];
    const previous = approvedPack(input.previous, 'previous', asOfMs, blockers);
    const next = approvedPack(input.next, 'next', asOfMs, blockers);
    const prevOn = previous ? inEffect(previous, asOfMs) : false;
    const nextOn = next ? inEffect(next, asOfMs) : false;
    const inEffectAtAsOf = prevOn && nextOn ? 'BOTH' : prevOn ? 'PREVIOUS' : nextOn ? 'NEXT' : 'NONE';
    if (!previous || !next)
        return blocked(input.asOf, blockers, inEffectAtAsOf, previous, next);
    const revisionKind = checkRevision(previous, next, blockers);
    if (blockers.length > 0)
        return blocked(input.asOf, blockers, inEffectAtAsOf, previous, next);
    /** @param {Pack} pack @param {readonly LedgerAttempt[]} attempts */
    const audit = (pack, attempts) => buildAcademicLedger({
        asOf: input.asOf,
        rulePackVersion: pack.version,
        rulePackState: 'APPROVED',
        attempts,
        requirements: pack.requirements.map(toLedger),
    });
    const before = audit(previous, input.attempts), after = audit(next, input.nextAttempts ?? input.attempts);
    const rowsBefore = new Map(before.requirements.map(row => [row.requirementId, row]));
    const rowsAfter = new Map(after.requirements.map(row => [row.requirementId, row]));
    const reqBefore = new Map(previous.requirements.map(req => [req.id, req]));
    const reqAfter = new Map(next.requirements.map(req => [req.id, req]));
    const ids = sorted([...new Set([...reqBefore.keys(), ...reqAfter.keys()])]);
    const requirements = ids.map(/** @returns {RequirementRevision} */ (id) => {
        const a = reqBefore.get(id), b = reqAfter.get(id);
        if (a && b) {
            const fields = changedFields(previous, next, a, b);
            const reads = [...areasRead(a), ...areasRead(b)];
            if (moved && reads.some(areaId => moved.has(areaId)))
                fields.push('areaMembership');
            const prevSide = side(a, rowsBefore.get(id)), nextSide = side(b, rowsAfter.get(id));
            return {
                requirementId: id, semanticKey: b.semanticKey,
                definition: fields.length > 0 ? 'CHANGED' : 'UNCHANGED',
                changedFields: fields,
                // 새 영역 분류 정보가 없으면 영역 요건이 SAME·GAINED·LOST인지 확정할 수 없다.
                stateChange: !moved && reads.length > 0 ? 'UNKNOWN' : stateChange(prevSide.state, nextSide.state),
                previous: prevSide, next: nextSide,
            };
        }
        if (b)
            return { requirementId: id, semanticKey: b.semanticKey, definition: 'ADDED', changedFields: [], next: side(b, rowsAfter.get(id)) };
        return { requirementId: id, semanticKey: a.semanticKey, definition: 'REMOVED', changedFields: [], previous: side(a, rowsBefore.get(id)) };
    });
    const unverified = before.state !== 'READY' || after.state !== 'READY'
        || requirements.some(row => row.stateChange === 'UNKNOWN');
    const caveats = ['Comparison only; neither pack is activated and no graduation decision is made.'];
    if (requirements.some(row => row.stateChange === 'LOST')) {
        caveats.push('Some requirements satisfied under the previous version are not satisfied under the next one.');
    }
    const readsAreas = [...previous.requirements, ...next.requirements].some(req => areasRead(req).length > 0);
    if (!moved && readsAreas) {
        caveats.push('Area membership under the next version was not supplied; area-based results are UNKNOWN.');
    }
    if (moved && moved.size > 0)
        caveats.push('Some courses count in different areas under the next version.');
    if (unverified)
        caveats.push('Some results are unverified on at least one side; their change is UNKNOWN.');
    return {
        state: unverified ? 'NEEDS_REVIEW' : 'READY',
        asOf: input.asOf,
        previousVersion: previous.version,
        nextVersion: next.version,
        revisionKind: revisionKind,
        inEffectAtAsOf,
        blockers: [],
        requirements,
        caveats,
    };
}
