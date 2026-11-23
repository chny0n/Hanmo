import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,sensitivityScenarios,validateScenario} from '../js/strategy-engine.mjs';
const input=()=>({
  seed:123456789,trials:100,startDelayMs:400,actionMs:800,jitterMs:100,
  courses:[
    {id:'A',name:'가상 A',weight:5,capacity:8,rivals:30,rate:0.08,manualOrder:2},
    {id:'B',name:'가상 B',weight:4,capacity:20,rivals:50,rate:0.05,manualOrder:1},
    {id:'C',name:'가상 C',weight:2,capacity:20,rivals:30,rate:0.04,manualOrder:3},
  ],
});
test('같은 입력과 난수 시드는 재현 가능한 결과를 생성한다',()=>{
  assert.deepEqual(simulate(input()),simulate(input()));
});
test('전략은 3가지이며 점수와 비율은 0~100 범위다',()=>{
  const result=simulate(input());
  assert.equal(result.results.length,3);
  for(const row of result.results){
    assert.ok(row.mean>=0&&row.mean<=100);
    assert.ok(row.allRate>=0&&row.allRate<=100);
    assert.equal(row.courseRates.length,3);
    assert.ok(row.margin>=0);
  }
});
test('같은 난수·신청 순서에서 정원을 늘리면 해당 과목의 성공 빈도가 떨어지지 않는다',()=>{
  const smaller=input(),larger=input();
  smaller.courses[0].capacity=3;
  larger.courses[0].capacity=20;
  const before=simulate(smaller).results.find(row=>row.id==='custom');
  const after=simulate(larger).results.find(row=>row.id==='custom');
  assert.ok(after.courseRates[0]>=before.courseRates[0]);
});
test('같은 난수·신청 순서에서 경쟁자 수가 증가하면 해당 과목 성공 빈도가 증가하지 않는다',()=>{
  const fewer=input(),more=input();
  fewer.courses[0].rivals=5;
  more.courses[0].rivals=100;
  const before=simulate(fewer).results.find(row=>row.id==='custom');
  const after=simulate(more).results.find(row=>row.id==='custom');
  assert.ok(after.courseRates[0]<=before.courseRates[0]);
});
test('잘못된 입력과 중복 순서를 거부한다',()=>{
  const bad=input();bad.courses[1].manualOrder=2;
  assert.throws(()=>validateScenario(bad),/중복/);
  const bad2=input();bad2.courses[0].rate=0;
  assert.throws(()=>simulate(bad2),/범위/);
});
test('민감도 실험은 동일 시드의 5가지 유효한 조건이다',()=>{
  const variants=sensitivityScenarios(input());
  assert.equal(variants.length,5);
  for(const variant of variants){
    validateScenario(variant.scenario);
    assert.equal(variant.scenario.seed,123456789);
  }
});
