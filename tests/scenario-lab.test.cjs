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
test('standalone preview keeps synchronous PC gate and does not import legacy handlers',()=>{
  const page=fs.readFileSync(path.join(__dirname,'../html/scenario-lab.html'),'utf8');
  assert.match(page,/<script src="\.\.\/js\/pc-only\.js"><\/script>/);
  assert.ok(page.indexOf('../js/pc-only.js')<page.indexOf('</head>'));
  assert.ok(page.indexOf('../js/scenario-engine.js')<page.indexOf('../js/scenario-lab.js'));
  assert.ok(page.includes('id="scenario-enabled"'));
  assert.ok(page.includes('role="status"'));
  assert.ok(page.includes('role="alert"'));
  for(const forbidden of ['../js/selectZone.js','../js/practice.js','../js/result.js',
    '<script src="https:', 'hanmo.academic.v1.']){
    assert.equal(page.includes(forbidden),false,'unexpected external/legacy dependency: '+forbidden);
  }
  const source=fs.readFileSync(path.join(__dirname,'../js/scenario-lab.js'),'utf8');
  assert.equal(/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest)\s*\./.test(source),false);
});
