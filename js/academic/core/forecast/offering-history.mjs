// 기존 개설 전망의 기간·동일 과목·완전 목록 집계 규칙만 복원합니다.
// 인사 사건·대체과목·졸업요건·신청 상태 및 학교 서버 접근은 이 모듈의 범위가 아닙니다.
const TERM=/^(19|20|21)\d{2}-[12]$/;
const REF=/^[A-Za-z0-9_.:-]{1,128}$/;
const OFFSET=/(?:Z|[+-]\d{2}:\d{2})$/;
const HISTORY_LOOKBACK_TERMS=8,MAX_OBSERVATIONS=20;
const allowed=new Set(['term','state','coverage','sourceRef','publishedAt','verifiedAt','courseIdentity']);
export function offeringHistory({targetTerm,asOf,courseIdentity,observations=[]}){
  if(!TERM.test(targetTerm??'')||typeof asOf!=='string'||!['RESOLVED','EQUIVALENCE_UNVERIFIED'].includes(courseIdentity))
    throw new RangeError('Invalid target identity or term');
  if(!Array.isArray(observations))throw new TypeError('Invalid observations');
  const at=readInstant('asOf',asOf);
  for(const row of observations){
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).some(key=>!allowed.has(key))
      ||!['OFFERED','CONFIRMED_NOT_OFFERED','UNKNOWN'].includes(row.state)
      ||!['COMPLETE_TERM_CATALOG','PARTIAL','NOTICE_ONLY'].includes(row.coverage)
      ||typeof row.sourceRef!=='string'||!REF.test(row.sourceRef)||!row.courseIdentity
      ||Object.keys(row.courseIdentity).some(key=>!['state','revisionRef','checkedAt'].includes(key)))
      throw new TypeError('Invalid or unsupported observation');
    observationVisible(row,at);
    sameCourseAt(row,at);
  }
  if(courseIdentity!=='RESOLVED')return {status:'UNKNOWN',observed:0,offered:0,observations:[]};
  const season=targetTerm.slice(-1);
  const rows=observations.filter(row=>observationVisible(row,at)&&sameCourseAt(row,at)
    &&row.term<targetTerm&&row.term.endsWith('-'+season)&&termsBefore(row.term,targetTerm)<=HISTORY_LOOKBACK_TERMS
    &&termWindow(row.term).end<=at);
  const history=capHistory(dedupe(rows),season);
  const {n,k}=counts(history,season);
  return {status:n>=3?'HISTORICAL_PATTERN':'INSUFFICIENT_DATA',observed:n,offered:k,observations:history};
}
export function sameCourseAt(row, asOfMs) {
    const identity = row.courseIdentity;
    if (identity === undefined)
        return true;
    if (identity.state === 'EQUIVALENCE_UNVERIFIED')
        return false;
    if (identity.state !== 'RESOLVED')
        throw new RangeError('observation courseIdentity must be RESOLVED or EQUIVALENCE_UNVERIFIED');
    if (typeof identity.revisionRef !== 'string' || !REF.test(identity.revisionRef)) {
        throw new RangeError('a RESOLVED observation needs a revisionRef');
    }
    return readInstant('observation.courseIdentity.checkedAt', identity.checkedAt) <= asOfMs;
}

/** 같은 계절의 전체 개설 목록 중 상태가 확정된 행만 센다. 부분 목록·공지·UNKNOWN은 제외한다. */
/**
 * @param {OfferingObservation} row
 * @param {string} season
 * @returns {boolean}
 */
function countsToward(row, season) {
    return row.coverage === 'COMPLETE_TERM_CATALOG' && row.state !== 'UNKNOWN' && row.term.endsWith(`-${season}`);
}
/**
 * @param {readonly OfferingObservation[]} rows
 * @param {string} season
 * @returns {{n:number; k:number}}
 */
function counts(rows, season) {
    const complete = rows.filter(row => countsToward(row, season));
    return { n: complete.length, k: complete.filter(row => row.state === 'OFFERED').length };
}
/**
 * @param {OfferingObservation} row
 * @returns {boolean}
 */
function supportsConfirmation(row) {
    if (row.state === 'UNKNOWN' || row.coverage === 'PARTIAL')
        return false;
    return row.coverage === 'COMPLETE_TERM_CATALOG' || row.coverage === 'NOTICE_ONLY';
}
/**
 * @param {OfferingObservation} row
 * @param {number} asOfMs
 * @returns {boolean}
 */
function observationVisible(row, asOfMs) {
    if (!TERM.test(row.term))
        throw new RangeError('observation term must be YYYY-1 or YYYY-2');
    const published = readInstant('observation.publishedAt', row.publishedAt);
    const verified = readInstant('observation.verifiedAt', row.verifiedAt);
    if (verified < published)
        throw new RangeError('verifiedAt cannot precede publishedAt');
    return published <= asOfMs && verified <= asOfMs;
}

/**
 * 한국시간 정규 학기 범위로 사건 유효기간과 대상 학기의 교집합을 확인한다.
 * 과거 학기가 asOf까지 종료된 경우에만 횟수에 포함한다.
 * 1학기는 3~6월, 2학기는 9~12월이며 이동 기준 평가에서도 같은 달력을 사용한다.
 */
