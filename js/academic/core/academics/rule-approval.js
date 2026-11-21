// @ts-check
/** @typedef {import("zod").z} z */
/** @typedef {import("../../contracts/index.js").AcademicClauseVNext} AcademicClauseVNext */
/** @typedef {import("../../contracts/index.js").AcademicRulePackVNext} AcademicRulePackVNext */
/** @typedef {z.infer<typeof MajorRoleVNextSchema>} MajorRole */
/** @typedef {NonNullable<AcademicRulePackVNext['validationReport']>['blockingIssues'][number]['code']} ContractBlockingCode */
/** @typedef {| ContractBlockingCode
  | 'INVALID_PACK'
  | 'NOT_APPROVED'
  | 'NOT_APPROVED_BY_AS_OF'
  | 'NOT_YET_EFFECTIVE'
  | 'EXPIRED'
  | 'VERSION_ALREADY_ACTIVE'
  | 'SUPERSEDE_CHAIN_BROKEN'} RulePackGateCode */
/** @typedef {{ code:RulePackGateCode;; sourceClauseId?:string; }} RulePackGateIssue */
/** @typedef {{ clauseId:string;; kind:AcademicClauseVNext['kind'];; sourceSpanRef:string;; sourceDocumentId?:string;; appliesToSemanticKeys?:readonly string[];; includedMajorRoles?:readonly MajorRole[];; excludedMajorRoles?:readonly MajorRole[]; }} TrustedSourceClause */
/** @typedef {{ sourceDocumentSha256:string;; sourceDocuments?:readonly {documentId:string;sourceDocumentSha256:string}[];; clauses:readonly TrustedSourceClause[]; }} TrustedSourceInventory */
/** @typedef {{ asOf:string;; active:AcademicRulePackVNext|null;; candidate:unknown;; trustedOriginal:TrustedSourceInventory;; numericCheck?:{matched:number; total:number}; }} RulePackActivationRequest */
/** @typedef {{ decision:'ACTIVATED'|'HELD';; active:AcademicRulePackVNext|null;; candidateVersion?:string;; issues:RulePackGateIssue[]; }} RulePackActivationResult */
/** @typedef {{ clause:TrustedSourceClause;; included:Set<MajorRole>;; excluded:Set<MajorRole>;; keys:string[]; }} Trusted */
import { AcademicRulePackVNextSchema, MajorRoleVNextSchema, stableAcademicRequirementIdsVNext, verifyAcademicSourceCoverageVNext, } from '../../contracts/index.js';
import { AS_OF, ID, assertId, byCodeUnit } from './ledger.js';
const MAX_CLAUSES = 500;
const SHA256 = /^[a-f0-9]{64}$/;
/** @type {ReadonlySet<string>} */
const BLOCKING_CODES = new Set([
    'NUMERIC_SOURCE_MISMATCH', 'CLAUSE_MISSING', 'EXCEPTION_SCOPE_CONFLICT',
    'SOURCE_CONTRADICTION', 'PROMPT_INJECTION', 'UNVERIFIED_ORIGINAL',
    'UNKNOWN_APPLICABILITY', 'OTHER',
]);
/**
 * @param {unknown} value
 * @returns {Record<string, unknown>|undefined} 실행 결과
 */
function record(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value
        : undefined;
}
/** 후보 자체의 경고를 스키마 검증 전에 확인해 후보가 잘못돼도 보류 이유를 기록한다. 해석 불가 경고는 OTHER로 유지한다. */
/**
 * @param {unknown} candidate
 * @returns {{version?:string; issues:RulePackGateIssue[]}} 실행 결과
 */
