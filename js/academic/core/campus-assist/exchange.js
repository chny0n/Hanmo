// @ts-check
import {ExchangeApplicantSchema,ExchangePolicySchema,ExchangeResultSchema} from '../../contracts/campus-assist/index.js';
/** @typedef {import('../../contracts/campus-assist/index.js').ExchangeApplicant} ExchangeApplicant */
/** @typedef {import('../../contracts/campus-assist/index.js').ExchangePolicy} ExchangePolicy */
/** @typedef {import('../../contracts/campus-assist/index.js').ExchangeResult} ExchangeResult */
/** @typedef {import('../../contracts/campus-assist/index.js').ExchangeCheck} ExchangeCheck */
/** @typedef {ExchangeCheck['status']} Status */
const DISCLAIMER=/** @type {const} */ ('제시된 기준에 대한 참고 결과이며 공식 지원 자격·선발 결과가 아닙니다.');
/**
 * 교환학생 정책 날짜(YYYY-MM-DD)는 학교 행정시간대인 한국시간(UTC+09:00, 서머타임 없음) 달력 날짜다.
 * effectiveFrom은 당일 00:00부터, effectiveUntil은 당일 끝까지 포함한다.
 * asOf의 입력 시간대는 달라도 절대 시각으로 비교한다. 교류 대학 목록과 평가 함수는 같은 헬퍼를 사용해 일 경계가 달라지지 않게 한다.
 */
export const EXCHANGE_POLICY_TIME_ZONE=/** @type {const} */ ('Asia/Seoul');
/** @param {{effectiveFrom:string,effectiveUntil?:string|undefined}} policy @param {string} asOf @returns {boolean} 한국시간의 정책 적용 기간 여부 */
export function exchangePolicyInEffect(policy,asOf){
  const at=Date.parse(asOf);
  if(!Number.isFinite(at))throw new RangeError('Invalid asOf');
  const start=Date.parse(policy.effectiveFrom+'T00:00:00+09:00');
  const endExclusive=policy.effectiveUntil
    ?Date.parse(policy.effectiveUntil+'T00:00:00+09:00')+86400000:Infinity;
  if(!Number.isFinite(start)||Number.isNaN(endExclusive))return false;
  return start<=at&&at<endExclusive;
}
/** @typedef {{policy:ExchangePolicy|null,reason:'CURRENT'|'NONE_IN_EFFECT'|'REVOKED_OR_BLOCKED_IN_EFFECT'|'CONFLICTING_IN_EFFECT'}} ExchangePolicyResolution */
/**
 * asOf 시점에 partnerId와 track에 적용되는 유일한 정책 행을 선택한다.
 * 그때 게시·검증되지 않은 행은 제외한다. 유효한 REVOKED·BLOCKED 행이 하나라도 있으면 조합을 격리하며 이전 승인판으로 되돌리지 않는다.
 * 승인판이 두 개 이상이면 충돌, 정확히 하나면 현재판이다. 유효기간이 겹치지 않는 옛 판본은 영향을 주지 않는다.
 * 교류 대학 목록과 평가에서 같은 판정 함수를 사용한다.
 */
