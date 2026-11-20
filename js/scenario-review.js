/*
 * #62 synthetic practice result explainer.
 * Display-only; never writes to institutional or academic ledgers.
 */
(function(root,factory) {
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.HanmoScenarioReview=api;
})(typeof globalThis==='object'?globalThis:this,function() {
  'use strict';
  const LABELS=Object.freeze({
    REPLACED:'직접 유효한 대체과목을 선택함',
    NO_VALID_ALTERNATIVE:'유효한 대체과목이 없음을 확인함',
    UNRESOLVED:'마지막 과목 문제를 해결하지 못함',
    CONFIRMED:'가상 신청 성공을 조회해 확인함',
    NOT_APPLIED:'가상 신청 미처리를 조회해 확인함',
    UNKNOWN:'결과 불명 · 확인 전 재신청 금지',
    COMPLETED:'복합 위기 연습 종료',
  });
  const ACTIONS=Object.freeze({
    CONFIRM_PREVIOUS:'이전 과목 신청 확인',
    ATTEMPT_LAST:'마지막 과목 신청 시도',
    OPEN_ALTERNATIVES:'대체 목록 탐색',
    CHOOSE_ALTERNATIVE:'대체과목 직접 선택',
    DECLARE_NO_ALTERNATIVE:'대안 없음 판단',
    ABANDON:'해결 보류',
    SUBMIT:'가상 신청 요청',
    VIRTUAL_DROP:'가상 연결 끊김',
    RECONNECT:'모의 재접속',
    QUEUE_FINISHED:'가상 대기열 통과',
    VERIFY:'가상 신청 결과 조회',
    KEEP_REGISTRATION:'가상 신청 유지 선택',
    MISTAKEN_CANCEL:'가상 취소 실수',
    CONTINUE_RECONNECT:'다음 위기로 이동',
  });
  const ERROR_LABELS=Object.freeze({
    ALTERNATIVE_INVALID:'시간·학점·선수요건·중복·영역 조건을 충족하지 않는 대체과목을 선택했습니다.',
    VALID_ALTERNATIVE_EXISTS:'가능한 가상 대체과목이 있는데 유효 대안이 없다고 판단했습니다.',
    INVALID_TRANSITION:'허용되지 않은 단계 또는 중복 신청을 시도했습니다. 실제 신청 처리는 수행되지 않았습니다.',
  });
  function validate(value) {
    if(!value || typeof value!=='object'||Array.isArray(value)
      ||value.source!=='SYNTHETIC'
      ||!['LAST_COURSE_FAIL','RECONNECT_RECOVERY','COMPOSITE'].includes(value.scenarioId)
      ||!Number.isSafeInteger(value.seed)
      ||!Array.isArray(value.actions)||!Array.isArray(value.errors)
      ||value.actions.length>150||value.errors.length>150
      ||!Number.isSafeInteger(value.elapsedVirtualMs)||value.elapsedVirtualMs<0
      ||!Number.isSafeInteger(value.duplicateAttempts)||value.duplicateAttempts<0) {
      throw new TypeError('Only bounded synthetic scenario summaries can be reviewed');
    }
    return value;
  }
  function completed(report) {
    return report.terminalState!==null && report.terminalState!==undefined;
  }
  function evaluate(raw) {
    const report=validate(raw);
    const done=completed(report);
    const terminal=report.scenarioId==='COMPOSITE'
      ?report.reconnectOutcome:report.terminalState;
    const last=report.scenarioId==='COMPOSITE'?report.lastOutcome:
      report.scenarioId==='LAST_COURSE_FAIL'?report.terminalState:null;
    const cancellation=report.scenarioId==='COMPOSITE'?report.cancellationMistakes??0:0;
    const errors=report.errors.length;
    const duplication=report.duplicateAttempts;
    const facts=[];
    if(last)facts.push(Object.freeze({id:'alternative',label:'대체과목 판단',
      status:last==='REPLACED'||last==='NO_VALID_ALTERNATIVE'?'OBSERVED':'REVIEW',
      description:LABELS[last]??'확인 필요'}));
    if(terminal && terminal!=='COMPLETED' && report.scenarioId!=='LAST_COURSE_FAIL'){
      facts.push(Object.freeze({id:'recovery',label:'재접속 후 확인',
        status:terminal==='UNKNOWN'?'CAUTION':'OBSERVED',
        description:LABELS[terminal]??'확인 필요'}));
    }
    facts.push(Object.freeze({id:'duplicate',label:'중복 신청 위험',
      status:duplication>0?'REVIEW':'OBSERVED',
      description:duplication>0
        ?'가상 중복 신청 시도 '+duplication+'건. 확인 전 재신청을 중단해야 합니다.'
        :'가상 중복 신청 시도가 기록되지 않았습니다.'}));
    if(report.scenarioId==='COMPOSITE')facts.push(Object.freeze({
      id:'cancellation',label:'취소 실수 예방',
      status:cancellation>0?'REVIEW':'OBSERVED',
      description:cancellation>0?'가상 취소 실수 '+cancellation+'건. 취소 전 강좌를 확인하세요.'
        :'가상 취소 실수가 기록되지 않았습니다.',
    }));
    if(errors>0)facts.push(Object.freeze({
      id:'correction',label:'진행 중 수정이 필요했던 판단',
      status:'REVIEW',description:'잘못된 단계/제약 판단 '+errors+'건을 기록했습니다.',
    }));
    const needsReview=last==='UNRESOLVED'||duplication>0||cancellation>0||errors>0;
    const disposition=!done?'IN_PROGRESS':needsReview?'NEEDS_REVIEW'
      :terminal==='UNKNOWN'?'AWAIT_VERIFICATION':'OBSERVED_CORRECT';
    const title=disposition==='IN_PROGRESS'?'아직 연습 중입니다.'
      :disposition==='NEEDS_REVIEW'?'다시 확인할 행동이 있습니다.'
      :disposition==='AWAIT_VERIFICATION'?'결과 불명을 확인한 채 종료했습니다.'
      :'가상 연습의 필수 대응을 완료했습니다.';
    const mistakes=report.errors.map((error,i)=>Object.freeze({
      index:i+1,
      actionLabel:ACTIONS[error.eventType??error.type]??'잘못된 단계 조작',
      description:ERROR_LABELS[error.code]??'현재 단계에서 허용되지 않는 가상 행동입니다.',
      nextAction:error.code==='ALTERNATIVE_INVALID'
        ?'대체과목의 모든 제약을 확인한 뒤 선택하세요.'
        :error.code==='VALID_ALTERNATIVE_EXISTS'
        ?'대체 가능 과목이 남아 있는지 다시 확인하세요.'
        :'가상 신청 결과와 단계 상태를 확인한 뒤 계속 진행하세요.',
    }));
    const timeline=report.actions.map((action,i)=>Object.freeze({
      index:i+1,phase:action.phase??(report.scenarioId==='LAST_COURSE_FAIL'?'LAST':'RECONNECT'),
      label:ACTIONS[action.type]??'단계 기록',
      state:action.state,
      elapsedVirtualMs:action.elapsedVirtualMs,
    }));
    const mainRule='이 결과는 가상 연습 행동에 대한 복기일 뿐 실제 수강신청·학점·공식 개설을 증명하지 않습니다.';
    const notice=terminal==='UNKNOWN'
      ?'신청 결과가 확인되지 않으면 성공·실패를 단정하거나 같은 신청을 반복하면 안 됩니다.'
      :mainRule;
    return Object.freeze({
      scenarioId:report.scenarioId,mode:report.mode,seed:report.seed,
      disposition,title,notice,terminalLabel:LABELS[terminal]??'진행 중',
      lastLabel:last?LABELS[last]:null,
      source:'SYNTHETIC',completed:done,
      elapsedVirtualMs:report.elapsedVirtualMs,
      duplicateAttempts:duplication,cancellationMistakes:cancellation,
      errorCount:errors,facts:Object.freeze(facts),
      mistakes:Object.freeze(mistakes),timeline:Object.freeze(timeline),
    });
  }
  function plainText(review) {
    if(!review||review.source!=='SYNTHETIC')throw new TypeError('Synthetic review required');
    const lines=[
      '한모 가상 돌발상황 훈련 결과 (공식 수강신청이 아닙니다)',
      '유형: '+review.scenarioId+' / 모드: '+review.mode+' / 시드: '+review.seed,
      '상태: '+review.title,
      '가상 경과: '+(review.elapsedVirtualMs/1000).toFixed(1)+'초',
      ...review.facts.map(f=>'· '+f.label+': '+f.description),
      ...review.mistakes.map(f=>'· 다시 확인: '+f.actionLabel+' — '+f.description+' '+f.nextAction),
      review.notice,
    ];
    return lines.join('\n');
  }
  return Object.freeze({evaluate,plainText});
});
