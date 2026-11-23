import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile,summarizeFrames,findings,networkSample,networkStats} from '../js/readiness.mjs';
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
    {median:70,jitter:5,mbps:5,failures:1,latencyCount:3,downloadCount:1,excluded:2});
});
