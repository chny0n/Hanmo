import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,validateScenario,bestOrder} from '../js/strategy-engine.mjs';
const input=()=>({
  seed:123456789,trials:120,startDelayMs:200,actionMs:800,jitterMs:100,
  courses:[
    {id:'A',name:'가상 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'가상 B',rank:2,capacity:20,rivals:50},
    {id:'C',name:'가상 C',rank:3,capacity:20,rivals:30},
  ],
});
test('시드가 같으면 최적 신청 순서와 가상 성공 확률이 같다',()=>{
  assert.deepEqual(simulate(input()),simulate(input()));
});
test('가상 결과와 순서는 범위 및 과목 개수를 준수한다',()=>{
  const r=simulate(input());
  assert.equal(r.order.length,3);
  assert.ok(r.allRate>=0&&r.allRate<=100);
  assert.ok(r.meanScore>=0&&r.meanScore<=100);
  assert.equal(r.model,'SYNTHETIC_ONLY');
});
test('가상 정원이 충분하면 모든 과목 성공 확률은 100%다',()=>{
  const s=input();
  s.courses.forEach(c=>{c.capacity=50;c.rivals=1;});
  const result=simulate(s);
  assert.equal(result.allRate,100);
  assert.equal(result.guaranteed,true);
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
  assert.throws(()=>validateScenario(limit),{name:'RangeError',message:'정원 입력값을 확인하세요.'});
});
test('첫 신청 650ms에서 정원 1석의 성공 확률을 감마 누적확률과 비교한다',()=>{
  const s={...input(),startDelayMs:0,actionMs:650,jitterMs:0};
  s.courses=[
    {...s.courses[0],capacity:1,rivals:2},
    {...s.courses[1],capacity:1,rivals:0},
  ];
  const result=simulate(s);
  assert.deepEqual(result.ranks,[1,2]);
  // 첫 슬롯에서 F(270)은 1 - e^(-20) × Σ(20^k/k!), k=0..19입니다.
  const reacted=.52974273316076;
  const expected=share=>100*(1-share*reacted)**2;
  assert.ok(Math.abs(result.allRate-expected(.35))<1e-9);
  assert.ok(Math.abs(result.sensitivity.concentrated-expected(.5))<1e-9);
  assert.ok(Math.abs(result.sensitivity.spread-expected(.2))<1e-9);
});
test('경쟁 과목의 순서는 표의 입력 위치에 영향을 받지 않고 오픈 집중도에 반응한다',()=>{
  const s={...input(),trials:1000,startDelayMs:0,actionMs:580,jitterMs:60};
  s.courses[2].rivals=50;
  const result=simulate(s);
  assert.equal(result.guaranteed,false);
  assert.ok(result.allRate>0&&result.allRate<99.99);
  assert.ok(result.sensitivity.concentrated<result.allRate);
  assert.ok(result.allRate<result.sensitivity.spread);
  assert.deepEqual(simulate({...s,courses:[...s.courses].reverse()}),result);
});
test('가상 정원이 증가할수록 최적 기대점수가 높아지며 경쟁자가 증가하면 낮아진다',()=>{
  const s=input();
  s.courses[0].rivals=200;
  let previous=-1;
  for(const capacity of [1,50,51,200,201,300]){
    s.courses[0].capacity=capacity;
    const {meanScore}=simulate(s);
    assert.ok(meanScore>=previous-1e-10);
    previous=meanScore;
  }
  s.courses[0].capacity=1;
  assert.ok(simulate(s).meanScore<previous);
  s.courses[0].rivals=0;
  assert.ok(Math.abs(simulate(s).meanScore-previous)<1e-10);
});
test('DP 점수를 세 과목의 모든 신청 순서와 비교한다',()=>{
  const weights=[3,2,1];
  const probability=[[.95,.91,.85],[.97,.6,.1],[1,.7,.5]];
  const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  const score=order=>order.reduce((total,i,slot)=>total+weights[i]*probability[i][slot],0);
  assert.equal(score(bestOrder(weights,probability)),Math.max(...orders.map(score)));
});
test('순위 범위와 잘못된 시간·시드를 거부한다',()=>{
  const s=input();
  s.courses[0].rank=4;
  assert.throws(()=>validateScenario(s),/중요 순위/);
  for(const invalid of [{seed:-1},{seed:2**32},{actionMs:NaN},{startDelayMs:5001},{jitterMs:1501}]){
    assert.throws(()=>validateScenario({...input(),...invalid}),RangeError);
  }
});
