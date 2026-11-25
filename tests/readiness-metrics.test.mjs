import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile,summarizeFrames,findings,assessReadiness,networkSample,networkStats,gradeReadiness} from '../js/readiness.mjs';
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
  const info=findings({frame,longTasks:null,network:null});
  assert.match(info.join(' '),/이상/);
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

test('모든 이상 기준을 만족하면 기존 판정 5개와 중복 없는 조치 3개를 표시한다',()=>{
  const measurement={frame:{interruptions:3,median:30},longTasks:3,network:{failures:2,excluded:0},drift:100};
  const assessment=assessReadiness(measurement);
  assert.equal(assessment.messages.length,5);
  assert.deepEqual(assessment.messages,findings(measurement));
  assert.equal(assessment.actions.length,3);
  assert.match(assessment.actions[0],/주사율/);
  assert.match(assessment.actions[1],/작업 관리자/);
  assert.match(assessment.actions[2],/유선 연결/);
});
test('개별 판정은 해당 조치만 제공하고 중복된 브라우저 조치를 만들지 않는다',()=>{
  const normal={frame:{interruptions:2,median:29.9},longTasks:2,network:null,drift:99.9};
  assert.deepEqual(assessReadiness(normal).actions,[]);
  for(const [change,expected] of [
    [{frame:{interruptions:3,median:16}},/^화면 갱신:/],
    [{frame:{interruptions:0,median:30}},/^화면 갱신:/],
    [{longTasks:3},/^브라우저 부하:/],
    [{drift:100},/^브라우저 부하:/],
    [{network:{failures:2,excluded:0}},/^한모 연결:/],
  ]){
    const assessment=assessReadiness({...normal,...change});
    assert.equal(assessment.messages.length,1);
    assert.equal(assessment.actions.length,1);
    assert.match(assessment.actions[0],expected);
  }
});
test('미지원·미실시 지표는 이상으로 처리하지 않고 불완전한 연결 표본은 재측정만 안내한다',()=>{
  const measurement={frame:{interruptions:0,median:16},longTasks:null,network:null,drift:null};
  const normal=assessReadiness(measurement);
  assert.match(normal.messages[0],/뚜렷한 이상을 발견하지 못했습니다/);
  assert.deepEqual(normal.actions,[]);
  for(const network of [{failures:1,excluded:0},{failures:0,excluded:2}]){
    const limited=assessReadiness({...measurement,network});
    assert.deepEqual(limited.messages,normal.messages);
    assert.equal(limited.actions.length,1);
    assert.match(limited.actions[0],/^연결 측정 제한:/);
  }
});

const goodNetwork={median:40,jitter:5,mbps:10,failures:0,latencyCount:5,jitterCount:4,downloadCount:2,excluded:0};
const goodMeasurement={frame:{median:20,p95:25,interruptions:0,samples:150},longTasks:0,drift:5,timerCount:30,
  network:goodNetwork,connectionType:'4g',threads:8,memory:8,reactionMs:200};
test('11개 지표는 독립 등급이며 전체 종합 등급을 생성하지 않는다',()=>{
  const grades=gradeReadiness(goodMeasurement);
  assert.equal(Object.keys(grades).length,11);
  assert.ok(Object.values(grades).every(x=>x.grade==='A'));
});
test('작을수록 좋은 수치와 클수록 좋은 수치의 등급 경계를 모두 검증한다',()=>{
  const cases=[
    ['task','longTasks',[0,1,2,4,5]],['drift','drift',[5,15,30,99.99,100]],
    ['reaction','reactionMs',[200,250,300,400,401]],['threads','threads',[8,6,4,2,1]],
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
