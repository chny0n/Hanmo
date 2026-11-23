import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,validateScenario,bestOrder,syntheticRate} from '../js/strategy-engine.mjs';
const input=()=>({
  seed:123456789,trials:120,startDelayMs:200,actionMs:800,jitterMs:100,
  courses:[
    {id:'A',name:'가상 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'가상 B',rank:2,capacity:20,rivals:50},
    {id:'C',name:'가상 C',rank:3,capacity:20,rivals:30},
  ],
});
test('시드가 같으면 최적 신청 순서와 가상 성공 빈도가 같다',()=>{
  assert.deepEqual(simulate(input()),simulate(input()));
});
test('가상 결과와 순서는 범위 및 과목 개수를 준수한다',()=>{
  const r=simulate(input());
  assert.equal(r.order.length,3);
  assert.ok(r.allRate>=0&&r.allRate<=100);
  assert.ok(r.meanScore>=0&&r.meanScore<=100);
  assert.equal(r.model,'SYNTHETIC_ONLY');
});
test('가상 정원이 충분하면 모든 과목 성공 빈도는 100%다',()=>{
  const s=input();
  s.courses.forEach(c=>{c.capacity=50;c.rivals=1;});
  assert.equal(simulate(s).allRate,100);
});
test('경쟁자가 없으면 모든 과목에 성공한다',()=>{
  const s=input();s.courses.forEach(c=>{c.rivals=0;});
  assert.equal(simulate(s).allRate,100);
});
test('1이 가장 높은 중요 순위이고 중복 순위를 거부한다',()=>{
  const s=input();s.courses[2].rank=1;
  assert.throws(()=>validateScenario(s),/중복/);
});
test('사용자 도착률/수동순서 입력 없이 유효한 전략을 계산한다',()=>{
  const s=input();
  assert.ok(s.courses.every(c=>!('rate' in c)&&!('manualOrder' in c)));
  assert.ok(syntheticRate(0)>0);
  assert.equal(bestOrder([3,2],[[1,.5],[.8,.7]]).length,2);
});
test('정수·표본 범위 검증을 유지한다',()=>{
  const s=input();s.courses[1].capacity=-2;
  assert.throws(()=>simulate(s),/범위|확인/);
});

test('가상 정원은 300까지 허용하고 301부터 거부한다',()=>{
  const limit=input();
  limit.courses[0].capacity=300;
  assert.doesNotThrow(()=>validateScenario(limit));
  assert.equal(simulate(limit).order.length,limit.courses.length);
  limit.courses[0].capacity=301;
  assert.throws(()=>validateScenario(limit),/가상 정원/);
});
