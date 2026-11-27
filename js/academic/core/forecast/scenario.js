// @ts-check
import {OfferingOutlookVNextSchema} from '../../contracts/index.js';

/**
 * 학생이 가정한 과목 개설·미개설 시나리오를 공식/과거 전망과 별도 계층으로 계산한다(설계 A09).
 * 원본 전망은 변경하지 않고 각 가정은 해당 가정의 ID와 사유를 가진 HYPOTHETICAL 행으로 출력한다.
 * 공식 확정과 충돌하는 가정은 충돌 표시를 남기며 공식 승인 대체과목만 제시한다.
 * 가상 결과를 실제 학점·계획·추천이나 공식 확정으로 사용하지 않는다. 시계·네트워크·저장소·난수에 의존하지 않는다.
 */
export const OFFERING_SCENARIO_CORE_VERSION = 'forecast-offering-scenario-v1';

const ID = /^[A-Za-z0-9_.:-]{1,128}$/;
const MAX_BASE = 20;
const MAX_ASSUMPTIONS = 20;
const NOT_OFFERED_REASONS = /** @type {const} */ (['RESEARCH_LEAVE', 'NO_REPLACEMENT_SECTION', 'CANCELLATION', 'OTHER']);
const OFFERED_REASONS = /** @type {const} */ (['NEW_SECTION','OTHER']);

/** @typedef {import('../../contracts/index.js').OfferingOutlookVNext} OfferingOutlookVNext */
/**
 * @typedef {{assumptionId:string,courseId:string,targetTerm:string,assume:'NOT_OFFERED',reason:typeof NOT_OFFERED_REASONS[number]}|{assumptionId:string,courseId:string,targetTerm:string,assume:'OFFERED',reason:typeof OFFERED_REASONS[number]}} OfferingAssumption
 */
/**
 * @typedef {{base:readonly OfferingOutlookVNext[],assumptions:readonly OfferingAssumption[]}} OfferingScenarioRequest
 * 개설 전망 원본과 학생이 직접 설정한 가정의 입력 계약이다.
 */
/**
 * @typedef {{
 * layer:'HYPOTHETICAL',assumptionId:string,courseId:string,targetTerm:string,assume:'OFFERED'|'NOT_OFFERED',
 * reason:OfferingAssumption['reason'],baseSignal:OfferingOutlookVNext['signal'],contradictsOfficial:boolean,
 * officialAlternatives:{courseId:string,evidenceRef:string}[],caveat:string
 * }} OfferingScenarioRow
 * 확정 자료와 가정이 충돌하더라도 원본 전망은 변경하지 않는다.
 */
/**
 * @typedef {{coreVersion:typeof OFFERING_SCENARIO_CORE_VERSION,base:OfferingOutlookVNext[],scenario:OfferingScenarioRow[]}} OfferingScenarioResult
 * 원본 순서와 가정 정렬 결과를 별도로 반환한다.
 */

const CAVEAT_NOT_OFFERED = '학생이 정한 가정입니다. 이 과목이 이 학기에 열리지 않는다고 놓고 본 결과이며, 공식 개설 정보나 예측이 아닙니다.';
const CAVEAT_OFFERED = '학생이 정한 가정입니다. 이 과목이 이 학기에 열린다고 놓고 본 결과이며, 공식 개설 정보나 예측이 아닙니다.';
const CAVEAT_CONTRADICTS = ' 공식 자료로 확인된 상태와 반대되는 가정입니다.';

/** @param {string} courseId @param {string} targetTerm @returns {string} 과목·학기 고유 키 */
const key=(courseId,targetTerm)=> JSON.stringify([courseId, targetTerm]);
/** @param {string} a @param {string} b @returns {number} 식별자 정렬 순서 */
const byCodeUnit=(a,b)=> (a < b ? -1 : a > b ? 1 : 0);

/** @param {unknown} value @param {string} label @returns {void} 식별자 검증 */
function assertId(value,label) {
  if (typeof value !== 'string' || !ID.test(value)) throw new TypeError(`${label} must match ${ID}; refused ${String(value)}`);
}