/**
 * @param {string} term
 * @returns {{start:number; end:number}}
 */
export function termWindow(term) {
    const year = Number(term.slice(0, 4));
    if (term.endsWith('-1')) {
        return {
            start: Date.parse(`${year}-03-01T00:00:00.000+09:00`),
            end: Date.parse(`${year}-07-01T00:00:00.000+09:00`),
        };
    }
    return {
        start: Date.parse(`${year}-09-01T00:00:00.000+09:00`),
        end: Date.parse(`${year + 1}-01-01T00:00:00.000+09:00`),
    };
}
/** term이 target보다 몇 개 정규 학기 앞서는지 계산한다(예: 2025-2 → 2026-1은 1). */
/**
 * @param {string} term
 * @param {string} target
 * @returns {number}
 */
function termsBefore(term, target) {
    /** @param {string} value */
    const index = (value) => Number(value.slice(0, 4)) * 2 + Number(value.slice(-1)) - 1;
    return index(target) - index(term);
}
/**
 * @param {readonly OfferingObservation[]} rows
 * @returns {OfferingObservation[]}
 */
function dedupe(rows) {
    /** @type {Map<string, OfferingObservation[]>} */
    const groups = new Map();
    for (const row of rows) {
        const group = groups.get(row.term);
        if (group)
            group.push(row);
        else
            groups.set(row.term, [row]);
    }
    /** @type {OfferingObservation[]} */
    const kept = [];
    for (const group of groups.values()) {
        const chosen = chooseObservation(group);
        if (chosen)
            kept.push(cloneObservation(chosen));
    }
    kept.sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
    return kept;
}
/**
 * @param {readonly OfferingObservation[]} group
 * @returns {OfferingObservation | undefined}
 */
function chooseObservation(group) {
    const best = Math.max(...group.map(row => coverageRank(row.coverage)));
    const top = group.filter(row => coverageRank(row.coverage) === best);
    const explicit = new Set(top.filter(row => row.state !== 'UNKNOWN').map(row => row.state));
    if (explicit.size > 1)
        return undefined;
    return latest(top);
}
/**
 * @param {OfferingObservation['coverage']} coverage
 * @returns {number}
 */
function coverageRank(coverage) {
    if (coverage === 'COMPLETE_TERM_CATALOG')
        return 3;
    if (coverage === 'NOTICE_ONLY')
        return 2;
    return 1;
}
/**
 * @param {readonly OfferingObservation[]} rows
 * @param {string} season
 * @returns {OfferingObservation[]}
 */
function capHistory(rows, season) {
    const counting = rows.filter(row => countsToward(row, season));
    if (counting.length > MAX_OBSERVATIONS)
        throw new RangeError('more than 20 complete same-season observations');
    if (rows.length <= MAX_OBSERVATIONS)
        return [...rows];
    const countedTerms = new Set(counting.map(row => row.term));
    const rest = rows.filter(row => !countedTerms.has(row.term));
    const room = MAX_OBSERVATIONS - counting.length;
    const trimmed = [...counting, ...rest.slice(rest.length - room)];
    trimmed.sort((a, b) => (a.term < b.term ? -1 : a.term > b.term ? 1 : 0));
    return trimmed;
}
/**
 * @param {OfferingObservation} row
 * @returns {OfferingObservation}
 */
function cloneObservation(row) {
    return {
        term: row.term,
        state: row.state,
        coverage: row.coverage,
        sourceRef: row.sourceRef,
        publishedAt: row.publishedAt,
        verifiedAt: row.verifiedAt,
    };
}

/**
 * @template {Timed} T
 * @param {readonly T[]} rows
 * @returns {T}
 */
function latest(rows) {
    const picked = rows.reduce((best, row) => (best === undefined || after(row, best) ? row : best), undefined);
    if (picked === undefined)
        throw new RangeError('expected at least one dated record');
    return picked;
}

/**
 * @param {Timed} a
 * @param {Timed} b
 * @returns {boolean}
 */
function after(a, b) {
    const verified = Date.parse(a.verifiedAt) - Date.parse(b.verifiedAt);
    if (verified !== 0)
        return verified > 0;
    const published = Date.parse(a.publishedAt) - Date.parse(b.publishedAt);
    if (published !== 0)
        return published > 0;
    return a.sourceRef > b.sourceRef;
}
/**
 * @param {readonly string[]} ids
 * @returns {string[]}
 */
function evidence(ids) {
    const unique = [...new Set(ids)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (unique.length > 50)
        throw new RangeError('more than 50 evidence refs');
    return unique;
}
/**
 * @param {string} label
 * @param {string} iso
 * @returns {number}
 */
function readInstant(label, iso) {
    const parsed = Date.parse(iso);
    if (!Number.isFinite(parsed) || !OFFSET.test(iso)) {
        throw new RangeError(`${label} must be an ISO datetime with a timezone offset`);
    }
    return parsed;
}
