// @ts-check
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {findEnglishOnlyComments} from './korean-comment-policy.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const approved=JSON.parse(readFileSync(resolve(root,'scripts/baselines/legacy-js-comments.json'),'utf8'));
const legacy=new Map(approved.files.map(({path,sha})=>[path,sha]));
const ignored=new Set(['.git','node_modules','dist','.build','coverage','.cache']);
/** @param {string} dir @param {string} [prefix] @returns {string[]} */
function list(dir,prefix=''){
  return readdirSync(dir,{withFileTypes:true}).flatMap(item=>{
    const path=prefix?prefix+'/'+item.name:item.name;
    if(item.isDirectory())return ignored.has(item.name)?[]:list(join(dir,item.name),path);
    return item.isFile()&&/\.(?:js|mjs|cjs)$/.test(path)?[path]:[];
  });
}
/** @param {string} path @returns {string} */
function gitBlob(path){
  try{
    return execFileSync('git',['hash-object','--path='+path,path],
      {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{
    const data=readFileSync(resolve(root,path));
    return createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
  }
}
let checked=0,exempt=0;
/** @type {string[]} */
const findings=[];
for(const path of list(root)){
  if(legacy.has(path)&&legacy.get(path)===gitBlob(path)){exempt++;continue;}
  checked++;
  const source=readFileSync(resolve(root,path),'utf8');
  let hits;
  try{hits=findEnglishOnlyComments(source);}catch(error){throw new Error('주석 구문 검사 실패: '+path,{cause:error});}
  for(const hit of hits){
    findings.push(path+':'+hit.line+': 영어 설명 주석 금지: '+hit.comment);
  }
}
if(findings.length)throw new Error('한국어 주석 검사 실패:\n'+findings.join('\n'));
console.log('한국어 주석 검사 통과: 신규/수정 '+checked+'개, 기존 무변경 예외 '+exempt+'개');