function reportedIssues(candidate) {
    const body = record(candidate);
    const version = typeof body?.version === 'string' && ID.test(body.version) ? body.version : undefined;
    const list = record(body?.validationReport)?.blockingIssues;
    const issues = [];
    if (Array.isArray(list)) {
        for (const item of list.slice(0, 200)) {
            const row = record(item);
            const code = typeof row?.code === 'string' && BLOCKING_CODES.has(row.code) ? row.code : 'OTHER';
            const clauseId = row?.sourceClauseId;
            issues.push(typeof clauseId === 'string' && ID.test(clauseId) ? { code, sourceClauseId: clauseId } : { code });
        }
    }
    return version === undefined ? { issues } : { version, issues };
}
/**
 * @param {readonly MajorRole[]|undefined} list
 * @param {string} label
 * @returns {Set<MajorRole>} 실행 결과
 */
function roles(list, label) {
    const set = new Set();
    for (const role of list ?? []) {
        if (!MajorRoleVNextSchema.safeParse(role).success)
            throw new TypeError(`${label} has no major role`);
        if (set.has(role))
            throw new TypeError(`${label} repeats ${role}`);
        set.add(role);
    }
    return set;
}
/**
 * @param {TrustedSourceInventory} original
 * @returns {Map<string, Trusted>} 실행 결과
 */
function readTrusted(original) {
    if (!SHA256.test(original.sourceDocumentSha256))
        throw new TypeError('trusted sourceDocumentSha256 must be sha-256 hex');
    if (!Array.isArray(original.clauses) || original.clauses.length === 0 || original.clauses.length > MAX_CLAUSES) {
        throw new RangeError(`trusted inventory needs 1 to ${MAX_CLAUSES} clauses`);
    }
    if (original.sourceDocuments) {
        if (original.sourceDocuments.length < 1 || original.sourceDocuments.length > 10
            || new Set(original.sourceDocuments.map(d => d.documentId)).size !== original.sourceDocuments.length)
            throw new TypeError('trusted inventory requires 1 to 10 distinct source documents');
        for (const document of original.sourceDocuments) {
            assertId(document.documentId, 'trusted documentId');
            if (!SHA256.test(document.sourceDocumentSha256))
                throw new TypeError('trusted document hash must be sha-256 hex');
        }
    }
    const byId = new Map();
    for (const clause of original.clauses) {
        assertId(clause.clauseId, 'trusted clauseId');
        assertId(clause.sourceSpanRef, `${clause.clauseId} sourceSpanRef`);
        if (byId.has(clause.clauseId))
            throw new TypeError(`trusted inventory repeats ${clause.clauseId}`);
        const included = roles(clause.includedMajorRoles, `${clause.clauseId} includedMajorRoles`);
        const excluded = roles(clause.excludedMajorRoles, `${clause.clauseId} excludedMajorRoles`);
        for (const role of included) {
            if (excluded.has(role))
                throw new TypeError(`${clause.clauseId} both includes and excludes ${role}`);
        }
        const keys = [...new Set(clause.appliesToSemanticKeys ?? [])];
        if (keys.length !== (clause.appliesToSemanticKeys ?? []).length) {
            throw new TypeError(`${clause.clauseId} repeats a semantic key`);
        }
        for (const key of keys)
            assertId(key, `${clause.clauseId} semantic key`);
        byId.set(clause.clauseId, { clause, included, excluded, keys });
    }
    return byId;
}
/** RULE-EXC-01: 모든 원문 조항의 종류와 출처 위치를 목록화하고 없는 조항을 만들지 않는다. */
/**
 * @param {AcademicRulePackVNext} pack
 * @param {ReadonlyMap<string, Trusted>} trusted
 * @param {RulePackGateIssue[]} issues
 * @returns {void} 실행 결과
 */
function checkInventory(pack, trusted, issues) {
    const supplied = new Map(pack.clauseInventory.map(clause => [clause.clauseId, clause]));
    for (const [clauseId, { clause }] of trusted) {
        const found = supplied.get(clauseId);
        if (!found || found.kind !== clause.kind || found.sourceSpanRef !== clause.sourceSpanRef
            || found.sourceDocumentId !== clause.sourceDocumentId) {
            issues.push({ code: 'CLAUSE_MISSING', sourceClauseId: clauseId });
        }
    }
    for (const clauseId of supplied.keys()) {
        if (!trusted.has(clauseId))
            issues.push({ code: 'UNVERIFIED_ORIGINAL', sourceClauseId: clauseId });
    }
}
/**
 * @param {AcademicRulePackVNext} pack
 * @param {string} clauseId
 * @returns {AcademicClauseVNext|undefined} 실행 결과
 */
