import assert from 'node:assert/strict';
import {copyFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {assertDisabledPreviewConfig,assertPreviewData,stripPreviewPhotoExifAndXmp} from '../scripts/preview-data.mjs';

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

test('공개 사진은 EXIF와 XMP를 빼고 촬영자 표기와 색상·압축 데이터를 유지한다',()=>{
  const segment=(marker,body)=>Buffer.concat([
    Buffer.from([0xff,marker,0,body.length+2]),body]);
  const soi=Buffer.from([0xff,0xd8]);
  const exif=segment(0xe1,Buffer.from('Exif\0\0synthetic metadata'));
  const xmp=segment(0xe1,Buffer.from('http://ns.adobe.com/xap/1.0/\0synthetic metadata'));
  const extendedXmp=segment(0xe1,Buffer.from('http://ns.adobe.com/xmp/extension/\0synthetic metadata'));
  const otherApp1=segment(0xe1,Buffer.from('Exif\0'));
  const app0=segment(0xe0,Buffer.from('JFIF\0'));
  const icc=segment(0xe2,Buffer.from('ICC_PROFILE\0'));
  const iptc=segment(0xed,Buffer.from('Photoshop 3.0\0synthetic credit'));
  const adobe=segment(0xee,Buffer.from('Adobe'));
  const scan=Buffer.from([0xff,0xda,0,2,0xff,0,0xd9,0xff,0xd9]);
  const clean=Buffer.concat([soi,app0,otherApp1,icc,iptc,adobe,scan]);
  assert.deepEqual(stripPreviewPhotoExifAndXmp(Buffer.concat([soi,app0,exif,otherApp1,xmp,icc,iptc,extendedXmp,adobe,scan])),clean);
  assert.deepEqual(stripPreviewPhotoExifAndXmp(clean),clean);
  assert.throws(()=>stripPreviewPhotoExifAndXmp(Buffer.concat([soi,Buffer.from([0xff,0xe1,0,20])])),/헤더가 손상/);
});
