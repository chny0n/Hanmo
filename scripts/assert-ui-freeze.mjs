// 화면 파일별 Git blob 해시를 검증한다. 브라우저 실기기 QA 완료를 의미하지 않는다.
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gitBlobHashes} from './git-blob-hashes.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline=JSON.parse(readFileSync(resolve(root,'scripts/baselines/ui-freeze.json'),'utf8'));
function list(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(x=>{
    const path=prefix?prefix+'/'+x.name:x.name;
    if(x.isDirectory()){
      if(['.git','node_modules','dist','.build','coverage','.cache'].includes(x.name))return [];
      return list(join(dir,x.name),path);
    }
    return x.isFile()?[path]:[];
  });
}
function isUI(p){
  return p==='index.html'||/^html\/.+\.html$/.test(p)||
    /^css\/.+\.css$/.test(p)||/^js\/[^/]+\.js$/.test(p)||
    /^img\/.+$/.test(p);
}
const actual=[...list(root)].filter(isUI).sort();
const expected=baseline.files.map(x=>x.path).sort();
if(JSON.stringify(actual)!==JSON.stringify(expected)){
  const wanted=new Set(expected),found=new Set(actual);
  throw new Error('UI freeze files changed. Added: '+actual.filter(x=>!wanted.has(x))+
    '; missing: '+expected.filter(x=>!found.has(x))+
    '. Exception requires explicit UI approval, visual review and manifest revision.');
}
const hashes=gitBlobHashes(root,expected);
for(const {path,sha} of baseline.files){
  if(hashes.get(path)!==sha)throw new Error('Frozen UI content changed: '+path+
    '. Use a separately approved UI exception with PC/legacy QA.');
}
console.log('UI freeze verified: '+expected.length+' files, baseline '+baseline.baselineCommit.slice(0,12));
