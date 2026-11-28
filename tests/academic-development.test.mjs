import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {searchMetadata,normalizeAcademicQuery} from '../js/academic/core/search/metadata-search.mjs';
import {offeringHistory} from '../js/academic/core/forecast/offering-history.mjs';
import {academicSourceLink} from '../js/academic/core/academic-source-link.js';
import {noticeTopics} from '../js/academic/core/campus-assist/notice-topics.js';
import {canonicalJson,sha256Hex} from '../js/academic/core/campus-assist/content-hash.js';
const require=createRequire(import.meta.url);
const source=require('../js/academic-data-source.js');
test('공지 제목의 공백과 오타를 검색하고 미연결과 빈 결과를 구별한다',()=>{
 const rows=[{id:'N1',title:'가상 수강신청 일정 안내',category:'COURSE'}];
 assert.ok(normalizeAcademicQuery('수강신철 일정').variants.includes('수강신청 일정'));
 assert.equal(searchMetadata({kind:'notice',query:'수 강 신 청',rows}).hits[0]?.id,'N1');
 assert.equal(searchMetadata({kind:'notice',query:'가상 장학금',rows}).status,'NO_MATCH');
 assert.equal(searchMetadata({kind:'notice',query:'가상'}).status,'NOT_CONNECTED');
 assert.deepEqual(noticeTopics('수 강 신 청 안내'),['COURSE']);
});
test('강의 학수번호 정확 일치와 캠퍼스 필터를 지원하고 금지 필드를 거부한다',()=>{
 const rows=[
  {id:'C1',courseId:'SYN100',title:'가상 경제학',term:'2026-1',campus:'SEOUL'},
  {id:'C2',courseId:'SYN101',title:'가상 경제학',term:'2026-1',campus:'GLOBAL'}
 ];
 assert.equal(searchMetadata({kind:'course',query:'SYN100',rows}).hits[0]?.id,'C1');
 assert.deepEqual(searchMetadata({kind:'course',query:'',campus:'GLOBAL',rows}).hits.map(x=>x.id),['C2']);
 for(const key of ['instructor','capacity','body','faq','studentId'])
  assert.throws(()=>searchMetadata({kind:'course',query:'가상',rows:[{...rows[0],[key]:'금지 필드'}]}),/Unsupported metadata field/);
});
const observation=(year,state='OFFERED',coverage='COMPLETE_TERM_CATALOG')=>({
 term:year+'-1',state,coverage,sourceRef:'synthetic-'+year,
 publishedAt:year+'-02-01T00:00:00Z',verifiedAt:year+'-02-02T00:00:00Z',
 courseIdentity:{state:'RESOLVED',revisionRef:'synthetic-id',checkedAt:year+'-02-02T00:00:00Z'}
});
const base={targetTerm:'2027-1',asOf:'2026-11-01T00:00:00Z',courseIdentity:'RESOLVED'};
test('개설 집계는 동일 과목과 완전 목록만 세고 미관측을 미개설로 간주하지 않는다',()=>{
 const rows=[observation(2023),observation(2024,'CONFIRMED_NOT_OFFERED'),observation(2025),observation(2026,'UNKNOWN','PARTIAL'),observation(2022)];
 const result=offeringHistory({...base,observations:rows});
 assert.equal(result.status,'HISTORICAL_PATTERN');
 assert.equal(result.observed,3);
 assert.equal(result.offered,2);
 assert.equal(offeringHistory({...base,observations:[observation(2026,'OFFERED','PARTIAL')]}).status,'INSUFFICIENT_DATA');
 assert.equal(offeringHistory({...base,courseIdentity:'EQUIVALENCE_UNVERIFIED',observations:rows}).status,'UNKNOWN');
 assert.throws(()=>offeringHistory({...base,observations:[{...rows[0],instructor:'가상'}]}),/unsupported observation/);
});
test('미래 검수와 충돌하는 관측은 과거 집계에서 제외한다',()=>{
 const a=observation(2025);
 const result=offeringHistory({...base,observations:[a,{...a,state:'CONFIRMED_NOT_OFFERED',sourceRef:'conflict'}, {...observation(2026),verifiedAt:'2027-01-01T00:00:00Z'}]});
 assert.equal(result.observed,0);
 assert.equal(result.status,'INSUFFICIENT_DATA');
});
test('출처 구분과 해시는 검수 증명이 아니라 입력 확인용이다',()=>{
 assert.equal(academicSourceLink('https://www.hufs.ac.kr/'),'HUFS_DOMAIN');
 assert.equal(academicSourceLink('https://hufs.ac.kr.example.invalid/'),'OTHER_HTTPS');
 assert.equal(sha256Hex(canonicalJson({b:2,a:1})),sha256Hex(canonicalJson({a:1,b:2})));
 assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('구형 데이터 연결은 거부하고 설정 파일 외 네트워크를 요청하지 않는다',async()=>{
 for(const [config,status] of [
  [{schemaVersion:1,mode:'disabled'},'NOT_CONNECTED'],
  [{schemaVersion:1,mode:'supabase',projectUrl:'https://test.invalid',publishableKey:'synthetic'},'INVALID'],
  [{schemaVersion:1,mode:'disabled',extra:true},'INVALID']
 ]){
  const calls=[];
  const result=await source.load({fetcher:async url=>{calls.push(url);return {ok:true,json:async()=>config}}});
  assert.equal(result.status,status);
  assert.deepEqual(result.notices,[]);
  assert.deepEqual(result.offerings,[]);
  assert.equal(calls.length,1);
 }
});
