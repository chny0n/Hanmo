import {copyFile,cp,mkdir,rm,stat,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';

// Core and tests are authored in js/academic but are NOT published as raw TypeScript.
const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const compiled=join(root,'.build','student-forecast.js');
const exists=async p=>{try{return(await stat(p)).isFile()}catch{return false}};
if(!await exists(compiled))throw Error('Missing generated student forecast bundle; run npm run build.');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await copyFile(join(root,'index.html'),join(dist,'index.html'));
for(const directory of ['css','js','html','img'])
  await cp(join(root,directory),join(dist,directory),{recursive:true});
await rm(join(dist,'js','academic'),{recursive:true,force:true});
await mkdir(join(dist,'data'),{recursive:true});
await copyFile(join(root,'data','academic-notices-reference.json'),
  join(dist,'data','academic-notices-reference.json'));
await copyFile(compiled,join(dist,'js','student-forecast.js'));
for(const name of [
 'index.html','html/planner.html','html/forecast.html','html/catalog.html',
 'html/academic-timeline.html','html/academic-progress.html','html/scenario-workshop.html',
 'html/vsugang.html','js/student-forecast.js','data/academic-notices-reference.json',
])if(!await exists(join(dist,name)))throw Error('Missing public student asset '+name);
if(await exists(join(dist,'CNAME')))throw Error('CNAME leaked into QA artifact');
const rootEntries=await readdir(dist);
if(rootEntries.includes('degree-rescue'))throw Error('Legacy academic directory leaked into Pages artifact');
if(await exists(join(root,'degree-rescue','package.json')))throw Error('Old nested package remains in repo');
console.log('Hanmo site staged at dist/ with root html, js, css and data. TypeScript source excluded; no CNAME.');
