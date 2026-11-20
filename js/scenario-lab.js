/*
 * #49 #50: 분리된 합성 시나리오 시연. 기존 BASIC/TIME/SELECT의 핸들러,
 * localStorage, 학교 계정·네트워크, 학업 이수 원장을 읽거나 변경하지 않는다.
 * #71 Windows PC 기준선/시나리오 OFF 검증 전에는 기존 연습 화면에 삽입하지 않는다.
 */
(function (root, factory) {
  const engine = typeof module !== 'undefined' && module.exports
    ? require('./scenario-engine.js') : root.HanmoScenario;
  const api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.HanmoScenarioLab = api;
    if (root.document) api.mount(root.document);
  }
})(typeof globalThis === 'object' ? globalThis : this, function (engine) {
  'use strict';

  const MODE_LABEL = {BASIC:'BASIC', TIME:'TIME', SELECT:'SELECT'};
  const STATES = Object.freeze({
    OFF:'시나리오 꺼짐 · 기존 BASIC/TIME/SELECT 동작에 개입하지 않습니다.',
    READY:'마지막 목표 과목 실패 연습이 시작되었습니다.',
    N_MINUS_1_CONFIRMED:'처음 N-1개 가상 신청만 성공했습니다. 마지막 목표 과목을 시도하세요.',
    LAST_REJECTED:'마지막 목표 과목은 가상 정원 마감으로 실패했습니다.',
    SEARCH_ALTERNATIVE:'대체 과목을 직접 선택하거나, 유효 대안이 없다고 판단하세요.',
    REPLACED:'연습 결과: 유효한 대체 과목을 직접 선택했습니다. 실제 신청 성공이 아닙니다.',
    NO_VALID_ALTERNATIVE:'연습 결과: 유효한 대체 과목이 없습니다. 실제 개설 정보가 아닙니다.',
    UNRESOLVED:'연습 결과: 마지막 과목은 미해결 상태입니다.',
    ACTIVE:'가상 신청 직후 접속 단절을 겪는 연습을 시작합니다.',
    REQUEST_SENT:'가상 신청 요청을 보냈습니다. 중복 신청은 피하세요.',
    VIRTUAL_DROP:'가상 연결이 끊어졌습니다. 실제 네트워크는 정상입니다.',
    RECONNECT_QUEUE:'가상 대기열에 들어왔습니다. 재입장 절차를 진행하세요.',
    RECONCILE:'가상 신청 상태를 확인해야 합니다. 확인 없이 재신청하지 마세요.',
    CONFIRMED:'연습 결과: 가상 신청 성공 확인. 실제 학교 수강신청이 아닙니다.',
    NOT_APPLIED:'연습 결과: 가상 신청 미처리. 실제 학교 신청 여부는 확인하지 않았습니다.',
    UNKNOWN:'연습 결과: 가상 신청 결과 불명. 중복 신청·자동 성공을 금지합니다.',
  });
  const ACTIONS = Object.freeze({
    READY:[['CONFIRM_PREVIOUS','처음 N-1개 신청 확인']],
    N_MINUS_1_CONFIRMED:[['ATTEMPT_LAST','마지막 목표 과목 신청']],
    LAST_REJECTED:[['OPEN_ALTERNATIVES','대체 과목 찾기']],
    SEARCH_ALTERNATIVE:[
      ['CHOOSE_ALTERNATIVE','대체 과목 직접 선택'],
      ['DECLARE_NO_ALTERNATIVE','유효 대안 없음 판단'],
      ['ABANDON','미해결로 끝내기'],
    ],
    ACTIVE:[['SUBMIT','가상 신청 클릭']],
    REQUEST_SENT:[['VIRTUAL_DROP','가상 접속 단절 체험'],['SUBMIT','중복 신청 시도(오류 학습)']],
    VIRTUAL_DROP:[['RECONNECT','모의 재접속']],
    RECONNECT_QUEUE:[['QUEUE_FINISHED','가상 대기열 통과']],
    RECONCILE:[['VERIFY','가상 신청 상태 조회']],
  });
  const ERROR_LABELS = {
    ALTERNATIVE_INVALID:'선택한 대체 과목은 시간·학점·선수·중복·영역 제약을 충족하지 않습니다.',
    VALID_ALTERNATIVE_EXISTS:'유효한 가상 대체 과목이 존재합니다. 아직 대안 없음으로 확정할 수 없습니다.',
    INVALID_TRANSITION:'현재 단계에서 허용되지 않은 동작입니다. 기존 신청이 자동 재시도되지 않습니다.',
  };
  function configFor(input) {
    if (!input || typeof input !== 'object') throw new TypeError('연습 입력이 필요합니다.');
    const scenarioId=input.scenarioId;
    if (scenarioId!=='LAST_COURSE_FAIL' && scenarioId!=='RECONNECT_RECOVERY') {
      throw new TypeError('마지막 신청 실패 또는 재접속을 선택해 주세요.');
    }
    const variant=input.variant ?? 'VALID';
    if (!['VALID','NONE','CONFLICT'].includes(variant)) throw new TypeError('대체 조건이 올바르지 않습니다.');
    const seed=input.seed;
    if (!Number.isSafeInteger(seed) || seed<0 || seed>0xffffffff) {
      throw new RangeError('시드는 0 이상 4294967295 이하 정수여야 합니다.');
    }
    if (typeof input.enabled !== 'boolean') throw new TypeError('시나리오 동의 상태를 확인해 주세요.');
    const config={
      schemaVersion:1,scenarioId,mode:input.mode,seed,enabled:input.enabled,
      virtualClockStart:'2026-11-19T10:00:00+09:00',
      syntheticCourseIds:scenarioId==='LAST_COURSE_FAIL'
        ?['SYN-LAST','SYN-ALT-1'] : ['SYN-REQUEST'],
      alternatives:scenarioId==='LAST_COURSE_FAIL'?[{
        syntheticCourseId:'SYN-ALT-1',
        timeOk:variant!=='CONFLICT',creditOk:variant!=='NONE',
        prerequisiteOk:true,noDuplicate:true,areaOk:true,
      }]:[],
    };
    return config;
  }
  function actionsFor(state) {
    return (ACTIONS[state]??[]).map(([type,label])=>Object.freeze({
      type,label,...(type==='CHOOSE_ALTERNATIVE'?{syntheticCourseId:'SYN-ALT-1'}:{}),
      elapsedVirtualMs:type==='QUEUE_FINISHED'?4000:1000,
    }));
  }
  function step(session, action) {
    const event={
      type:action.type,elapsedVirtualMs:action.elapsedVirtualMs,
      ...(action.syntheticCourseId?{syntheticCourseId:action.syntheticCourseId}:{}),
    };
    return engine.dispatch(session,event);
  }
  function sessionInfo(session) {
    const report=engine.summary(session);
    const lastError=report.errors.at(-1);
    return Object.freeze({
      state:report.state,
      title:STATES[report.state]??'확인할 수 없는 상태',
      seed:report.seed,
      mode:report.mode,
      source:report.source,
      elapsedVirtualMs:report.elapsedVirtualMs,
      duplicateAttempts:report.duplicateAttempts,
      lastError:lastError?ERROR_LABELS[lastError.code]??'허용되지 않은 동작입니다.':null,
      terminal:report.terminalState!==null,
      actions:report.actions,
    });
  }
  function mount(doc) {
    const host=doc.getElementById('scenario-lab');
    if (!host) return null;
    const byId=id=>{
      const el=doc.getElementById(id);
      if (!el) throw new Error('시연 화면 요소 누락: '+id);
      return el;
    };
    const form=byId('scenario-form');
    const status=byId('scenario-status');
    const steps=byId('scenario-actions');
    const history=byId('scenario-history');
    const details=byId('scenario-details');
    const errors=byId('scenario-errors');
    const variant=byId('scenario-variant');
    let session=null;
    const make=(tag,value)=>{
      const el=doc.createElement(tag);
      el.textContent=value;
      return el;
    };
    function render(){
      steps.replaceChildren();history.replaceChildren();
      if (!session) {
        status.textContent=STATES.OFF;
        details.textContent='가상 시나리오 시작을 선택하기 전에는 입력·저장·신청 처리 없음.';
        errors.textContent='';
        return;
      }
      const info=sessionInfo(session);
      status.textContent=info.title;
      details.textContent='연습 모드 '+info.mode+' · 시드 '+info.seed
        +' · 가상 경과 '+(info.elapsedVirtualMs/1000).toFixed(1)+'초'
        +' · 중복 신청 시도 '+info.duplicateAttempts+'건 · 출처: 가상 연습';
      errors.textContent=info.lastError??'';
      for(const action of actionsFor(info.state)){
        const button=make('button',action.label);
        button.type='button';
        button.addEventListener('click',()=>{
          session=step(session,action);
          render();
        });
        steps.append(button);
      }
      for(const action of info.actions){
        history.append(make('li',action.type+' → '+action.state
          +' (가상 시각 '+(action.elapsedVirtualMs/1000).toFixed(1)+'초)'));
      }
      if(info.terminal)steps.append(make('p','종료된 가상 신청은 자동 재시도되지 않습니다.'));
    }
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const agreed=byId('scenario-enabled').checked;
      if (!agreed) {
        session=null;render();
        errors.textContent='시나리오는 기본 꺼짐입니다. 직접 동의한 경우에만 시연을 시작합니다.';
        return;
      }
      try {
        const data={
          scenarioId:byId('scenario-kind').value,
          mode:byId('scenario-mode').value,
          variant:variant.value,
          seed:Number(byId('scenario-seed').value),
          enabled:true,
        };
        session=engine.createScenario(configFor(data));
        render();
      } catch (error) {
        session=null;render();
        errors.textContent=error instanceof Error?error.message:'입력값을 확인해 주세요.';
      }
    });
    byId('scenario-reset').addEventListener('click',()=>{
      session=null;byId('scenario-enabled').checked=false;
      render();
    });
    byId('scenario-kind').addEventListener('change',()=>{
      variant.disabled=byId('scenario-kind').value!=='LAST_COURSE_FAIL';
    });
    variant.disabled=byId('scenario-kind').value!=='LAST_COURSE_FAIL';
    render();
    return Object.freeze({getSummary:()=>session?sessionInfo(session):null});
  }
  return Object.freeze({configFor,actionsFor,step,sessionInfo,mount});
});
