// @ts-check
import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

const configName='academic-source-config.json';
const probeName='network-probe.txt';
const probeHash='33285803a799be38faadcc0777e9fdf6adf36cef2d2bc49ea7098cc11e1a5a70';

/** @param {string} text 공개 QA의 자료 연결 설정 */
export function assertDisabledPreviewConfig(text){
  let config;
  try{config=JSON.parse(text);}
  catch{throw new Error('공개 미리보기의 학사자료 설정은 유효한 JSON이어야 합니다.');}
  if(!config||Object.keys(config).length!==2||config.schemaVersion!==1||config.mode!=='disabled')
    throw new Error('공개 미리보기에는 비활성 학사자료 설정만 허용됩니다.');
}

export function createSyntheticNetworkProbe(){
  const alphabet=Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  const body=Buffer.alloc(256*1024);
  // 공개 v1 시험 파일의 바이트를 재현합니다.
  let state=0x9a7b4c3d;
  for(let i=0;i<body.length;i++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    body[i]=alphabet[state%alphabet.length];
  }
  return 'HANMO-CDN-NETWORK-PROBE v1 - synthetic and public; no personal content.\n'+body.toString('ascii');
}

/** @param {string} text 공개 합성 네트워크 시험 파일 */
export function assertSyntheticNetworkProbe(text){
  const digest=createHash('sha256').update(text.replaceAll('\r\n','\n')).digest('hex');
  if(digest!==probeHash)throw new Error('검증된 합성 네트워크 시험 파일이 아닙니다.');
}

/** @param {string} dist 검증할 정적 산출물 경로 */
export async function assertPreviewData(dist){
  const data=join(dist,'data');
  const entries=await readdir(data,{withFileTypes:true});
  const allowed=new Set([configName,probeName]);
  if(entries.length!==allowed.size||entries.some(entry=>!entry.isFile()||!allowed.has(entry.name)))
    throw new Error('공개 산출물에 미승인 자료 파일 또는 경로가 있습니다.');
  assertDisabledPreviewConfig(await readFile(join(data,configName),'utf8'));
  assertSyntheticNetworkProbe(await readFile(join(data,probeName),'utf8'));
}

const privateApp1Headers=['Exif\0\0','http://ns.adobe.com/xap/1.0/\0','http://ns.adobe.com/xmp/extension/\0']
  .map(header=>Buffer.from(header));

/** @param {Buffer} image 원본 JPEG에서 EXIF와 XMP를 제외하고 IPTC 촬영자 표기·색상·픽셀 데이터를 보존합니다. */
export function stripPreviewPhotoExifAndXmp(image){
  if(image.length<4||image[0]!==0xff||image[1]!==0xd8)
    throw new Error('공개 사진이 유효한 JPEG가 아닙니다.');
  const output=[image.subarray(0,2)];
  let offset=2;
  while(offset<image.length){
    const start=offset;
    if(image[offset++]!==0xff)break;
    while(image[offset]===0xff)offset++;
    const marker=image[offset++];
    if(marker===0xda){
      // 이 사진의 단일 압축 스캔과 뒤따르는 종료 마커는 그대로 유지한다.
      output.push(image.subarray(start));
      return Buffer.concat(output);
    }
    if(offset+2>image.length||marker===0||marker===0xd8||marker===0xd9)break;
    const length=image.readUInt16BE(offset);
    const end=offset+length;
    if(length<2||end>image.length)break;
    if(marker!==0xe1||!privateApp1Headers.some(header=>
      image.subarray(offset+2,Math.min(end,offset+2+header.length)).equals(header)))
      output.push(image.subarray(start,end));
    offset=end;
  }
  throw new Error('공개 사진의 JPEG 헤더가 손상됐습니다.');
}
