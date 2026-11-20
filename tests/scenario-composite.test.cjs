'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createComposite,dispatch,summary,state,isTerminal}=require('../js/scenario-composite.js');
const input={schemaVersion:1,scenarioId:'COMPOSITE',mode:'BASIC',seed:2,
  variant:'VALID',enabled:true};
const step=(session,type,extra={})=>dispatch(session,{type,elapsedVirtualMs:1000,...extra});
function run(until='VERIFY',variant='VALID'){
  let s=createComposite({...input,variant});
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])s=step(s,type);
  s=step(s,variant==='VALID'?'CHOOSE_ALTERNATIVE':'DECLARE_NO_ALTERNATIVE',
    variant==='VALID'?{syntheticCourseId:'SYN-ALT-1'}:{});
  if(until==='LAST')return s;
  s=step(s,'KEEP_REGISTRATION');
  s=step(s,'CONTINUE_RECONNECT');
  for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED'])s=step(s,type);
  if(until==='QUEUE')return s;
  return step(s,'VERIFY');
}
test('never enables composite unless explicitly opted in',()=>{
  const off=createComposite({...input,enabled:false});
  assert.equal(state(off),'OFF');
  assert.strictEqual(step(off,'CONFIRM_PREVIOUS'),off);
  assert.equal(summary(off).terminalState,null);
});
test('composite reuses deterministic LAST and RECONNECT without auto advances',()=>{
  const last=run('LAST');
  assert.equal(state(last),'CANCEL_CHOICE');
  assert.equal(summary(last).lastOutcome,'REPLACED');
  assert.equal(summary(last).reconnectOutcome,null);
  assert.equal(last.reconnect,null);
  const completed=run();
  assert.equal(isTerminal(completed),true);
  assert.equal(summary(completed).state,'UNKNOWN');
  assert.equal(summary(completed).terminalState,'COMPLETED');
  assert.equal(summary(completed).lastOutcome,'REPLACED');
  assert.equal(summary(completed).reconnectOutcome,'UNKNOWN');
  assert.equal(summary(completed).actions.filter(x=>x.type==='SUBMIT').length,1);
  assert.equal(summary(completed).actions.length,11);
});
test('intermission cancellation mistake is recorded but never makes real application',()=>{
  let s=run('LAST','CONFLICT');
  assert.equal(summary(s).lastOutcome,'NO_VALID_ALTERNATIVE');
  s=step(s,'MISTAKEN_CANCEL');
  assert.equal(summary(s).cancellationMistakes,1);
  assert.equal(state(s),'READY_RECONNECT');
  assert.equal(summary(s).source,'SYNTHETIC');
  s=step(s,'CONTINUE_RECONNECT');
  assert.equal(state(s),'ACTIVE');
});
test('wrong stage action is rejected without silently progressing',()=>{
  const first=createComposite(input);
  const bad=step(first,'VERIFY');
  assert.equal(bad.last.state,'READY');
  assert.equal(summary(bad).errors.at(-1).code,'INVALID_TRANSITION');
  let s=run('LAST');
  s=step(s,'CONTINUE_RECONNECT');
  assert.equal(state(s),'CANCEL_CHOICE');
  assert.equal(summary(s).errors.at(-1).code,'INVALID_TRANSITION');
});
test('seed and decisions reproduce the same composite report exactly',()=>{
  assert.deepEqual(summary(run()),summary(run()));
  assert.deepEqual(summary(run('LAST','NONE')),summary(run('LAST','NONE')));
  const completed=run();
  assert.strictEqual(step(completed,'SUBMIT'),completed); // terminal cannot retry
});
test('reconnect duplicate submit increments error counter without second request',()=>{
  let s=run('LAST');
  s=step(s,'KEEP_REGISTRATION');
  s=step(s,'CONTINUE_RECONNECT');
  s=step(s,'SUBMIT');
  s=step(s,'SUBMIT');
  assert.equal(summary(s).duplicateAttempts,1);
  assert.equal(summary(s).actions.filter(x=>x.type==='SUBMIT').length,1);
  assert.equal(summary(s).errors.at(-1).code,'INVALID_TRANSITION');
});
test('rejects invalid modes, variants, seeds, schemas and non-boolean consent',()=>{
  for(const change of [{mode:'ONLINE'},{seed:-1},{seed:2**32},{variant:'NONE?'},{enabled:1},{schemaVersion:2}]){
    assert.throws(()=>createComposite({...input,...change}));
  }
});