function suppliedClause(pack, clauseId) {
    return pack.clauseInventory.find(clause => clause.clauseId === clauseId);
}
/** RULE-EXC-02: 포함 대상에는 적용하고 제외 대상에는 적용하지 않는다. RULE-EXC-03: 적용 예외는 해당 요건 모두와 연결한다. */
/**
 * @param {AcademicRulePackVNext} pack
 * @param {ReadonlyMap<string, Trusted>} trusted
 * @param {RulePackGateIssue[]} issues
 * @returns {void} 실행 결과
 */
function checkApplicability(pack, trusted, issues) {
    const role = pack.scope.majorRole;
    const bySemanticKey = new Map(pack.requirements.map(requirement => [requirement.semanticKey, requirement]));
    for (const [clauseId, { clause, included, excluded, keys }] of trusted) {
        const supplied = suppliedClause(pack, clauseId);
        // 후보에서 누락한 조항은 CLAUSE_MISSING으로 이미 보고한다.
        if (!supplied)
            continue;
        const roleScoped = included.size > 0 || excluded.size > 0;
        const linked = supplied.coverage.state === 'LINKED';
        if (roleScoped && excluded.has(role)) {
            if (linked)
                issues.push({ code: 'EXCEPTION_SCOPE_CONFLICT', sourceClauseId: clauseId });
            continue;
        }
        if (roleScoped && !included.has(role)) {
            issues.push({ code: 'UNKNOWN_APPLICABILITY', sourceClauseId: clauseId });
            continue;
        }
        if (roleScoped && !linked) {
            issues.push({ code: 'EXCEPTION_SCOPE_CONFLICT', sourceClauseId: clauseId });
            continue;
        }
        if (clause.kind !== 'EXCEPTION')
            continue;
        for (const key of keys) {
            const requirement = bySemanticKey.get(key);
            if (!requirement || !requirement.exceptionClauseIds.includes(clauseId)) {
                issues.push({ code: 'CLAUSE_MISSING', sourceClauseId: clauseId });
                break;
            }
        }
    }
}
/**
 * @param {AcademicRulePackVNext['scope']} a
 * @param {AcademicRulePackVNext['scope']} b
 * @returns {boolean} 실행 결과
 */
function sameScope(a, b) {
    return a.campus === b.campus && a.primaryMajor === b.primaryMajor
        && a.secondaryMajor === b.secondaryMajor && a.majorRole === b.majorRole
        && a.admissionType === b.admissionType && a.curriculumVersion === b.curriculumVersion
        && a.cohortFrom === b.cohortFrom && a.cohortTo === b.cohortTo
        && a.degreePath === b.degreePath && a.track === b.track;
}
/**
 * @param {AcademicRulePackVNext|null} active
 * @param {RulePackGateIssue[]} issues
 * @param {AcademicRulePackVNext} [candidate]
 * @param {string} [candidateVersion]
 * @returns {RulePackActivationResult} 실행 결과
 */
