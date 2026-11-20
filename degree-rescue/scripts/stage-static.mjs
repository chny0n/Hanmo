import {copyFile,cp,mkdir,rm,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const here=resolve(import.meta.dirname,'..');
const root=resolve(here,'..');
const dist=join(here,'dist');
const exists=async(path)=>{try{return (await stat(path)).isFile();}catch{return false;}};

for(const name of ['app.js','catalog.js','academic-timeline.js','student-forecast.js']){
  if(!(await exists(join(here,'public',name))))throw Error('Run browser bundles before staging: '+name);
}
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await copyFile(join(root,'index.html'),join(dist,'index.html'));
for(const directory of ['css','js','html','img']){
  await cp(join(root,directory),join(dist,directory),{recursive:true});
}
// The academic calculation core remains in degree-rescue/src for typecheck and tests,
// but all public student HTML routes live inside /html.
await mkdir(join(dist,'data'),{recursive:true});
await copyFile(join(here,'data/academic-notices-reference.json'),
  join(dist,'data/academic-notices-reference.json'));
await copyFile(join(here,'public/student-forecast.js'),join(dist,'js/student-forecast.js'));
for(const name of [
  'index.html','html/planner.html','html/catalog.html','html/forecast.html',
  'html/academic-timeline.html','html/academic-progress.html',
  'html/scenario-workshop.html','html/vsugang.html',
  'js/student-forecast.js','data/academic-notices-reference.json']){
  if(!(await exists(join(dist,name))))throw Error('Missing student HTML asset: '+name);
}
if(await exists(join(dist,'CNAME')))throw Error('Custom domain leaked into QA preview');
console.log('Student-first static QA preview staged in html/ (no /degree-rescue/ public routes, no CNAME).');
