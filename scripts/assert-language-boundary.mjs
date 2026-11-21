// 기존 TypeScript 이관 중 새 TS 파일이나 원본 TS의 무검증 변경을 차단한다.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline=JSON.parse(readFileSync(resolve(root,'scripts/baselines/ts-migration.json'),'utf8'));
// Windows 체크아웃의 줄바꿈이 달라도 Git 저장소의 원본 blob 해시를 사용한다.
// Git 실행이 불가능한 정적 아카이브에서는 파일 내용으로 계산한다.
function blobSha(path){
  try{
    return execFileSync('git',['hash-object','--path='+path,path],
      {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{
    const contents=readFileSync(resolve(root,path));
    return createHash('sha1').update('blob '+contents.length+'\0').update(contents).digest('hex');
  }
}

const ignored=new Set(['.git','node_modules','dist','.build','coverage','.cache']);
function list(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isDirectory()&&ignored.has(entry.name))return [];
    const path=prefix?prefix+'/'+entry.name:entry.name;
    if(entry.isDirectory())return list(join(dir,entry.name),path);
    return entry.isFile()?[path]:[];
  });
}
const files=list(root);
const all=files.filter(path=>/\.(?:ts|tsx|mts|cts)$/.test(path));
const academicJs=files.filter(path=>/^js\/academic\/.+\.js$/.test(path));
const permitted=new Map(baseline.files.map(x=>[x.path,x.sha]));
if(permitted.size!==baseline.files.length)throw Error('Duplicate TypeScript inventory entries');
for(const path of all){
  const original=permitted.get(path);
  if(!original)throw new Error('New TypeScript prohibited: '+path+
    '. Write JavaScript + JSDoc instead.');
  const hash=blobSha(path);
  if(hash!==original)throw new Error('Existing TypeScript was edited: '+path+
    '. Convert its source and tests to JavaScript in a scoped PR.');
}
for(const path of academicJs){
  const source=readFileSync(resolve(root,path),'utf8');
  if(!/^\uFEFF?\/\/ @ts-check\b/.test(source)){
    throw new Error('Academic JavaScript must opt into JSDoc checking: '+path);
  }
}
console.log('JSDoc-checked academic JS: '+academicJs.length+' files');
console.log('Existing TypeScript left to migrate: '+all.length+
  '/'+baseline.files.length+' (no new/edited TS)');
