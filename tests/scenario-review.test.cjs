'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../js/scenario-engine.js');
const composite=require('../js/scenario-composite.js');
const review=require('../js/scenario-review.js');
function last(){
 const c={schemaVersion:1,scenarioId:'LAST_COURSE_FAIL',mode:'BASIC',seed:2,enabled:true,
 virtualClockStart:'2026-11-19T10:00:00+09:00',syntheticCourseIds:['SYN-LAST','SYN-ALT'],
 alternatives:[{syntheticCourseId:'SYN-ALT',timeOk:true,creditOk:true,prerequisiteOk:true,noDuplicate:true,areaOk:true}]};
 let s=engine.createScenario(c);
 for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])
   s=engine.dispatch(s,{type,elapsedVirtualMs:1000});
 return {c,s};
}
test('student-driven alternative success receives narrative without official graduation claims',()=>{
 const {s}=last();
 const good=engine.dispatch(s,{type:'CHOOSE_ALTERNATIVE',syntheticCourseId:'SYN-ALT'});
 const r=review.evaluate(engine.summary(good));
 assert.equal(r.disposition,'OBSERVED_CORRECT');
 assert.equal(r.facts[0].status,'OBSERVED');
 assert.equal(r.source,'SYNTHETIC');
 assert.match(review.plainText(r),/공식 수강신청이 아닙니다/);
 assert.doesNotMatch(review.plainText(r),/졸업 승인/);
});
test('an invalid alternative is a recorded caution and not a correct terminal',()=>{
 const {s}=last();
 const bad=engine.dispatch(s,{type:'CHOOSE_ALTERNATIVE',syntheticCourseId:'SYN-INVALID'});
 assert.equal(review.evaluate(engine.summary(bad)).disposition,'IN_PROGRESS');
 assert.equal(review.evaluate(engine.summary(bad)).errorCount,1);
});
test('UNKNOWN is a valid caution state, never described as enrollment confirmed',()=>{
 const {c}=last();
 let s=engine.createScenario({...c,scenarioId:'RECONNECT_RECOVERY',syntheticCourseIds:['SYN-REQ'],alternatives:[]});
 for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])
   s=engine.dispatch(s,{type});
 const r=review.evaluate(engine.summary(s));
 assert.equal(r.disposition,'AWAIT_VERIFICATION');
 assert.match(r.notice,/반복하면 안 됩니다/);
 assert.doesNotMatch(r.title,/성공 확인/);
});
test('composite cancellation mistake and duplicate attempt both require a review',()=>{
 let s=composite.createComposite({schemaVersion:1,scenarioId:'COMPOSITE',mode:'SELECT',seed:2,variant:'NONE',enabled:true});
 for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES','DECLARE_NO_ALTERNATIVE'])
   s=composite.dispatch(s,{type});
 s=composite.dispatch(s,{type:'MISTAKEN_CANCEL'});
 s=composite.dispatch(s,{type:'CONTINUE_RECONNECT'});
 s=composite.dispatch(s,{type:'SUBMIT'});
 s=composite.dispatch(s,{type:'SUBMIT'});
 for(const type of ['VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])
   s=composite.dispatch(s,{type});
 const r=review.evaluate(composite.summary(s));
 assert.equal(r.disposition,'NEEDS_REVIEW');
 assert.equal(r.cancellationMistakes,1);
 assert.equal(r.duplicateAttempts,1);
 assert.equal(r.timeline.filter(x=>x.label==='가상 취소 실수').length,1);
});
test('unknown source and malformed shape cannot forge a report',()=>{
 assert.throws(()=>review.evaluate({source:'OFFICIAL',scenarioId:'LAST_COURSE_FAIL'}),/synthetic/);
 assert.throws(()=>review.evaluate({source:'SYNTHETIC',scenarioId:'LAST_COURSE_FAIL',seed:1,actions:new Array(151).fill({}),errors:[],elapsedVirtualMs:0,duplicateAttempts:0}),/bounded/);
});
