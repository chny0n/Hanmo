// @ts-check
/** @typedef {import("../../contracts/index.js").OfferingOutlookVNext} OfferingOutlookVNext */
/** @typedef {import("./offering.js").OfferingObservation} OfferingObservation */
/** @typedef {import("./offering.js").OfficialAcademicEvent} OfficialAcademicEvent */
/** @typedef {typeof EVALUATION_METHODS[number]} EvaluationMethod */
/** @typedef {OfferingOutlookVNext['signal']} Signal */
/** @typedef {'OFFERED'|'NOT_OFFERED'|'ABSTAIN'} Answer */
/** @typedef {'OFFERED'|'NOT_OFFERED'} Truth */
/** @typedef {{ courseId:string;; observations:readonly OfferingObservation[];; officialEvents?:readonly OfficialAcademicEvent[]; }} EvaluationCourse */
/** @typedef {{ asOf:string;; targetTerm:string; }} EvaluationOrigin */
/** @typedef {{ truthAsOf:string;; origins:readonly EvaluationOrigin[];; courses:readonly EvaluationCourse[]; }} RollingOriginRequest */
/** @typedef {{ truePositive:number;; falsePositive:number;; falseNegative:number;; trueNegative:number;; answered:number;; correct:number;; abstained:number; }} MethodScore */
/** @typedef {{ offeredTerms:number;; observedTerms:number;; shown:number;; thenOffered:number; }} HistoryCount */
/** @typedef {{ courses:number;; alreadyPublished:number;; truthUnavailable:number;; truthConflicting:number;; scored:number;; truth:{offered:number; notOffered:number};; methods:Record<EvaluationMethod, MethodScore>;; outlookSignals:Record<Signal, number>;; historyCounts:HistoryCount[]; }} EvaluationTally */
/** @typedef {EvaluationTally & { asOf:string;; targetTerm:string; }} OriginReport */
/** @typedef {{ evaluatorVersion:typeof ROLLING_ORIGIN_EVALUATOR_VERSION;; modelVersion:typeof FORECAST_OFFERING_MODEL_VERSION;; truthAsOf:string;; status:'READY'|'INSUFFICIENT_DATA';; origins:OriginReport[];; total:EvaluationTally; }} RollingOriginReport */
import { FORECAST_OFFERING_MODEL_VERSION, forecastOffering, sameCourseAt, termWindow, } from './offering.js';
/**
 * 개설 전망의 이동 기준 평가다(설계 A09, TASK-17).
 * 각 과거 평가 시각에는 그때까지 공개·검증된 자료만 사용한다. 정답은 truthAsOf 시점의 전체 개설 목록 중 과목 동일성이 확인된 행에서 가져온다.
 * 모든 방법을 같은 평가 대상에서 비교한다.
 * 보고서는 건수만 제공하며 확률·반올림된 비율·IoU를 제시하지 않는다.
 * HISTORICAL_PATTERN의 k/n은 평가할 때만 다수결로 읽고 학생 화면에는 과거 횟수로 표시한다.
 * 시계·네트워크·난수에 의존하지 않는다.
 */
export const ROLLING_ORIGIN_EVALUATOR_VERSION = 'forecast-offering-rolling-origin-v1';
const TERM = /^(19|20|21)\d{2}-[12]$/;
const OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;
const MAX_ORIGINS = 16;
const MAX_COURSES = 200;
export const EVALUATION_METHODS = ['OUTLOOK', 'RECENT_SAME_SEASON', 'HISTORY_MAJORITY', 'ALWAYS_OFFERED'];
/** @type {readonly Signal[]} */
const SIGNALS = [
    'CONFIRMED_OFFERED', 'CONFIRMED_NOT_OFFERED', 'HISTORICAL_PATTERN', 'EVENT_REVIEW', 'INSUFFICIENT_DATA', 'UNKNOWN',
];
/**
 * @param {string} label
 * @param {unknown} value
 * @returns {number} 실행 결과
 */
function instant(label, value) {
    const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN;
    if (typeof value !== 'string' || !Number.isFinite(parsed) || !OFFSET.test(value)) {
        throw new RangeError(`${label} must be an ISO datetime with a timezone offset`);
    }
    return parsed;
}
/**
 * @param {string} label
 * @param {unknown} value
 * @returns {void} 실행 결과
 */
