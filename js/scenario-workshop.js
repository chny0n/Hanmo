/*
 * #49/#50/#62 Figma-ready independent student workflow controller.
 * No localStorage/sessionStorage, fetch, campus API, or legacy mutation.
 * #71 Windows Chrome/Edge gate must pass before attaching this to original
 * BASIC/TIME/SELECT handlers. The page only uses synthetic scenario engines.
 */
(function(root,factory) {
  const onNode=typeof module!=='undefined'&&module.exports;
  const engine=onNode?require('./scenario-engine.js'):root.HanmoScenario;
  const composite=onNode?require('./scenario-composite.js'):root.HanmoComposite;
  const review=onNode?require('./scenario-review.js'):root.HanmoScenarioReview;
  const api=factory(engine,composite,review);
  if(onNode)module.exports=api;
  else {
    root.HanmoScenarioWorkshop=api;
    if(root.document)root.HanmoWorkshopSession=api.mount(root.document);
  }
})(typeof globalThis==='object'?globalThis:this,function(engine,composite,review) {
  'use strict';
  const PRESETS=Object.freeze({
    LAST_VALID:Object.freeze({scenarioId:'LAST_COURSE_FAIL',variant:'VALID',difficulty:'BEGINNER',
      title:'마지막 목표 과목 정원 마감',description:'이전 과목 신청 뒤 마지막 가상 강좌가 마감됩니다. 대체과목을 직접 찾으세요.'}),
    LAST_CONFLICT:Object.freeze({scenarioId:'LAST_COURSE_FAIL',variant:'CONFLICT',difficulty:'INTERMEDIATE',
      title:'대체과목 시간표 충돌',description:'마지막 강좌가 마감되고 대안의 시간이 겹칩니다. 무효 대체를 신청하면 안 됩니다.'}),
    LAST_NONE:Object.freeze({scenarioId:'LAST_COURSE_FAIL',variant:'NONE',difficulty:'INTERMEDIATE',
      title:'대체과목 학점 제약',description:'가상 대체과목이 학점 조건에 맞지 않습니다. 올바르게 대안 없음을 판단하세요.'}),
    RECONNECT:Object.freeze({scenarioId:'RECONNECT_RECOVERY',variant:'VALID',difficulty:'INTERMEDIATE',
      title:'신청 직후 가상 접속 단절',description:'모의 재접속과 대기열을 거쳐 신청 결과를 확인하세요. 실제 네트워크는 끊지 않습니다.'}),
    COMPOSITE:Object.freeze({scenarioId:'COMPOSITE',variant:'CONFLICT',difficulty:'ADVANCED',
      title:'정원 마감 + 시간 충돌 + 취소 판단 + 재접속',description:'연속된 위험 상황에서 잘못된 대안과 실수 가능성을 분리해 판단하세요.'}),
  });
  const STATES=Object.freeze({
    OFF:['시나리오 꺼짐','명시적으로 동의한 뒤에만 가상 연습이 시작됩니다.'],
    READY:['가상 마지막 과목 신청 준비','처음 N-1개 과목의 가상 신청 완료를 직접 확인하세요.'],
    N_MINUS_1_CONFIRMED:['마지막 가상 목표 과목을 신청하세요','마지막 1개만 합성 정원 마감으로 실패하도록 설정했습니다.'],
    LAST_REJECTED:['가상 정원 마감 발생','실제 서버에서 거부된 것이 아닙니다. 예비 과목이 있는지 직접 살펴보세요.'],
    SEARCH_ALTERNATIVE:['대체과목 적합성을 판단하세요','강좌의 시간·학점·선수요건·중복·이수 영역을 모두 살펴보고 선택하세요.'],
    REPLACED:['유효한 대체과목 선택','가상 결과가 기록되었습니다. 실제 신청 성공은 아닙니다.'],
    NO_VALID_ALTERNATIVE:['유효한 대안 없음 확인','없는 강좌를 자동으로 만들어 신청하지 않는 것도 올바른 대응입니다.'],
    UNRESOLVED:['미해결 상태','가상 마지막 과목 문제는 미해결로 기록했습니다.'],
    CANCEL_CHOICE:['가상 수강 취소 상황','다른 과목의 신청을 실수로 취소하지 않도록 행동을 선택하세요.'],
    READY_RECONNECT:['다음 위기: 재접속','복합 위기의 첫 단계를 마쳤습니다. 가상 접속 단절 연습으로 진행하세요.'],
    ACTIVE:['가상 신청 요청 준비','신청 클릭 직후 접속 단절되는 가상 상황을 체험합니다.'],
    REQUEST_SENT:['가상 신청 요청 전송','응답을 확인하기 전 중복 신청하지 마세요.'],
    VIRTUAL_DROP:['가상 연결 단절','실제 통신은 정상입니다. 모의 재접속을 시작하세요.'],
    RECONNECT_QUEUE:['가상 대기열','가상 대기열 단계를 직접 통과하세요. 실제 대기시간/인원과 무관합니다.'],
    RECONCILE:['가상 신청 상태 확인','성공·미처리·결과 불명은 가상 결과 조회 후에만 구분됩니다.'],
    CONFIRMED:['가상 신청 성공 확인','연습 결과일 뿐 실제 학교 수강신청 완료가 아닙니다.'],
    NOT_APPLIED:['가상 신청 미처리 확인','가상 미처리 상태를 확인했습니다. 실제 신청 상태를 뜻하지 않습니다.'],
    UNKNOWN:['결과 불명 확인','성공도 실패도 단정하지 마세요. 재신청 전에 공식 내역 확인이 필요합니다.'],
  });
  const ACTIONS=Object.freeze({
    READY:[['CONFIRM_PREVIOUS','처음 N-1개 신청 확인']],
    N_MINUS_1_CONFIRMED:[['ATTEMPT_LAST','마지막 목표 과목 신청']],
    LAST_REJECTED:[['OPEN_ALTERNATIVES','대체과목 직접 찾기']],
    SEARCH_ALTERNATIVE:[['CHOOSE_ALTERNATIVE','이 대체과목 선택'],
      ['DECLARE_NO_ALTERNATIVE','유효 대안 없음으로 판단'],
      ['ABANDON','미해결로 종료']],
    CANCEL_CHOICE:[['KEEP_REGISTRATION','기존 신청 내역 유지'],
      ['MISTAKEN_CANCEL','가상 취소 실수 선택']],
    READY_RECONNECT:[['CONTINUE_RECONNECT','재접속 위기 시작']],
    ACTIVE:[['SUBMIT','가상 신청 클릭']],
    REQUEST_SENT:[['VIRTUAL_DROP','가상 접속 단절 체험'],
      ['SUBMIT','중복 신청 클릭 (실수 연습)']],
    VIRTUAL_DROP:[['RECONNECT','모의 재접속']],
    RECONNECT_QUEUE:[['QUEUE_FINISHED','가상 대기열 통과']],
    RECONCILE:[['VERIFY','가상 신청 내역 확인']],
  });
  const DIFFICULTY_LABELS=Object.freeze({BEGINNER:'초급',INTERMEDIATE:'중급',ADVANCED:'고급'});
  const PHASE_LABELS=Object.freeze({LAST:'마지막 신청',CANCELLATION:'취소 판단',RECOVERY:'재접속 준비',RECONNECT:'재접속'});
  const ACTION_NAMES=Object.freeze({
    CONFIRM_PREVIOUS:'이전 과목 신청 확인',
    ATTEMPT_LAST:'마지막 과목 신청',
    OPEN_ALTERNATIVES:'대체 목록 확인',
    CHOOSE_ALTERNATIVE:'대체과목 선택',
    DECLARE_NO_ALTERNATIVE:'대안 없음 판단',
    ABANDON:'미해결로 종료',
    KEEP_REGISTRATION:'기존 신청 유지',
    MISTAKEN_CANCEL:'가상 취소 실수',
    CONTINUE_RECONNECT:'재접속 위기로 이동',
    SUBMIT:'가상 신청 클릭',
    VIRTUAL_DROP:'가상 단절',
    RECONNECT:'모의 재접속',
    QUEUE_FINISHED:'가상 대기열 통과',
    VERIFY:'가상 결과 확인',
  });
  const ERROR_LABELS=Object.freeze({
    ALTERNATIVE_INVALID:'이 대체과목은 학점·시간·선수요건 등 제약을 만족하지 않습니다.',
    VALID_ALTERNATIVE_EXISTS:'유효한 대체과목이 있는데 대안 없다고 할 수 없습니다.',
    INVALID_TRANSITION:'이 단계에서는 해당 동작을 실행할 수 없습니다. 중복 신청은 처리하지 않았습니다.',
  });
  function parseSeed(raw) {
    if(typeof raw!=='string'||! /^\d{1,10}$/.test(raw.trim())) {
      throw new RangeError('재현 시드는 0~4294967295의 정수로 입력해 주세요.');
    }
    const seed=Number(raw.trim());
    if(!Number.isSafeInteger(seed)||seed>0xffffffff)
      throw new RangeError('재현 시드는 0~4294967295의 정수로 입력해 주세요.');
    return seed;
  }
  function buildConfig(input) {
    if(!input||typeof input!=='object'||!Object.hasOwn(PRESETS,input.preset)) {
      throw new TypeError('시나리오 카탈로그에서 하나를 선택해 주세요.');
    }
    if(!['BASIC','TIME','SELECT'].includes(input.mode))throw new TypeError('올바른 연습 모드를 선택하세요.');
    if(input.consent!==true)throw new TypeError('가상 연습 시작에 먼저 동의해 주세요.');
    const seed=Number.isSafeInteger(input.seed)?input.seed:parseSeed(input.seed);
    if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('시드가 범위를 벗어났습니다.');
    return Object.freeze({preset:input.preset,mode:input.mode,seed,
      scenarioId:PRESETS[input.preset].scenarioId,variant:PRESETS[input.preset].variant,
      difficulty:PRESETS[input.preset].difficulty});
  }
  function createSession(config) {
    const shared={schemaVersion:1,scenarioId:config.scenarioId,mode:config.mode,
      seed:config.seed,enabled:true,virtualClockStart:'2026-11-19T10:00:00+09:00'};
    if(config.scenarioId==='COMPOSITE')
      return composite.createComposite({...shared,variant:config.variant});
    if(config.scenarioId==='RECONNECT_RECOVERY')
      return engine.createScenario({...shared,syntheticCourseIds:['SYN-REQUEST'],alternatives:[]});
    return engine.createScenario({...shared,syntheticCourseIds:['SYN-LAST','SYN-ALT-1'],
      alternatives:[{syntheticCourseId:'SYN-ALT-1',
        timeOk:config.variant!=='CONFLICT',creditOk:config.variant!=='NONE',
        prerequisiteOk:true,noDuplicate:true,areaOk:true}]});
  }
  function getState(config,session) {
    return config.scenarioId==='COMPOSITE'?composite.state(session):session.state;
  }
  function getSummary(config,session) {
    return config.scenarioId==='COMPOSITE'?composite.summary(session):engine.summary(session);
  }
  function isFinished(config,session) {
    return getSummary(config,session).terminalState!==null;
  }
  function available(state) {
    return Object.freeze((ACTIONS[state]??[]).map(([type,label])=>
      Object.freeze({type,label,elapsedVirtualMs:type==='QUEUE_FINISHED'?5000:1000,
        risk:type==='SUBMIT'&&state==='REQUEST_SENT'||type==='MISTAKEN_CANCEL',
        ...(type==='CHOOSE_ALTERNATIVE'?{syntheticCourseId:'SYN-ALT-1'}:{})})));
  }
  function dispatchAction(config,session,action) {
    const event={type:action.type,elapsedVirtualMs:action.elapsedVirtualMs,
      ...(action.syntheticCourseId?{syntheticCourseId:action.syntheticCourseId}:{})};
    return config.scenarioId==='COMPOSITE'?composite.dispatch(session,event):engine.dispatch(session,event);
  }
  function mount(doc,env) {
    if(!doc.getElementById('workshop-root'))return null;
    const byId=id=>{
      const el=doc.getElementById(id);
      if(!el)throw new Error('시나리오 화면 요소가 없습니다: '+id);
      return el;
    };
    const el=Object.fromEntries([
      'workshop-status','workshop-error','workshop-setup','workshop-run','workshop-report',
      'workshop-step-setup','workshop-step-run','workshop-step-review',
      'workshop-form','workshop-mode','workshop-seed','workshop-consent','workshop-start',
      'workshop-stop','workshop-run-heading','workshop-report-heading',
      'workshop-phase','workshop-scene-title','workshop-scene-description',
      'workshop-progress','workshop-queue','workshop-queue-fill',
      'workshop-alternatives','workshop-alternative-details',
      'workshop-actions','workshop-live-steps','workshop-virtual-metrics',
      'workshop-report-type','workshop-report-title','workshop-report-summary',
      'workshop-feedback','workshop-metrics','workshop-replay-timeline','workshop-report-notice',
      'workshop-mistakes','workshop-mistake-list',
      'workshop-retry','workshop-new-seed','workshop-change','workshop-copy',
      'workshop-copy-status',
    ].map(id=>[id,byId(id)]));
    let config=null,session=null,lastError=null,currentReview=null;
    const make=(tag,text,cls)=>{
      const node=doc.createElement(tag);
      node.textContent=text;
      if(cls)node.className=cls;
      return node;
    };
    function focus(id){
      const item=el[id];
      if(typeof item.focus==='function')item.focus();
    }
    function view(step){
      for(const [name,id] of [['setup','workshop-setup'],['run','workshop-run'],['review','workshop-report']]){
        el[id].hidden=name!==step;
        const nav=el['workshop-step-'+name];
        if(name===step)nav.setAttribute('aria-current','step');
        else nav.removeAttribute('aria-current');
        nav.setAttribute('data-complete',step==='run'&&name==='setup'?'true':
          step==='review'&&name!=='review'?'true':'false');
      }
    }
    function clearRendered(){
      for(const id of ['workshop-actions','workshop-live-steps','workshop-feedback',
        'workshop-metrics','workshop-replay-timeline','workshop-alternative-details',
        'workshop-mistake-list']){
        el[id].replaceChildren();
      }
    }
    function reset() {
      session=null;config=null;lastError=null;currentReview=null;
      el['workshop-consent'].checked=false;
      clearRendered();view('setup');
      el['workshop-status'].textContent='시나리오 꺼짐 · 기존 연습에는 영향 없음';
      el['workshop-error'].textContent='';
      el['workshop-copy-status'].textContent='';
      el['workshop-queue'].hidden=true;
      el['workshop-alternatives'].hidden=true;
      focus('workshop-start');
    }
    function renderActions(state) {
      el['workshop-actions'].replaceChildren();
      for(const action of available(state)){
        const button=make('button',action.label);
        button.type='button';
        button.className=action.risk?'button-muted':'button-primary';
        button.setAttribute('data-action',action.type);
        if(action.risk)button.setAttribute('data-risk','true');
        button.addEventListener('click',()=>{
          if(!session||!config)return;
          const before=getSummary(config,session);
          if(before.actions.length+before.errors.length>=80){
            lastError='안전한 연습 범위(80개 기록)를 초과했습니다. 시나리오를 초기화하세요.';
            renderRun();return;
          }
          session=dispatchAction(config,session,action);
          const after=getSummary(config,session);
          lastError=after.errors.length>before.errors.length
            ?ERROR_LABELS[after.errors.at(-1)?.code]??'허용되지 않은 행동입니다.':'';
          if(isFinished(config,session))renderReview();
          else renderRun();
        });
        el['workshop-actions'].append(button);
      }
    }
    function renderRun(){
      if(!session||!config)return;
      view('run');
      const state=getState(config,session),summary=getSummary(config,session);
      const label=STATES[state]??['알 수 없는 가상 상태','시나리오 상태를 확인해 주세요.'];
      el['workshop-phase'].textContent=DIFFICULTY_LABELS[config.difficulty]+' · '+config.mode;
      el['workshop-scene-title'].textContent=label[0];
      el['workshop-scene-description'].textContent=label[1];
      el['workshop-progress'].textContent='현재 상황: '+label[0]+' · 기록된 행동 '+summary.actions.length+'건';
      el['workshop-status'].textContent='가상 연습 진행 중 · '+label[0];
      el['workshop-error'].textContent=lastError??'';
      el['workshop-virtual-metrics'].textContent='가상 경과 '+(summary.elapsedVirtualMs/1000).toFixed(1)
        +'초 · 중복 클릭 '+summary.duplicateAttempts+'회 · 입력 오류 '+summary.errors.length+'건';
      el['workshop-queue'].hidden=state!=='RECONNECT_QUEUE';
      el['workshop-queue-fill'].style.width=state==='RECONNECT_QUEUE'?'45%':'0%';
      const alternatives=state==='SEARCH_ALTERNATIVE';
      el['workshop-alternatives'].hidden=!alternatives;
      el['workshop-alternative-details'].replaceChildren();
      if(alternatives){
        const valid=config.variant==='VALID';
        const alt=make('div','');
        alt.append(make('strong','SYN-ALT-1 · 합성 대체과목'));
        alt.append(make('p',valid
          ?'시간·학점·선수요건·중복·이수영역: 시연 조건상 충족 (실제 강좌 아님)'
          :config.variant==='CONFLICT'
          ?'시간: 가상 충돌 · 학점·선수요건·중복·이수영역: 시연 조건상 충족'
          :'학점: 가상 제약 미충족 · 시간·선수요건·중복·이수영역: 시연 조건상 충족'));
        el['workshop-alternative-details'].append(alt);
      }
      el['workshop-live-steps'].replaceChildren();
      for(const action of summary.actions.slice(-15)){
        const li=make('li',ACTION_NAMES[action.type]??'단계 기록');
        li.append(make('span',(STATES[action.state]?.[0]??'단계 완료')+' · 가상 '+(action.elapsedVirtualMs/1000).toFixed(1)+'초'));
        el['workshop-live-steps'].append(li);
      }
      renderActions(state);
    }
    function metric(label,value){
      const card=make('div','');
      card.append(make('strong',String(value)),make('span',label));
      return card;
    }
    function renderReview(){
      if(!session||!config)return;
      const report=getSummary(config,session);
      if(report.terminalState===null)throw new Error('Terminal state required for student report');
      currentReview=review.evaluate(report);
      view('review');
      el['workshop-status'].textContent='가상 연습 종료 · 복기 확인';
      el['workshop-error'].textContent='';
      el['workshop-report-type'].textContent=PRESETS[config.preset].title+' · '+config.mode;
      el['workshop-report-title'].textContent=currentReview.title;
      el['workshop-report-summary'].textContent='가상 결과: '+currentReview.terminalLabel+
        (currentReview.lastLabel?' · 앞 단계: '+currentReview.lastLabel:'');
      el['workshop-report-notice'].textContent=currentReview.notice;
      el['workshop-metrics'].replaceChildren();
      el['workshop-metrics'].append(metric('가상 경과 초',(currentReview.elapsedVirtualMs/1000).toFixed(1)),
        metric('중복 신청 시도',currentReview.duplicateAttempts),
        metric('취소 실수',currentReview.cancellationMistakes),
        metric('재확인 행동',currentReview.errorCount));
      el['workshop-feedback'].replaceChildren();
      for(const row of currentReview.facts){
        const li=make('li','');
        li.setAttribute('data-status',row.status);
        li.append(make('strong',row.label),make('span',row.description));
        el['workshop-feedback'].append(li);
      }
      el['workshop-mistakes'].hidden=currentReview.mistakes.length===0;
      el['workshop-mistake-list'].replaceChildren();
      for(const mistake of currentReview.mistakes){
        const li=make('li',mistake.actionLabel+' · '+mistake.description);
        li.append(make('span','다음 행동: '+mistake.nextAction));
        el['workshop-mistake-list'].append(li);
      }
      el['workshop-replay-timeline'].replaceChildren();
      for(const action of currentReview.timeline){
        const li=make('li',action.label);
        li.append(make('span',(PHASE_LABELS[action.phase]??'가상 연습')+' · '
          +(STATES[action.state]?.[0]??'상황 종료')+' · 가상 '
          +(action.elapsedVirtualMs/1000).toFixed(1)+'초'));
        el['workshop-replay-timeline'].append(li);
      }
      focus('workshop-report-heading');
    }
    function begin(overrideSeed){
      try{
        const preset=doc.querySelector('input[name="workshop-preset"]:checked')?.value;
        const configNext=buildConfig({preset,mode:el['workshop-mode'].value,
          seed:overrideSeed??parseSeed(el['workshop-seed'].value),
          consent:el['workshop-consent'].checked});
        config=configNext;
        session=createSession(config);
        lastError=null;currentReview=null;
        el['workshop-copy-status'].textContent='';
        renderRun();focus('workshop-run-heading');
      }catch(error){
        el['workshop-error'].textContent=error instanceof Error?error.message:'연습 설정을 확인해 주세요.';
      }
    }
    el['workshop-form'].addEventListener('submit',event=>{
      event.preventDefault();begin();
    });
    el['workshop-stop'].addEventListener('click',reset);
    el['workshop-retry'].addEventListener('click',()=>{
      if(!config)return;
      session=createSession(config);lastError=null;currentReview=null;
      renderRun();focus('workshop-run-heading');
    });
    el['workshop-new-seed'].addEventListener('click',()=>{
      if(!config)return;
      config=Object.freeze({...config,seed:(config.seed+1)>>>0});
      el['workshop-seed'].value=String(config.seed);
      session=createSession(config);lastError=null;currentReview=null;
      renderRun();focus('workshop-run-heading');
    });
    el['workshop-change'].addEventListener('click',reset);
    el['workshop-copy'].addEventListener('click',()=>{
      if(!currentReview)return;
      const clipboard=env?.clipboard??(typeof navigator==='undefined'?null:navigator.clipboard);
      if(!clipboard||typeof clipboard.writeText!=='function'){
        el['workshop-copy-status'].textContent='이 브라우저는 복사 기능을 지원하지 않습니다. 화면 내용을 직접 선택해 주세요.';
        return;
      }
      const message=review.plainText(currentReview);
      Promise.resolve().then(()=>clipboard.writeText(message)).then(()=>{
        el['workshop-copy-status'].textContent='가상 결과 요약을 복사했습니다.';
      }).catch(()=>{
        el['workshop-copy-status'].textContent='복사 권한이 거부되었습니다. 화면 내용을 직접 선택해 주세요.';
      });
    });
    reset();
    return Object.freeze({
      start:begin,
      reset,
      getState:()=>session&&config?getState(config,session):'OFF',
      getSummary:()=>session&&config?getSummary(config,session):null,
      getReview:()=>currentReview,
      getConfiguration:()=>config,
    });
  }
  return Object.freeze({PRESETS,STATES,available,parseSeed,buildConfig,
    createSession,getState,getSummary,isFinished,dispatchAction,mount});
});
