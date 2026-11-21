// Prevent accidental new TypeScript modules while the historical source is migrated.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const baseline=JSON.parse(readFileSync(resolve(root,'scripts/baselines/ts-migration.json'),'utf8'));
// Use Git clean filters so an unchanged Windows CRLF checkout hashes to its
// canonical repository blob. Fallback supports archive/static checkouts.
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
    return entry.isFile()&&/\.(?:ts|tsx|mts|cts)$/.test(entry.name)?[path]:[];
  });
}
const all=list(root),permitted=new Map(baseline.files.map(x=>[x.path,x.sha]));
if(permitted.size!==baseline.files.length)throw Error('Duplicate TypeScript inventory entries');
for(const path of all){
  const original=permitted.get(path);
  if(!original)throw new Error('New TypeScript prohibited: '+path+
    '. Write JavaScript + JSDoc instead.');
  const hash=blobSha(path);
  if(hash!==original)throw new Error('Existing TypeScript was edited: '+path+
    '. Convert its source and tests to JavaScript in a scoped PR.');
}
console.log('Existing TypeScript left to migrate: '+all.length+
  '/'+baseline.files.length+' (no new/edited TS)');
