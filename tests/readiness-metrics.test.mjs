import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile,summarizeFrames,findings,networkSample,networkStats,gradeReadiness,gradeAdvice} from '../js/readiness.mjs';
test('분위수는 입력 순서와 무관하고 입력을 변경하지 않는다',()=>{
  const values=[30,10,20];
  assert.equal(percentile(values,0.5),20);
  assert.equal(percentile(values,0.95),29);
  assert.deepEqual(values,[30,10,20]);
});
test('비정상적인 프레임 표본을 거부한다',()=>{
  assert.throws(()=>percentile([],.5),/표본/);
  assert.throws(()=>percentile([1,-1],.5),/표본/);
});
test('측정값 기반 끊김 기준은 최소 50ms다',()=>{
  const normal=Array(80).fill(16);
  const frame=summarizeFrames([...normal,60,70,80]);
  assert.equal(frame.interruptions,3);
  assert.equal(frame.threshold,50);
  const info=findings({frame,longTasks:0,network:null});
  assert.match(info.join(' '),/화면/);
});
test('지원하지 않는 긴 작업 지표와 네트워크 생략을 허용한다',()=>{
  const frame=summarizeFrames([16,16,17]);
  assert.deepEqual(findings({frame,longTasks:null,network:null}),[]);
});
test('다운로드는 압축된 본문 크기와 전체 요청 시간으로 계산한다',()=>{
  const timing={startTime:20,responseEnd:120,transferSize:50300,
    encodedBodySize:50000,decodedBodySize:262216,workerStart:0};
  assert.equal(networkSample(timing,'GET'),4);
  assert.equal(networkSample({...timing,encodedBodySize:0},'HEAD'),100);
  for(const invalid of [
    {...timing,transferSize:0},{...timing,transferSize:300},
    {...timing,deliveryType:'cache'},{...timing,workerStart:25},
    {...timing,responseEnd:timing.startTime},undefined,
  ]){
    assert.equal(networkSample(invalid,'GET'),null);
  }
});
test('지터는 실패 또는 제외된 요청을 건너뛰어 비교하지 않는다',()=>{
  assert.deepEqual(networkStats([10,null,70,75,null],[5],1),
    {median:70,jitter:5,mbps:5,failures:1,latencyCount:3,jitterCount:1,downloadCount:1,excluded:2});
});

test('모든 이상 기준을 만족하면 다섯 관측을 순서대로 요약한다',()=>{
  const measurement={frame:{interruptions:3,median:30},longTasks:3,network:{failures:2},drift:100};
  assert.deepEqual(findings(measurement),[
    '화면 갱신이 여러 번 끊겼습니다.',
    '이 탭의 화면 갱신 간격이 길었습니다.',
    '브라우저 긴 작업이 반복되었습니다.',
    '한모 정적 파일 요청에서 반복 오류가 발생했습니다.',
    '브라우저 타이머가 크게 지연되었습니다.',
  ]);
});
test('개별 판정은 실제로 관측한 항목만 요약한다',()=>{
  const normal={frame:{interruptions:2,median:29.9},longTasks:2,network:null,drift:99.9};
  assert.deepEqual(findings(normal),[]);
  for(const [change,expected] of [
    [{frame:{interruptions:3,median:16}},/끊겼습니다/],
    [{frame:{interruptions:0,median:30}},/갱신 간격/],
    [{longTasks:3},/긴 작업/],
    [{drift:100},/타이머/],
    [{network:{failures:2}},/반복 오류/],
  ]){
    const messages=findings({...normal,...change});
    assert.equal(messages.length,1);
    assert.match(messages[0],expected);
  }
});
test('미지원·미실시 지표와 단발 요청 실패는 이상 요약에 넣지 않는다',()=>{
  const measurement={frame:{interruptions:0,median:16},longTasks:null,network:null,drift:null};
  assert.deepEqual(findings(measurement),[]);
  assert.deepEqual(findings({...measurement,network:{failures:1}}),[]);
});

