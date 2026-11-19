'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createScenario, dispatch, summary} = require('../js/scenario-engine.js');

const base = {
  schemaVersion: 1, scenarioId: 'LAST_COURSE_FAIL', mode: 'SELECT', seed: 17,
  enabled: true, virtualClockStart: '2026-11-19T10:00:00+09:00',
  syntheticCourseIds: ['SYN-LAST', 'SYN-ALT-1', 'SYN-ALT-2'],
  alternatives: [{syntheticCourseId: 'SYN-ALT-1', timeOk: true, creditOk: true,
    prerequisiteOk: true, noDuplicate: true, areaOk: true}],
};
const step = (s, type, extra={}) => dispatch(s, {type,...extra});
function advanceLast(s) {
  for (const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES']) s=step(s,type);
  return s;
}
function reconnect(seed=0) {
  return createScenario({...base,scenarioId:'RECONNECT_RECOVERY',seed,alternatives:[]});
}

test('scenario is OFF by default only when explicitly OFF, without legacy writes',()=>{
  const s=createScenario({...base,enabled:false});
  assert.equal(s.state,'OFF');
  assert.strictEqual(step(s,'CONFIRM_PREVIOUS'),s);
  assert.equal(s.actions.length,0);
});
test('last failure leads to correct manually chosen replacement',()=>{
  const s=step(advanceLast(createScenario(base)), 'CHOOSE_ALTERNATIVE',
    {syntheticCourseId:'SYN-ALT-1',elapsedVirtualMs:2500});
  assert.equal(summary(s).terminalState,'REPLACED');
  assert.equal(s.actions.length,4);
  assert.equal(s.elapsedVirtualMs,2500);
  assert.equal(summary(s).source,'SYNTHETIC');
  assert.strictEqual(step(s,'ABANDON'),s);
});
test('invalid replacement remains unresolved and is reported',()=>{
  const s=step(advanceLast(createScenario(base)),'CHOOSE_ALTERNATIVE',
    {syntheticCourseId:'SYN-LAST'});
  assert.equal(s.state,'SEARCH_ALTERNATIVE');
  assert.equal(s.errors[0].code,'ALTERNATIVE_INVALID');
});
test('a conflicting alternative is not valid',()=>{
  const c={...base,alternatives:base.alternatives.map(x=>({...x,timeOk:false}))};
  const s=step(advanceLast(createScenario(c)),'CHOOSE_ALTERNATIVE',
    {syntheticCourseId:'SYN-ALT-1'});
  assert.equal(s.errors[0].code,'ALTERNATIVE_INVALID');
});
test('no-valid-alternative is a legitimate terminal judgment',()=>{
  const c={...base,alternatives:base.alternatives.map(x=>({...x,areaOk:false}))};
  const s=step(advanceLast(createScenario(c)),'DECLARE_NO_ALTERNATIVE');
  assert.equal(summary(s).terminalState,'NO_VALID_ALTERNATIVE');
});
test('cannot claim no alternatives when one is valid',()=>{
  const s=step(advanceLast(createScenario(base)),'DECLARE_NO_ALTERNATIVE');
  assert.equal(s.state,'SEARCH_ALTERNATIVE');
  assert.equal(s.errors[0].code,'VALID_ALTERNATIVE_EXISTS');
});
test('student may abandon unresolved course after rejection',()=>{
  const s=step(advanceLast(createScenario(base)),'ABANDON');
  assert.equal(summary(s).terminalState,'UNRESOLVED');
});
test('skip or irrelevant events do not alter practice terminal',()=>{
  const s=step(createScenario(base),'CHOOSE_ALTERNATIVE',{syntheticCourseId:'SYN-ALT-1'});
  assert.equal(s.state,'READY');
  assert.equal(s.errors[0].code,'INVALID_TRANSITION');
});
test('reconnect has exactly three deterministic reconciliation outcomes',()=>{
  for(const [seed,terminal] of [[0,'CONFIRMED'],[1,'NOT_APPLIED'],[2,'UNKNOWN']]){
    let s=reconnect(seed);
    for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY']) s=step(s,type);
    assert.equal(summary(s).terminalState,terminal);
    assert.equal(s.actions.length,5);
    assert.strictEqual(step(s,'SUBMIT'),s);
  }
});
test('duplicate submit never generates a second application',()=>{
  let s=step(reconnect(2),'SUBMIT');
  s=step(s,'SUBMIT');
  assert.equal(s.state,'REQUEST_SENT');
  assert.equal(s.duplicateAttempts,1);
  assert.equal(s.actions.length,1);
});
test('UNKNOWN must not be converted into automatic success or retry',()=>{
  let s=reconnect(2);
  for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY']) s=step(s,type);
  assert.equal(s.state,'UNKNOWN');
  assert.strictEqual(step(s,'SUBMIT'),s);
});
test('same seed and event sequence yields byte-for-byte stable result',()=>{
  function run(){let s=reconnect(123);for(const t of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])s=step(s,t,{elapsedVirtualMs:700});return summary(s);}
  assert.deepEqual(run(),run());
  assert.equal(run().elapsedVirtualMs,3500);
});
test('config can never include a real course ID, credentials or arbitrary alternative',()=>{
  assert.throws(()=>createScenario({...base,syntheticCourseIds:['H00000000']}),/synthetic/);
  assert.throws(()=>createScenario({...base,alternatives:[{...base.alternatives[0],syntheticCourseId:'SYN-INJECT'}]}),/existing/);
  assert.throws(()=>createScenario({...base,alternatives:[{...base.alternatives[0],creditOk:undefined}]}),/eligibility/);
});
test('reconnect and alternative config cannot be mixed',()=>{
  assert.throws(()=>createScenario({...base,scenarioId:'RECONNECT_RECOVERY'}),/Reconnect/);
});
test('rejects unbounded or missing seed, invalid mode, schema, dates, and events',()=>{
  assert.throws(()=>createScenario({...base,seed:-1}),/seed/);
  assert.throws(()=>createScenario({...base,seed:2**32}),/seed/);
  assert.throws(()=>createScenario({...base,mode:'REAL'}),/mode/);
  assert.throws(()=>createScenario({...base,schemaVersion:2}),/schema/);
  assert.throws(()=>createScenario({...base,virtualClockStart:'not-date'}),/clock/);
  assert.throws(()=>createScenario({...base,enabled:undefined}),/explicit/);
  assert.throws(()=>dispatch(createScenario(base),{type:'UPLOAD_TRANSCRIPT'}),/Unknown/);
  assert.throws(()=>dispatch(createScenario(base),{type:'CONFIRM_PREVIOUS',elapsedVirtualMs:-3}),/Virtual/);
});
test('scenario snapshot cannot be mutated by UI code',()=>{
  const s=createScenario(base);
  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.config));
  assert.ok(Object.isFrozen(s.config.alternatives));
  assert.ok(Object.isFrozen(s.actions));
  assert.throws(()=>{s.config.alternatives[0].areaOk=false;},TypeError);
});