function assertTerm(label, value) {
    if (typeof value !== 'string' || !TERM.test(value))
        throw new RangeError(`${label} must be YYYY-1 or YYYY-2`);
}
/**
 * @param {EvaluationCourse} course
 * @returns {void} 실행 결과
 */
function checkCourse(course) {
    if (typeof course.courseId !== 'string' || course.courseId.trim() === '')
        throw new RangeError('courseId is required');
    if (!Array.isArray(course.observations))
        throw new TypeError(`observations of ${course.courseId} must be an array`);
    for (const row of course.observations) {
        assertTerm(`observation term of ${course.courseId}`, row.term);
        const published = instant('observation.publishedAt', row.publishedAt);
        if (instant('observation.verifiedAt', row.verifiedAt) < published) {
            throw new RangeError('verifiedAt cannot precede publishedAt');
        }
    }
}
/**
 * @returns {MethodScore} 실행 결과
 */
function emptyScore() {
    return { truePositive: 0, falsePositive: 0, falseNegative: 0, trueNegative: 0, answered: 0, correct: 0, abstained: 0 };
}
/**
 * @returns {EvaluationTally} 실행 결과
 */
function emptyTally() {
    const methods = {};
    for (const method of EVALUATION_METHODS)
        methods[method] = emptyScore();
    const outlookSignals = {};
    for (const signal of SIGNALS)
        outlookSignals[signal] = 0;
    return {
        courses: 0, alreadyPublished: 0, truthUnavailable: 0, truthConflicting: 0, scored: 0,
        truth: { offered: 0, notOffered: 0 }, methods, outlookSignals, historyCounts: [],
    };
}
/** 평가 기준 시각에 목표 학기 상태가 공개됐지만 당시 아직 검증되지 않은 경우도 포함한다. */
/**
 * @param {readonly OfferingObservation[]} rows
 * @param {string} term
 * @param {number} originMs
 * @returns {boolean} 실행 결과
 */
function publishedBy(rows, term, originMs) {
    return rows.some(row => row.term === term && row.state !== 'UNKNOWN' && Date.parse(row.publishedAt) <= originMs);
}
/**
 * @param {readonly OfferingObservation[]} rows
 * @param {string} term
 * @param {number} truthMs
 * @returns {Truth|'UNAVAILABLE'|'CONFLICTING'} 실행 결과
 */
function answerAt(rows, term, truthMs) {
    const states = new Set(rows
        .filter(row => row.term === term && row.coverage === 'COMPLETE_TERM_CATALOG' && row.state !== 'UNKNOWN'
        && Date.parse(row.publishedAt) <= truthMs && Date.parse(row.verifiedAt) <= truthMs && sameCourseAt(row, truthMs))
        .map(row => row.state));
    if (states.size === 0)
        return 'UNAVAILABLE';
    if (states.size > 1)
        return 'CONFLICTING';
    return states.has('OFFERED') ? 'OFFERED' : 'NOT_OFFERED';
}
/** 0/0을 포함한 동률은 답변 불가로 처리한다. */
/**
 * @param {number} offered
 * @param {number} observed
 * @returns {Answer} 실행 결과
 */
function majority(offered, observed) {
    if (2 * offered > observed)
        return 'OFFERED';
    if (2 * offered < observed)
        return 'NOT_OFFERED';
    return 'ABSTAIN';
}
/** 모든 기준 비교 방법은 같은 시각에 전망이 보유한 동일 계절 과거 기록만 사용한다. */
/**
 * @param {EvaluationMethod} method
 * @param {OfferingOutlookVNext} outlook
 * @returns {Answer} 실행 결과
 */