/** @param {readonly ExchangePolicy[]} rules @param {string} partnerId @param {ExchangePolicy['track']} track @param {string} asOf @returns {ExchangePolicyResolution} 유효한 정책 판본 하나 또는 보류 사유 */
export function resolveExchangePolicy(rules,partnerId,track,asOf){
  const at=Date.parse(asOf);
  if(!Number.isFinite(at))throw new RangeError('Invalid asOf');
  const inEffect=rules.filter(r=>r.partnerId===partnerId&&r.track===track
    &&Date.parse(r.publishedAt)<=at&&Date.parse(r.verifiedAt)<=at&&exchangePolicyInEffect(r,asOf));
  if(!inEffect.length)return {policy:null,reason:'NONE_IN_EFFECT'};
  if(inEffect.some(r=>r.rights!=='APPROVED'))return {policy:null,reason:'REVOKED_OR_BLOCKED_IN_EFFECT'};
  if(inEffect.length>1)return {policy:null,reason:'CONFLICTING_IN_EFFECT'};
  return {policy:inEffect[0],reason:'CURRENT'};
}
/** @param {ExchangeApplicant} rawApplicant @param {ExchangePolicy|null} rawPolicy @param {string} asOf @returns {ExchangeResult} 참고용 교환학생 규정 대조 결과 */
export function evaluateExchange(rawApplicant,rawPolicy,asOf){
  const applicant=ExchangeApplicantSchema.parse(rawApplicant);
  const clock=Date.parse(asOf);
  if(!Number.isFinite(clock))throw new RangeError('Invalid asOf');
  const policy=rawPolicy?ExchangePolicySchema.parse(rawPolicy):null;
  const valid=!!policy&&policy.rights==='APPROVED'&&Date.parse(policy.publishedAt)<=clock
    &&Date.parse(policy.verifiedAt)<=clock&&exchangePolicyInEffect(policy,asOf);
  /** @type {ExchangeCheck[]} */
  const checks=[];
  /** @param {ExchangeCheck['code']} code @param {Status} status @param {string} explanation @returns {void} 참고 판정 항목 기록 */
  const add=(code,status,explanation)=>{
    checks.push({code,status,explanation,...(valid&&policy?{sourceRevision:policy.sourceRevision}:{})});
  };
  if(!valid||!policy){
    for(const code of /** @type {const} */ (['TRACK','GPA','SEMESTERS','TRANSFER','CANCELLATION','PARTNER_GPA','LANGUAGE']))
      add(code,'UNKNOWN','현재 적용되고 검증된 공식 규정 판본이 없습니다.');
    return ExchangeResultSchema.parse({asOf,checks,result:'UNKNOWN',disclaimer:DISCLAIMER});
  }
  add('TRACK',policy.track===applicant.track?'PASS':'UNKNOWN',
    policy.track===applicant.track?'선발 경로가 적용 규정과 일치합니다.':'선발 경로에 맞는 별도 규정을 확인해야 합니다.');
  const minimum=policy.minimumGpa;
  add('GPA',applicant.gpa===undefined?'UNKNOWN':applicant.gpa>=minimum?'PASS':'FAIL',
    applicant.gpa===undefined?'평점 기준 입력 필요':'일반 평점 기준 '+minimum.toFixed(1)+' 이상과 대조했습니다.');
  const term=applicant.duration===1?policy.termRules?.one:policy.termRules?.two;
  const sem=applicant.completedSemesters;
  const interval=applicant.status==='ENROLLED'?term?.ENROLLED:applicant.status==='LEAVE'?term?.LEAVE:undefined;
  add('SEMESTERS',sem===undefined||!interval?'UNKNOWN'
    :sem>=interval.min&&sem<=interval.max?'PASS':'FAIL',
    interval?'규정 판본의 수료 학기 허용 구간 '+interval.min+'~'+interval.max+'와 대조했습니다.'
      :'학적별 파견 가능 수료 학기 구간의 최신 공식 근거가 누락되어 보류합니다.');
  /** @type {Status} */
  let transfer='NOT_APPLICABLE';
  if(applicant.duration===2)transfer=policy.twoSemesterTransfersAllowed===undefined
    ||applicant.transfer===undefined?'UNKNOWN'
    :applicant.transfer&&!policy.twoSemesterTransfersAllowed?'FAIL':'PASS';
  add('TRANSFER',transfer,policy.twoSemesterTransfersAllowed===undefined
    ?'2학기 프로그램의 편입생 제한 규정 출처가 미확인입니다.'
    :'2학기 프로그램의 확인된 편입생 제한과 대조했습니다.');
  const prior=policy.priorCancellationAllowed;
  add('CANCELLATION',prior===undefined||applicant.previousCancellation==='UNKNOWN'?'UNKNOWN'
    :applicant.previousCancellation==='CANCELLED'&&!prior?'FAIL':'PASS',
    prior===undefined?'이전 선발 취소 이력에 대한 현행 규정 확인이 필요합니다.'
      :'규정 판본의 과거 취소 이력 제한을 대조했습니다.');
  add('PARTNER_GPA',policy.partnerMinimumGpa===undefined?'UNKNOWN':applicant.gpa===undefined?'UNKNOWN'
    :applicant.gpa>=policy.partnerMinimumGpa?'PASS':'FAIL',
    policy.partnerMinimumGpa===undefined?'파견대학별 평점 요건이 아직 검증되지 않았습니다.':'파견대학별 추가 평점 기준을 대조했습니다.');
  const lang=policy.requiredLanguage;
  /** @type {Status} */
  let languageStatus='UNKNOWN';
  if(lang&&applicant.language&&applicant.departureOn){
    const same=lang.test===applicant.language.test;
    languageStatus=!same||applicant.language.score<lang.minimumScore
      ||applicant.language.expiresOn<applicant.departureOn?'FAIL':'PASS';
  }
  add('LANGUAGE',languageStatus,lang?'파견 예정일의 시험 종류·점수·유효기간을 함께 확인합니다.':'파견대학별 공식 어학 기준 확인 필요.');
  const result=checks.some(x=>x.status==='FAIL')?'FAIL':checks.some(x=>x.status==='UNKNOWN')?'UNKNOWN':'PASS';
  return ExchangeResultSchema.parse({asOf,policyRevision:policy.sourceRevision,result,checks,disclaimer:DISCLAIMER});
}
