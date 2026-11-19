import {copyFile,cp,mkdir,rm,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const here=resolve(import.meta.dirname,'..');
const root=resolve(here,'..');
const dist=join(here,'dist');
const exists=async(path)=>{try{return (await stat(path)).isFile();}catch{return false;}};

if(!(await exists(join(here,'public/app.js')))) throw new Error('Run esbuild before staging');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
await copyFile(join(root,'index.html'),join(dist,'index.html'));
for(const directory of ['css','js','html','img']){
  await cp(join(root,directory),join(dist,directory),{recursive:true});
}
const degree=join(dist,'degree-rescue');
await mkdir(join(degree,'public'),{recursive:true});
await copyFile(join(here,'index.html'),join(degree,'index.html'));
await copyFile(join(here,'style.css'),join(degree,'style.css'));
await copyFile(join(here,'catalog.html'),join(degree,'catalog.html'));
await copyFile(join(here,'catalog.css'),join(degree,'catalog.css'));
await copyFile(join(here,'public/app.js'),join(degree,'public/app.js'));
await copyFile(join(here,'public/catalog.js'),join(degree,'public/catalog.js'));
if(await exists(join(dist,'CNAME'))) throw new Error('Custom domain leaked into preview');
if(!(await exists(join(degree,'public/app.js')))) throw new Error('Missing browser bundle');
console.log('Static preview staged in degree-rescue/dist (no CNAME).');
