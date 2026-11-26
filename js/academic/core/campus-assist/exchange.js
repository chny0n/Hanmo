// @ts-check
// 공지 근거의 적용일을 한국 시간으로 비교합니다. 종료일은 당일 끝까지 포함합니다.
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