function predict(method, outlook) {
    switch (method) {
        case 'OUTLOOK':
            if (outlook.signal === 'CONFIRMED_OFFERED')
                return 'OFFERED';
            if (outlook.signal === 'CONFIRMED_NOT_OFFERED')
                return 'NOT_OFFERED';
            if (outlook.signal === 'HISTORICAL_PATTERN') {
                return majority(outlook.sameSeasonOfferedTerms, outlook.sameSeasonObservedTerms);
            }
            return 'ABSTAIN';
        case 'RECENT_SAME_SEASON': {
            const complete = outlook.observations.filter(row => row.coverage === 'COMPLETE_TERM_CATALOG' && row.state !== 'UNKNOWN');
            const last = complete[complete.length - 1];
            if (!last)
                return 'ABSTAIN';
            return last.state === 'OFFERED' ? 'OFFERED' : 'NOT_OFFERED';
        }
        case 'HISTORY_MAJORITY':
            return majority(outlook.sameSeasonOfferedTerms, outlook.sameSeasonObservedTerms);
        case 'ALWAYS_OFFERED':
            return 'OFFERED';
    }
}
/**
 * @param {MethodScore} target
 * @param {Answer} answer
 * @param {Truth} truth
 * @returns {void} 실행 결과
 */
function score(target, answer, truth) {
    if (answer === 'ABSTAIN') {
        target.abstained += 1;
        return;
    }
    target.answered += 1;
    if (answer === 'OFFERED') {
        if (truth === 'OFFERED')
            target.truePositive += 1;
        else
            target.falsePositive += 1;
    }
    else if (truth === 'OFFERED')
        target.falseNegative += 1;
    else
        target.trueNegative += 1;
    target.correct = target.truePositive + target.trueNegative;
}
/**
 * @param {HistoryCount[]} list
 * @param {number} offeredTerms
 * @param {number} observedTerms
 * @param {boolean} offered
 * @returns {void} 실행 결과
 */
function addHistory(list, offeredTerms, observedTerms, offered) {
    let row = list.find(item => item.offeredTerms === offeredTerms && item.observedTerms === observedTerms);
    if (!row) {
        row = { offeredTerms, observedTerms, shown: 0, thenOffered: 0 };
        list.push(row);
    }
    row.shown += 1;
    if (offered)
        row.thenOffered += 1;
}
/**
 * @param {HistoryCount[]} list
 * @returns {HistoryCount[]} 실행 결과
 */
function sortHistory(list) {
    return list.sort((a, b) => a.observedTerms - b.observedTerms || a.offeredTerms - b.offeredTerms);
}
/**
 * @param {EvaluationOrigin} origin
 * @param {number} originMs
 * @param {readonly EvaluationCourse[]} courses
 * @param {number} truthMs
 * @returns {OriginReport} 실행 결과
 */
function evaluateOrigin(origin, originMs, courses, truthMs) {
    const tally = emptyTally();
    for (const course of courses) {
        tally.courses += 1;
        if (publishedBy(course.observations, origin.targetTerm, originMs)) {
            tally.alreadyPublished += 1;
            continue;
        }
        const truth = answerAt(course.observations, origin.targetTerm, truthMs);
        if (truth === 'UNAVAILABLE') {
            tally.truthUnavailable += 1;
            continue;
        }
        if (truth === 'CONFLICTING') {
            tally.truthConflicting += 1;
            continue;
        }
        // 평가기는 관측 행을 사전에 잘라내지 않고 전망 함수에 전부 전달한다. 전망 함수가 평가 시각으로 필터링한다.
        const outlook = forecastOffering({
            courseId: course.courseId, targetTerm: origin.targetTerm, asOf: origin.asOf,
            observations: course.observations, officialEvents: course.officialEvents ?? [],
        });
        tally.scored += 1;
        if (truth === 'OFFERED')
            tally.truth.offered += 1;
        else
            tally.truth.notOffered += 1;
        tally.outlookSignals[outlook.signal] += 1;
        for (const method of EVALUATION_METHODS)
            score(tally.methods[method], predict(method, outlook), truth);
        if (outlook.signal === 'HISTORICAL_PATTERN') {
            addHistory(tally.historyCounts, outlook.sameSeasonOfferedTerms, outlook.sameSeasonObservedTerms, truth === 'OFFERED');
        }
    }
    sortHistory(tally.historyCounts);
    return { asOf: origin.asOf, targetTerm: origin.targetTerm, ...tally };
}
/**
 * @param {EvaluationTally} total
 * @param {EvaluationTally} part
 * @returns {void} 실행 결과
 */