const goodNetwork={median:40,jitter:5,mbps:10,failures:0,latencyCount:5,jitterCount:4,downloadCount:2,excluded:0};
const goodMeasurement={frame:{median:20,p95:25,interruptions:0,samples:150},longTasks:0,drift:5,timerCount:30,
  network:goodNetwork,connectionType:'4g',threads:8,memory:8};
test('10개 PC 지표는 독립 등급이며 반응속도와 전체 등급을 생성하지 않는다',()=>{
  const grades=gradeReadiness(goodMeasurement);
  assert.equal(Object.keys(grades).length,10);
  assert.equal(grades.reaction,undefined);
  assert.ok(Object.values(grades).every(x=>x.grade==='A'));
});
test('작을수록 좋은 수치와 클수록 좋은 수치의 등급 경계를 모두 검증한다',()=>{
  const cases=[
    ['task','longTasks',[0,1,2,4,5]],['drift','drift',[5,15,30,99.99,100]],
    ['threads','threads',[8,6,4,2,1]],
    ['memory','memory',[8,4,2,1,.5]],
  ];
  for(const [key,field,values] of cases){
    assert.deepEqual(values.map(v=>gradeReadiness({...goodMeasurement,[field]:v})[key].grade),['A','B','C','D','F']);
  }
  for(const [key,field,values] of [
    ['latency','median',[40,80,150,300,301]],['jitter','jitter',[5,15,30,60,61]],
    ['speed','mbps',[10,5,2,.5,.49]],['error','failures',[0,1,2,4,7]],
  ]){
    assert.deepEqual(values.map(v=>gradeReadiness({...goodMeasurement,network:{...goodNetwork,[field]:v}})[key].grade),['A','B','C','D','F']);
  }
  assert.deepEqual(['4g','3g','2g','slow-2g','unknown'].map(connectionType=>
    gradeReadiness({...goodMeasurement,connectionType}).connection.grade),['A','C','D','F',null]);
});
test('개선 조치는 B부터 표시하고 A와 판정 보류를 건너뛴다',()=>{
  assert.deepEqual(gradeAdvice(gradeReadiness(goodMeasurement)),[]);
  const actions=gradeAdvice(gradeReadiness({...goodMeasurement,threads:6,drift:15,memory:undefined,
    network:{...goodNetwork,median:80}}));
  assert.equal(actions.length,2);
  assert.match(actions[0],/^타이머 지연·논리 코어:/);
  assert.match(actions[1],/^HTTP 응답:/);
  assert.doesNotMatch(actions.join(' '),/화면 프레임|연결 지터|메모리:/);
});
test('프레임은 FPS·95백분위수·끊김 중 최저 등급으로 판정한다',()=>{
  const frame=goodMeasurement.frame;
  for(const [field,values] of [['median',[20,25,1000/30,50,51]],['p95',[25,40,60,100,101]],['interruptions',[0,1,2,4,5]]]){
    assert.deepEqual(values.map(value=>gradeReadiness({...goodMeasurement,frame:{...frame,[field]:value}}).frame.grade),['A','B','C','D','F']);
  }
  assert.equal(gradeReadiness({...goodMeasurement,frame:{...frame,median:8,interruptions:5}}).frame.grade,'F');
});
test('누락·미지원·표본 부족은 F가 아니며 제외와 실패를 구분한다',()=>{
  const no=gradeReadiness({frame:null,longTasks:null,drift:null,timerCount:0,network:null});
  assert.ok(Object.values(no).every(x=>x.grade===null));
  const small=gradeReadiness({...goodMeasurement,timerCount:14,network:{...goodNetwork,latencyCount:2,jitterCount:1,downloadCount:1,excluded:4}});
  for(const key of ['drift','latency','jitter','speed'])assert.equal(small[key].grade,null);
  assert.equal(small.error.grade,'A');
  assert.match(small.error.note,/잠정/);
  const allExcluded=gradeReadiness({...goodMeasurement,network:{...goodNetwork,median:null,jitter:null,mbps:null,latencyCount:0,jitterCount:0,downloadCount:0,excluded:7}});
  assert.equal(allExcluded.error.grade,null);
});
