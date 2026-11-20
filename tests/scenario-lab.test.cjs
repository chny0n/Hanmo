'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../js/scenario-engine.js');
const ui=require('../js/scenario-lab.js');

const base={scenarioId:'LAST_COURSE_FAIL',mode:'SELECT',seed:2,enabled:true,variant:'VALID'};
const step=(session,type)=> {
  const action=ui.actionsFor(session.state).find(x=>x.type===type);
  assert.ok(action,'unavailable action '+type+' from '+session.state);
  return ui.step(session,action);
};
test('preview scenario cannot run until explicitly enabled, and does not write storage',()=>{
  const off=engine.createScenario(ui.configFor({...base,enabled:false}));
  assert.equal(off.state,'OFF');
  assert.equal(ui.actionsFor(off.state).length,0);
  assert.equal(ui.sessionInfo(off).source,'SYNTHETIC');
  assert.equal(ui.sessionInfo(off).terminal,false);
});
test('student manually chooses a valid replacement only after the last simulated failure',()=>{
  let s=engine.createScenario(ui.configFor(base));
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES','CHOOSE_ALTERNATIVE'])
    s=step(s,type);
  assert.equal(s.state,'REPLACED');
  assert.equal(ui.sessionInfo(s).terminal,true);
  assert.equal(ui.sessionInfo(s).actions.length,4);
  assert.deepEqual(ui.actionsFor(s.state),[]);
});
test('student cannot declare no alternative when an eligible synthetic course exists',()=>{
  let s=engine.createScenario(ui.configFor(base));
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])
    s=step(s,type);
  s=step(s,'DECLARE_NO_ALTERNATIVE');
  assert.equal(s.state,'SEARCH_ALTERNATIVE');
  assert.match(ui.sessionInfo(s).lastError,/유효한 가상/);
});
test('an invalid replacement is not accepted; recognizing no option is valid',()=>{
  for(const variant of ['CONFLICT','NONE']){
    let s=engine.createScenario(ui.configFor({...base,variant}));
    for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])
      s=step(s,type);
    s=step(s,'CHOOSE_ALTERNATIVE');
    assert.equal(s.state,'SEARCH_ALTERNATIVE');
    assert.match(ui.sessionInfo(s).lastError,/제약/);
    s=step(s,'DECLARE_NO_ALTERNATIVE');
    assert.equal(s.state,'NO_VALID_ALTERNATIVE');
  }
});
test('unknown result never triggers a duplicate real or simulated registration',()=>{
  for(const [seed,expected] of [[0,'CONFIRMED'],[1,'NOT_APPLIED'],[2,'UNKNOWN']]){
    let s=engine.createScenario(ui.configFor({
      ...base,scenarioId:'RECONNECT_RECOVERY',seed,
    }));
    s=step(s,'SUBMIT');
    s=step(s,'SUBMIT');
    assert.equal(s.duplicateAttempts,1);
    for(const type of ['VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])s=step(s,type);
    assert.equal(s.state,expected);
    assert.equal(ui.sessionInfo(s).terminal,true);
    assert.deepEqual(ui.actionsFor(s.state),[]);
    assert.equal(s.actions.filter(a=>a.type==='SUBMIT').length,1);
  }
});
test('same seed and actions produce identical synthetic results',()=>{
  function run(){
    let s=engine.createScenario(ui.configFor({...base,scenarioId:'RECONNECT_RECOVERY',seed:102}));
    for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])s=step(s,type);
    return engine.summary(s);
  }
  assert.deepEqual(run(),run());
  assert.equal(run().source,'SYNTHETIC');
});
test('preview rejects wrong seed, mode, event kind, and unbounded input',()=>{
  assert.throws(()=>ui.configFor({...base,seed:0.5}),/정수/);
  assert.throws(()=>ui.configFor({...base,seed:2**32}),/정수/);
  assert.throws(()=>ui.configFor({...base,scenarioId:'REAL_ENROLL'}),/선택/);
  assert.throws(()=>ui.configFor({...base,variant:'AUTO_APPROVE'}),/대체 조건/);
  assert.throws(()=>engine.createScenario(ui.configFor({...base,mode:'REAL'})),/mode/);
});
test('pure synthetic engine stays testable without an extra public scenario page',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../html/vsugang.html'),'utf8');
 assert.ok(page.indexOf('../js/pc-only.js')<page.indexOf('</head>'));
 assert.ok(page.indexOf('../js/incident-courses.js')<page.indexOf('../js/scenario-settings.js'));
 assert.ok(page.includes('id="scenario-settings"'));
 assert.ok(page.includes('404 예시화면 입니다'));
 assert.ok(page.includes('role="status"'));
 const source=fs.readFileSync(path.join(__dirname,'../js/scenario-lab.js'),'utf8');
 assert.equal(/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest)\s*\./.test(source),false);
});