/** @param {OfferingScenarioRequest} input @returns {OfferingScenarioResult} 가정을 공식 전망과 분리한 계산 결과 */
export function applyOfferingAssumptions(input) {
  if (!Array.isArray(input.base) || !Array.isArray(input.assumptions)) {
    throw new TypeError('base and assumptions must be arrays');
  }
  if (input.base.length > MAX_BASE) throw new RangeError(`more than ${MAX_BASE} base outlooks`);
  if (input.assumptions.length > MAX_ASSUMPTIONS) throw new RangeError(`more than ${MAX_ASSUMPTIONS} assumptions`);

  // 스키마 검증으로 원본과 출력 데이터를 독립적으로 복사한다. 어느 한쪽을 수정해도 다른 쪽에 영향을 주지 않는다.
  const base = input.base.map(outlook => OfferingOutlookVNextSchema.parse(outlook));
  /** @type {Map<string,OfferingOutlookVNext>} */
  const outlooks=new Map();
  for (const outlook of base) {
    const at = key(outlook.courseId, outlook.targetTerm);
    if (outlooks.has(at)) throw new TypeError(`two base outlooks for ${outlook.courseId} ${outlook.targetTerm}`);
    outlooks.set(at, outlook);
  }

  /** @type {Set<string>} */
  const ids=new Set();
  /** @type {Set<string>} */
  const assumed=new Set();
  /** @type {OfferingScenarioRow[]} */
  const scenario = input.assumptions.map((assumption) => {
    assertId(assumption.assumptionId, 'assumptionId');
    if (ids.has(assumption.assumptionId)) throw new TypeError(`duplicate assumption ${assumption.assumptionId}`);
    ids.add(assumption.assumptionId);
    if (assumption.assume === 'NOT_OFFERED') {
      if (!(/** @type {readonly string[]} */ (NOT_OFFERED_REASONS)).includes(assumption.reason)) {
        throw new TypeError(`reason ${String(assumption.reason)} does not fit NOT_OFFERED`);
      }
    } else if (assumption.assume === 'OFFERED') {
      if (!(/** @type {readonly string[]} */ (OFFERED_REASONS)).includes(assumption.reason)) {
        throw new TypeError(`reason ${String(assumption.reason)} does not fit OFFERED`);
      }
    } else {
      throw new TypeError('assume must be OFFERED or NOT_OFFERED');
    }
    const at = key(assumption.courseId, assumption.targetTerm);
    const outlook = outlooks.get(at);
    if (!outlook) throw new TypeError(`no base outlook for ${String(assumption.courseId)} ${String(assumption.targetTerm)}`);
    // 같은 과목·학기에 두 가정을 허용하면 목록 순서가 결과를 결정하므로 거부한다.
    if (assumed.has(at)) throw new TypeError(`two assumptions for ${assumption.courseId} ${assumption.targetTerm}`);
    assumed.add(at);

    // 학생 가정이 공식 확정과 충돌해도 원본 결과를 덮어쓰지 않고 충돌 표시만 추가한다.
    const contradictsOfficial = assumption.assume === 'NOT_OFFERED'
      ? outlook.signal === 'CONFIRMED_OFFERED'
      : outlook.signal === 'CONFIRMED_NOT_OFFERED';
    // 대체과목은 원본 전망이 공식 승인 및 출처를 확인한 경우에만 노출한다.
    const officialAlternatives = assumption.assume === 'NOT_OFFERED'
      ? outlook.alternatives.flatMap(alternative =>
        alternative.status === 'OFFICIALLY_APPROVED' && alternative.evidenceRef !== undefined
          ? [{courseId:alternative.courseId, evidenceRef:alternative.evidenceRef}] : [])
      : [];
    return {
      layer:'HYPOTHETICAL',
      assumptionId:assumption.assumptionId,
      courseId:outlook.courseId,
      targetTerm:outlook.targetTerm,
      assume:assumption.assume,
      reason:assumption.reason,
      baseSignal:outlook.signal,
      contradictsOfficial,
      officialAlternatives,
      caveat:(assumption.assume === 'NOT_OFFERED' ? CAVEAT_NOT_OFFERED : CAVEAT_OFFERED) + (contradictsOfficial ? CAVEAT_CONTRADICTS : ''),
    };
  });
  scenario.sort((a, b) => byCodeUnit(a.courseId, b.courseId) || byCodeUnit(a.targetTerm, b.targetTerm)
    || byCodeUnit(a.assumptionId, b.assumptionId));
  return {coreVersion:OFFERING_SCENARIO_CORE_VERSION, base, scenario};
}