function addTally(total, part) {
    total.courses += part.courses;
    total.alreadyPublished += part.alreadyPublished;
    total.truthUnavailable += part.truthUnavailable;
    total.truthConflicting += part.truthConflicting;
    total.scored += part.scored;
    total.truth.offered += part.truth.offered;
    total.truth.notOffered += part.truth.notOffered;
    for (const method of EVALUATION_METHODS) {
        const into = total.methods[method], from = part.methods[method];
        into.truePositive += from.truePositive;
        into.falsePositive += from.falsePositive;
        into.falseNegative += from.falseNegative;
        into.trueNegative += from.trueNegative;
        into.answered += from.answered;
        into.correct += from.correct;
        into.abstained += from.abstained;
    }
    for (const signal of SIGNALS)
        total.outlookSignals[signal] += part.outlookSignals[signal];
    for (const row of part.historyCounts) {
        let into = total.historyCounts.find(item => item.offeredTerms === row.offeredTerms && item.observedTerms === row.observedTerms);
        if (!into) {
            into = { offeredTerms: row.offeredTerms, observedTerms: row.observedTerms, shown: 0, thenOffered: 0 };
            total.historyCounts.push(into);
        }
        into.shown += row.shown;
        into.thenOffered += row.thenOffered;
    }
}
/**
 * 전망 모델과 단순 기준선 세 가지를 동일한 이동 평가 대상에서 채점한다.
 * 목표 상태가 당시 이미 공개됐거나 정답 시각에도 불명확·충돌인 항목은 모든 방법에서 똑같이 제외하고 건수만 기록한다.
 */
/**
 * @param {RollingOriginRequest} input
 * @returns {RollingOriginReport} 실행 결과
 */
export function evaluateOfferingOutlook(input) {
    const truthMs = instant('truthAsOf', input.truthAsOf);
    if (!Array.isArray(input.origins) || !Array.isArray(input.courses)) {
        throw new TypeError('origins and courses must be arrays');
    }
    if (input.origins.length > MAX_ORIGINS)
        throw new RangeError(`more than ${MAX_ORIGINS} origins`);
    if (input.courses.length > MAX_COURSES)
        throw new RangeError(`more than ${MAX_COURSES} courses`);
    const seenCourses = new Set();
    for (const course of input.courses) {
        checkCourse(course);
        if (seenCourses.has(course.courseId))
            throw new TypeError(`duplicate course ${course.courseId}`);
        seenCourses.add(course.courseId);
    }
    const courses = [...input.courses].sort((a, b) => (a.courseId < b.courseId ? -1 : a.courseId > b.courseId ? 1 : 0));
    const seenOrigins = new Set();
    const origins = input.origins.map(origin => {
        const ms = instant('origin.asOf', origin.asOf);
        assertTerm('origin.targetTerm', origin.targetTerm);
        if (termWindow(origin.targetTerm).start <= ms)
            throw new RangeError('an origin must come before its target term starts');
        if (ms > truthMs)
            throw new RangeError('truthAsOf must not precede an origin');
        const key = `${ms}|${origin.targetTerm}`;
        if (seenOrigins.has(key))
            throw new TypeError(`duplicate origin ${origin.asOf} -> ${origin.targetTerm}`);
        seenOrigins.add(key);
        return { origin, ms };
    }).sort((a, b) => a.ms - b.ms || (a.origin.targetTerm < b.origin.targetTerm ? -1 : 1));
    const reports = origins.map(({ origin, ms }) => evaluateOrigin(origin, ms, courses, truthMs));
    const total = emptyTally();
    for (const report of reports)
        addTally(total, report);
    sortHistory(total.historyCounts);
    const scoredInstants = new Set(origins.filter((_, index) => reports[index].scored > 0).map(({ ms }) => ms));
    return {
        evaluatorVersion: ROLLING_ORIGIN_EVALUATOR_VERSION,
        modelVersion: FORECAST_OFFERING_MODEL_VERSION,
        truthAsOf: input.truthAsOf,
        status: scoredInstants.size >= 2 ? 'READY' : 'INSUFFICIENT_DATA',
        origins: reports,
        total,
    };
}
