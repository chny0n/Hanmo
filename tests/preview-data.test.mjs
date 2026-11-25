import assert from 'node:assert/strict';
import {copyFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {assertDisabledPreviewConfig,assertPreviewData,stripPreviewPhotoExif} from '../scripts/preview-data.mjs';

const disabled=JSON.stringify({schemaVersion:1,mode:'disabled'});

test('공개 QA는 활성, 구형, 비밀 정보가 섞인 설정을 거부한다',()=>{
  assert.doesNotThrow(()=>assertDisabledPreviewConfig(disabled));
  assert.throws(()=>assertDisabledPreviewConfig('가상의 비밀 입력'),{
    message:'공개 미리보기의 학사자료 설정은 유효한 JSON이어야 합니다.',
  });
  for(const config of [null,[],{}, {schemaVersion:1,mode:'supabase'},
    {schemaVersion:1,mode:'disabled',payload:{}},{schemaVersion:0,mode:'disabled'}]){
    assert.throws(()=>assertDisabledPreviewConfig(JSON.stringify(config)),/비활성 학사자료 설정/);
  }
});

test('승인된 합성 데이터만 공개하고 복구한 과거 자료나 시험 파일 위장은 거부한다',async t=>{
  const dist=await mkdtemp(join(tmpdir(),'hanmo-preview-'));
  t.after(()=>rm(dist,{recursive:true,force:true}));
  const data=join(dist,'data');
  await mkdir(data);
  await writeFile(join(data,'academic-source-config.json'),disabled);
  await copyFile(new URL('../data/network-probe.txt',import.meta.url),join(data,'network-probe.txt'));
  await assertPreviewData(dist);

  const old=join(data,'previous-public-snapshot.json');
  await writeFile(old,'{}');
  await assert.rejects(assertPreviewData(dist),/미승인 자료 파일/);
  await rm(old);

  await writeFile(join(data,'network-probe.txt'),'검증되지 않은 합성 파일');
  await assert.rejects(assertPreviewData(dist),/합성 네트워크 시험 파일/);
});

test('공개 사진의 EXIF만 제거하고 다른 앱 세그먼트 및 압축 스캔을 유지한다',()=>{
  const segment=(marker,body)=>Buffer.concat([
    Buffer.from([0xff,marker,0,body.length+2]),body]);
  const soi=Buffer.from([0xff,0xd8]);
  const exif=segment(0xe1,Buffer.from('Exif\0\0synthetic metadata'));
  const app0=segment(0xe0,Buffer.from('JFIF\0'));
  const icc=segment(0xe2,Buffer.from('ICC_PROFILE\0'));
  const scan=Buffer.from([0xff,0xda,0,2,0xff,0,0xd9,0xff,0xd9]);
  const clean=Buffer.concat([soi,app0,icc,scan]);
  assert.deepEqual(stripPreviewPhotoExif(Buffer.concat([soi,app0,exif,icc,scan])),clean);
  assert.deepEqual(stripPreviewPhotoExif(clean),clean);
  assert.throws(()=>stripPreviewPhotoExif(Buffer.concat([soi,Buffer.from([0xff,0xe1,0,20])])),/헤더가 손상/);
});