test('standalone mount is OFF until consent, clears resolved errors, and resets ephemeral inputs',()=>{
  function node(tag='div'){
    const handlers={};
    return {
      tagName:tag.toUpperCase(),textContent:'',value:'',checked:false,
      disabled:false,children:[],type:'',
      addEventListener:(type,fn)=>{handlers[type]=fn;},
      trigger:(type)=>{assert.equal(typeof handlers[type],'function');handlers[type]({preventDefault(){}});},
      replaceChildren(){this.children=[];},
      append(child){this.children.push(child);},
    };
  }
  const ids=['scenario-lab','scenario-form','scenario-status','scenario-actions',
    'scenario-history','scenario-details','scenario-errors','scenario-variant',
    'scenario-kind','scenario-mode','scenario-seed','scenario-enabled','scenario-reset'];
  const nodes=Object.fromEntries(ids.map(id=>[id,node()]));
  const doc={getElementById:id=>nodes[id]??null,createElement:node};
  nodes['scenario-kind'].value='LAST_COURSE_FAIL';
  nodes['scenario-mode'].value='SELECT';
  nodes['scenario-seed'].value='2';
  nodes['scenario-variant'].value='VALID';
  const lab=ui.mount(doc);
  assert.equal(lab.getSummary(),null);
  assert.match(nodes['scenario-status'].textContent,/꺼짐/);
  nodes['scenario-form'].trigger('submit');
  assert.equal(lab.getSummary(),null);
  assert.match(nodes['scenario-errors'].textContent,/직접 동의/);
  nodes['scenario-enabled'].checked=true;
  nodes['scenario-form'].trigger('submit');
  assert.equal(lab.getSummary().state,'READY');
  function click(label){
    const action=nodes['scenario-actions'].children.find(x=>x.textContent===label);
    assert.ok(action,'No action: '+label);
    action.trigger('click');
  }
  click('처음 N-1개 신청 확인');
  click('마지막 목표 과목 신청');
  click('대체 과목 찾기');
  click('유효 대안 없음 판단');
  assert.equal(lab.getSummary().state,'SEARCH_ALTERNATIVE');
  assert.match(nodes['scenario-errors'].textContent,/유효한 가상/);
  click('대체 과목 직접 선택');
  assert.equal(lab.getSummary().state,'REPLACED');
  assert.equal(nodes['scenario-errors'].textContent,'');
  assert.equal(nodes['scenario-history'].children.length,4);
  nodes['scenario-reset'].trigger('click');
  assert.equal(lab.getSummary(),null);
  assert.equal(nodes['scenario-enabled'].checked,false);
  assert.equal(nodes['scenario-history'].children.length,0);

  nodes['scenario-kind'].value='RECONNECT_RECOVERY';
  nodes['scenario-kind'].trigger('change');
  assert.equal(nodes['scenario-variant'].disabled,true);
  nodes['scenario-enabled'].checked=true;
  nodes['scenario-form'].trigger('submit');
  click('가상 신청 클릭');
  click('중복 신청 시도(오류 학습)');
  assert.match(nodes['scenario-errors'].textContent,/허용되지 않은/);
  click('가상 접속 단절 체험');
  assert.equal(nodes['scenario-errors'].textContent,'');
  click('모의 재접속');
  click('가상 대기열 통과');
  click('가상 신청 상태 조회');
  assert.equal(lab.getSummary().state,'UNKNOWN');
  assert.equal(lab.getSummary().duplicateAttempts,1);
  assert.equal(nodes['scenario-actions'].children.length,1); // terminal explanation, no buttons
});
