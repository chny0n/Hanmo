import test from 'node:test';
import assert from 'node:assert/strict';
import {simulate,validateScenario,bestOrder,rivalOrder,urgencyWeight,requestWaitMs,runSharedQueue,REQUEST_WAIT_MIN_MS,REQUEST_WAIT_MAX_EXCLUSIVE_MS,SERVER_SERVICE_MS,rivalGroupMeanMs,rivalReactionMs,rivalActionMs,fittsTimeMs,serviceFinishMs} from '../js/strategy-engine.mjs';
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
  assert.ok(Number.isInteger(r.allWins)&&r.allWins>=0&&r.allWins<=r.trials);
  assert.ok(r.meanScore>=0&&r.meanScore<=100);
  assert.equal(r.model,'SYNTHETIC_ONLY');
});
test('가상 정원이 충분하면 모든 과목 성공 확률은 100%다',()=>{
  const s=input();
  s.courses.forEach(c=>{c.capacity=50;c.rivals=1;});
  const result=simulate(s);
  assert.equal(result.allWins,s.trials);
  assert.equal(result.guaranteed,true);
});
test('경쟁자가 없으면 모든 과목에 성공한다',()=>{
  const s=input();s.courses.forEach(c=>{c.rivals=0;});
  assert.equal(simulate(s).allWins,s.trials);
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
test('경쟁자는 입력 목록 밖의 과목을 먼저 신청할 수 있고 최대 8과목을 선택한다',()=>{
  const draws=[.99,.4,.7,.9,.8,.7,.8,.7,.8];
  const order=rivalOrder([0],[1],()=>draws.shift(),()=>1);
  assert.equal(order.length,8);
  assert.equal(order.at(-1),0);
  assert.equal(order.filter(course=>course<0).length,7);
});
test('같은 난수에서 정원 대비 경쟁자가 많아지면 해당 과목이 앞설 수 있다',()=>{
  const order=capacity=>{
    const weights=[urgencyWeight({capacity,rivals:50}),urgencyWeight({capacity:20,rivals:50})];
    const draws=[0,.2,.5];
    return rivalOrder([0,1],weights,()=>draws.shift(),()=>1);
  };
  assert.deepEqual(order(20),[1,0]);
  assert.deepEqual(order(1),[0,1]);
});
test('같은 순서의 전체 성공 횟수는 입력 행 순서와 무관하고 복수 과목 신청 정도에 반응한다',()=>{
  const s={...input(),trials:1000,startDelayMs:0,actionMs:580,jitterMs:60};
  s.courses[2].rivals=50;
  const result=simulate(s);
  assert.equal(result.guaranteed,false);
  assert.ok(result.allWins>0&&result.allWins<s.trials);
  assert.notEqual(result.sensitivity.lessOverlap,result.sensitivity.moreOverlap);
  assert.deepEqual(simulate({...s,courses:[...s.courses].reverse()}),result);
});
test('한 과목만 경합할 때 정원이 증가하면 최적 기대점수가 낮아지지 않는다',()=>{
  const s=input();
  s.courses[0].rivals=200;
  s.courses[1].capacity=300;
  s.courses[2].capacity=300;
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

test('전략 실험 전용 모의 대기시간은 1000~3000ms의 양 끝을 포함한다',()=>{
  assert.equal(REQUEST_WAIT_MIN_MS,1000);
  assert.equal(REQUEST_WAIT_MAX_EXCLUSIVE_MS,3001);
  assert.equal(requestWaitMs(0),1000);
  assert.equal(requestWaitMs(.5),2000);
  assert.equal(requestWaitMs(.999999),3000);
});
test('동시에 도착한 요청과 이후 요청은 공통 서버에서 순차 처리되고 응답 후 다음 요청이 도착한다',()=>{
  assert.equal(SERVER_SERVICE_MS,10);
  const agents=[
    {id:2,startMs:0,actions:[100,50],delays:[1000,1000],courses:[]},
    {id:0,startMs:0,actions:[105],delays:[3000],courses:[-1]},
    {id:1,startMs:0,actions:[100,50],delays:[1000,1000],courses:[0,1]},
  ];
  const original=structuredClone(agents);
  const events=[];
  runSharedQueue(agents,(agent,slot,arrival,start,processed,reply)=>events.push([agent.id,slot,arrival,start,processed,reply]));
  assert.deepEqual(events,[
    [1,0,100,100,120,1100],
    [2,0,100,120,140,1120],
    [0,0,105,140,160,3140],
    [1,1,1150,1150,1170,2150],
    [2,1,1170,1170,1190,2170],
  ]);
  assert.deepEqual(agents,original);
  assert.equal(events[1][5]-events[1][2],1020);
  assert.equal(events[2][5]-events[2][2],3035);
});
test('최소 힙 대기열은 독립적인 정렬 기반 FCFS 기준 구현과 일치한다',()=>{
  const agents=Array.from({length:23},(_,id)=>({
    id,startMs:id%3,actions:Array.from({length:1+id%8},(_,slot)=>460+(id*17+slot*47)%280),
    delays:Array.from({length:1+id%8},(_,slot)=>1000+(id*197+slot*397)%2001),courses:[],
  }));
  const actual=[];
  runSharedQueue(agents,(agent,slot,arrival,start,processed,reply)=>actual.push([agent.id,slot,arrival,start,processed,reply]));
  const pending=agents.map(agent=>({agent,slot:0,arrival:agent.startMs+agent.actions[0]}));
  const expected=[];
  let available=0;
  while(pending.length){
    pending.sort((a,b)=>a.arrival-b.arrival||a.agent.id-b.agent.id);
    const {agent,slot,arrival}=pending.shift();
    const start=Math.max(arrival,available);
    // 누적 처리량과 역함수를 이용한 독립 기준 구현입니다.
    const work=t=>t<=2000?t/20:t<=5000?100+(t-2000)/12.5:340+(t-5000)/10;
    const time=w=>w<=100?w*20:w<=340?2000+(w-100)*12.5:5000+(w-340)*10;
    available=time(work(start)+1);
    const reply=start+agent.delays[slot];
    expected.push([agent.id,slot,arrival,start,available,reply]);
    if(slot+1<agent.actions.length)pending.push({agent,slot:slot+1,arrival:reply+agent.actions[slot+1]});
  }
  assert.equal(actual.length,expected.length);
  for(let i=0;i<actual.length;i++){
    assert.deepEqual(actual[i].slice(0,2),expected[i].slice(0,2));
    assert.ok(actual[i].slice(2).every((value,j)=>Math.abs(value-expected[i][j+2])<1e-8));
  }
  const reversed=[];
  runSharedQueue([...agents].reverse(),(agent,slot,arrival,start,processed,reply)=>reversed.push([agent.id,slot,arrival,start,processed,reply]));
  assert.deepEqual(reversed,actual);
});
test('정원이 충분해도 모든 신청의 대기시간을 계산하고 평균 소요시간에 포함한다',()=>{
  const s=input();
  s.courses.forEach(c=>{c.capacity=300;c.rivals=0;});
  const r=simulate(s);
  assert.equal(r.guaranteed,true);
  assert.equal(r.allWins,s.trials);
  assert.ok(r.timing.meanWaitMs>=s.courses.length*1000);
  assert.ok(r.timing.meanWaitMs<=s.courses.length*3000);
  assert.ok(r.timing.meanCompletionMs>=r.timing.meanWaitMs+s.startDelayMs+s.courses.length*(80+fittsTimeMs(80,60)));
  assert.equal(r.timing.meanQueueWaitMs,0);
  assert.equal(r.serverServiceMs,10);
  assert.deepEqual(r.timing,simulate(s).timing);
  const contested=simulate(input());
  assert.ok(contested.timing.meanQueueWaitMs>0);
  // 같은 사용자 난수를 쓰므로 차이는 공통 대기열에서 추가된 혼잡 대기입니다.
  assert.ok(Math.abs(contested.timing.meanWaitMs-r.timing.meanWaitMs-contested.timing.meanQueueWaitMs)<=1);
  assert.ok(Math.abs(contested.timing.meanCompletionMs-r.timing.meanCompletionMs-contested.timing.meanQueueWaitMs)<=1);
  const guaranteed={...input(),courses:input().courses.map(c=>({...c,capacity:300}))};
  const g=simulate(guaranteed);
  assert.equal(g.allWins,g.trials);
  assert.ok(g.timing.meanQueueWaitMs>0);
  assert.ok(Math.abs(g.timing.meanWaitMs-r.timing.meanWaitMs-g.timing.meanQueueWaitMs)<=1);
});

test('회차별 경쟁 집단 평균은 시드로 재현되고 240~300ms 범위에서 중심이 270ms인 균등분포를 사용한다',()=>{
  const seed=123456789;
  const means=Array.from({length:2000},(_,b)=>rivalGroupMeanMs(seed,b));
  assert.deepEqual(means,means.map((_,b)=>rivalGroupMeanMs(seed,b)));
  assert.ok(means.every(x=>x>=240&&x<=300));
  assert.ok(Math.min(...means)<241&&Math.max(...means)>299);
  const average=means.reduce((a,b)=>a+b,0)/means.length;
  assert.ok(Math.abs(average-270)<2);
  assert.notEqual(rivalGroupMeanMs(seed,0),rivalGroupMeanMs(seed,1));
});
test('이동 로그정규 개인 위치의 변화와 Ex-Gaussian 신청 지연을 반영한다',()=>{
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9);
  near(rivalReactionMs(270,0),80+155*Math.exp(-(0.35**2)/2));
  assert.ok(rivalReactionMs(270,-1)<rivalReactionMs(270,1));
  assert.ok(rivalReactionMs(240,0)<rivalReactionMs(300,0));
  near(rivalActionMs(200,0,Math.exp(-1),380),615);
  near(rivalActionMs(200,1,Math.exp(-1),380),640);
  near(rivalActionMs(200,-1,Math.exp(-1),380),590);
  near(rivalActionMs(80,-10,.9,380),460);
  assert.ok(rivalActionMs(200,0,.01,380)>rivalActionMs(200,0,.9,380));
  assert.ok(rivalActionMs(240,0,.5,380)>rivalActionMs(180,0,.5,380));
});
test('Fitts 조작시간은 거리에 따라 증가하고 버튼 폭에 따라 감소한다',()=>{
  assert.equal(fittsTimeMs(240,60),380);
  assert.ok(fittsTimeMs(80,60)<fittsTimeMs(480,60));
  assert.ok(fittsTimeMs(240,120)<fittsTimeMs(240,60));
});
test('비정상 대기열은 시간대 경계에서 남은 작업량을 정확히 처리한다',()=>{
  assert.equal(serviceFinishMs(100),120);
  assert.equal(serviceFinishMs(1990),2006.25);
  assert.equal(serviceFinishMs(2000),2012.5);
  assert.equal(serviceFinishMs(4995),5006);
  assert.equal(serviceFinishMs(5000),5010);
  assert.equal(serviceFinishMs(10000),10010);
});
test('개인별 선호가 같으면 기존 가중 선택으로 환원되고 선호가 다르면 순서가 바뀐다',()=>{
  const pick=preference=>{
    const draws=[0,.5,.5];
    return rivalOrder([0,1],[1,1],()=>draws.shift(),preference);
  };
  assert.deepEqual(pick(()=>1),[0,1]);
  assert.deepEqual(pick(i=>i===1?4:1),[1,0]);
});
