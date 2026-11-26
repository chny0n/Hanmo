import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {assertStudentBundleMeta,studentInputs,studentStyles,readPublicAssets} from '../scripts/student-boundary.mjs';

function fixture() {
  return {inputs:Object.fromEntries([...studentInputs,...studentStyles].map(path=>[path,{bytes:1}])),outputs:{
    '.build/student-entry.js':{entryPoint:studentInputs[0],inputs:{[studentInputs[0]]:{bytesInOutput:1}}},
    '.build/academic-calendar.js':{entryPoint:studentInputs[1],inputs:{}},
    '.build/academic-calendar.css':{inputs:{'node_modules/fullcalendar/skeleton.css':{bytesInOutput:1}}},
    '.build/student-ui.css':{
      entryPoint:studentStyles[0],
      inputs:Object.fromEntries(studentStyles.map(path=>[path,{bytesInOutput:1}])),
      imports:[{path:'../img/background.svg',kind:'url-token',external:true}],
    },
  }};
}
test('학생 번들 허용 경로만 통과한다',()=>{
  const meta=fixture();
  meta.inputs['node_modules/zod/index.js']={bytes:1};
  assert.doesNotThrow(()=>assertStudentBundleMeta(meta));
});
test('제거 최적화로 최종 출력에 없는 연구 코드도 차단한다',()=>{
  const meta=fixture();
  meta.inputs['js/academic/core/forecast/offering.js']={bytes:1};
  assert.throws(()=>assertStudentBundleMeta(meta),/미승인 입력/);
});
test('출력에만 기록된 금지 입력도 차단한다',()=>{
  const meta=fixture();
  meta.outputs['.build/student-entry.js'].inputs['js/academic/core/academics/degree-credit.js']={bytesInOutput:0};
  assert.throws(()=>assertStudentBundleMeta(meta),/미승인 입력/);
});
test('예상하지 못한 산출물과 필수 입력 누락을 차단한다',()=>{
  const meta=fixture();
  meta.outputs['.build/degree-preparation.js']={inputs:{}};
  assert.throws(()=>assertStudentBundleMeta(meta),/산출물 목록/);
  const missing=fixture();
  delete missing.inputs[studentInputs[0]];
  assert.throws(()=>assertStudentBundleMeta(missing),/필수 입력 누락/);
});
test('학생 공통 스타일의 소스와 배경 참조를 해당 CSS 출력에만 허용한다',()=>{
  const stray=fixture();
  stray.outputs['.build/student-ui.css'].inputs['css/extra.css']={bytesInOutput:1};
  assert.throws(()=>assertStudentBundleMeta(stray),/학생 스타일 번들에 미승인 입력/);
  const wrongOutput=fixture();
  wrongOutput.outputs['.build/student-entry.js'].inputs[studentStyles[1]]={bytesInOutput:1};
  assert.throws(()=>assertStudentBundleMeta(wrongOutput),/학생 번들에 미승인 입력/);
  const external=fixture();
  external.outputs['.build/student-ui.css'].imports.push({path:'https://example.com/styles.css',kind:'import-rule',external:true});
  assert.throws(()=>assertStudentBundleMeta(external),/학생 스타일 번들에 미승인 참조/);
});
test('공개 목록은 학사 연구 경로와 삭제한 페이지를 제외한다',async()=>{
  const paths=await readPublicAssets(fileURLToPath(new URL('..',import.meta.url)));
  assert.ok(paths.includes('html/planner.html'));
  assert.ok(paths.includes('js/strategy-recommendation.mjs'));
  assert.ok(!paths.includes('js/strategy-engine.mjs'));
  assert.ok(!paths.includes('js/strategy-worker.mjs'));
  assert.ok(paths.every(path=>!path.startsWith('js/academic/')));
  assert.ok(studentStyles.every(path=>!paths.includes(path)));
  assert.ok(!paths.includes('html/academic-progress.html'));
});
