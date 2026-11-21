// UI freeze is a file-by-file Git blob contract, not a claim of completed browser QA.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,relative,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
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
  return p==='index.html'||/^html\/[^/]+\.html$/.test(p)||
    /^css\/[^/]+\.css$/.test(p)||/^js\/[^/]+\.js$/.test(p)||
    /^img\/[^/]+$/.test(p);
}
const actual=[...list(root)].filter(isUI).sort();
const expected=baseline.files.map(x=>x.path).sort();
if(JSON.stringify(actual)!==JSON.stringify(expected)){
  const wanted=new Set(expected),found=new Set(actual);
  throw new Error('UI freeze files changed. Added: '+actual.filter(x=>!wanted.has(x))+
    '; missing: '+expected.filter(x=>!found.has(x))+
    '. Exception requires explicit UI approval, visual review and manifest revision.');
}
for(const {path,sha} of baseline.files){
  const contents=readFileSync(resolve(root,path));
  const blob=createHash('sha1').update('blob '+contents.length+'\0').update(contents).digest('hex');
  if(blob!==sha)throw new Error('Frozen UI content changed: '+path+
    '. Use a separately approved UI exception with PC/legacy QA.');
}
console.log('UI freeze verified: '+expected.length+' files, baseline '+baseline.baselineCommit.slice(0,12));
