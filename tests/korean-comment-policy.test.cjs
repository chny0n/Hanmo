const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const lib=pathToFileURL(path.resolve(__dirname,'../scripts/korean-comment-policy.mjs')).href;
test('영어로만 된 설명 주석은 검사에서 차단한다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  assert.equal(findEnglishOnlyComments('// This comment must fail.\nconst value=1;').length,1);
  assert.equal(findEnglishOnlyComments('/**\n * @param {string} name - English text\n */').length,1);
});
test('한국어 설명·기계 지시문·순수 JSDoc 타입 선언은 허용한다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  const sample='// @ts-check\n/** @typedef {import("./other.js").Thing} Thing */\n'
    +'/** 한국어 설명과 API 이름은 허용한다.\n * @param {string} name 검사할 이름\n * @returns {boolean} 검증 결과\n */\nconst value=1;';
  assert.deepEqual(findEnglishOnlyComments(sample),[]);
});
test('코드 안의 URL 및 문자열을 설명 주석으로 오탐하지 않는다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  const sample='const text="// English inside string";\nconst link="https://example.com";\n'
    +'const matcher=/https:\\/\\/example\\.com/;\n/** 한국어 설명 */';
  assert.deepEqual(findEnglishOnlyComments(sample),[]);
});
test('기존 영어 주석을 한글 한 단어로 덮어 쓰지 않고 직접 번역해야 한다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  const text='// This English explanation should be translated.\n/** 자료 연결 확인 */';
  assert.equal(findEnglishOnlyComments(text).length,1);
});

test('여러 줄 객체 타입 선언은 한국어 주석 오류로 오인하지 않는다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  const source='/**\n * @typedef {{\n *   courseCode:string, title:string,\n *   status:\'UNVERIFIED\'|\'NEEDS_REVIEW\'\n * }} LocalCourse\n */';
  assert.deepEqual(findEnglishOnlyComments(source),[]);
});

test('JSDoc 타입 가져오기는 허용하고 뒤에 붙은 영문 설명은 차단한다',async()=>{
  const {findEnglishOnlyComments}=await import(lib);
  const tag='@import { Course, Term as AcademicTerm } from "./types.js"';
  assert.deepEqual(findEnglishOnlyComments('/** '+tag+' */'),[]);
  assert.equal(findEnglishOnlyComments('/** '+tag+' This is an English explanation. */').length,1);
});