function finish(active, issues, candidate, candidateVersion) {
    const seen = new Set();
    const unique = issues.filter(issue => {
        const key = `${issue.code}\u0000${issue.sourceClauseId ?? ''}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    }).sort((a, b) => byCodeUnit(a.code, b.code) || byCodeUnit(a.sourceClauseId ?? '', b.sourceClauseId ?? ''));
    const result = unique.length === 0 && candidate
        ? { decision: 'ACTIVATED', active: candidate, issues: [] }
        : { decision: 'HELD', active, issues: unique };
    if (candidateVersion !== undefined)
        result.candidateVersion = candidateVersion;
    return result;
}
/** 후보가 활성 규칙집을 대체할 수 있는지 결정한다. HELD이면 원래 active 객체를 덮어쓰지 않고 그대로 돌려준다. */
/**
 * @param {RulePackActivationRequest} input
 * @returns {RulePackActivationResult} 실행 결과
 */
export function decideRulePackActivation(input) {
    if (!AS_OF.test(input.asOf) || !Number.isFinite(Date.parse(input.asOf))) {
        throw new TypeError('asOf must be an ISO-8601 datetime with a timezone offset');
    }
    const asOfMs = Date.parse(input.asOf);
    const trusted = readTrusted(input.trustedOriginal);
    const active = input.active;
    if (active !== null && !AcademicRulePackVNextSchema.safeParse(active).success) {
        throw new TypeError('active pack is not a valid rule pack');
    }
    if (active !== null && active.state !== 'APPROVED')
        throw new TypeError('active pack must be APPROVED');
    const issues = [];
    if (input.numericCheck !== undefined) {
        const { matched, total } = input.numericCheck;
        if (!Number.isSafeInteger(matched) || !Number.isSafeInteger(total) || matched < 0 || total < 0 || matched > total) {
            throw new TypeError('numericCheck must be whole counts with matched <= total');
        }
        if (matched < total)
            issues.push({ code: 'NUMERIC_SOURCE_MISMATCH' });
    }
    const reported = reportedIssues(input.candidate);
    const candidateVersion = reported.version;
    issues.push(...reported.issues);
    const parsed = AcademicRulePackVNextSchema.safeParse(input.candidate);
    if (!parsed.success) {
        issues.push({ code: 'INVALID_PACK' });
        return finish(active, issues, undefined, candidateVersion);
    }
    const pack = parsed.data;
    if (pack.state !== 'APPROVED' || !pack.approvedAt)
        issues.push({ code: 'NOT_APPROVED' });
    else if (Date.parse(pack.approvedAt) > asOfMs || Date.parse(pack.sourcePublishedAt) > asOfMs
        || (pack.validationReport && Date.parse(pack.validationReport.checkedAt) > asOfMs)) {
        issues.push({ code: 'NOT_APPROVED_BY_AS_OF' });
    }
    // selectAcademicRulePackAsOfVNext와 동일하게 시작 포함·종료 미포함 유효기간(effectiveFrom ≤ asOf < effectiveUntil)을 적용한다.
    if (Date.parse(pack.effectiveFrom) > asOfMs)
        issues.push({ code: 'NOT_YET_EFFECTIVE' });
    if (pack.effectiveUntil !== undefined && Date.parse(pack.effectiveUntil) <= asOfMs)
        issues.push({ code: 'EXPIRED' });
    if (pack.sourceDocumentSha256 !== input.trustedOriginal.sourceDocumentSha256
        || (pack.sourceDocuments !== undefined || input.trustedOriginal.sourceDocuments !== undefined)
            && !verifyAcademicSourceCoverageVNext(pack, input.trustedOriginal)) {
        issues.push({ code: 'UNVERIFIED_ORIGINAL' });
    }
    else {
        checkInventory(pack, trusted, issues);
        checkApplicability(pack, trusted, issues);
    }
    if (active !== null) {
        if (!sameScope(active.scope, pack.scope))
            throw new TypeError('candidate and active packs cover different scopes');
        if (pack.version === active.version)
            issues.push({ code: 'VERSION_ALREADY_ACTIVE' });
        else if (!stableAcademicRequirementIdsVNext(active, pack))
            issues.push({ code: 'SUPERSEDE_CHAIN_BROKEN' });
    }
    else if (pack.supersedesVersion !== undefined) {
        issues.push({ code: 'SUPERSEDE_CHAIN_BROKEN' });
    }
    return finish(active, issues, pack, pack.version);
}
