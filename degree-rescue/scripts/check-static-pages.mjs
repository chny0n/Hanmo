import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,join,relative,sep} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const site=join(dist,'degree-rescue');
const pages=['index.html','catalog.html','academic-timeline.html'];
const expected=[
  'index.html','style.css','catalog.html','catalog.css','academic-timeline.html',
  'academic-timeline.css','public/app.js','public/catalog.js',
  'public/academic-timeline.js','data/academic-notices-reference.json',
];
const expectedSet=new Set(expected);
const isFile=async(path)=>{try{return (await stat(path)).isFile();}catch{return false;}};
async function recurse(folder){
  const result=[];
  for(const item of await readdir(folder,{withFileTypes:true})){
    const path=join(folder,item.name);
    if(item.isDirectory())result.push(...await recurse(path));
    else if(item.isFile())result.push(relative(site,path).split(sep).join('/'));
    else throw Error('Unexpected link in staged preview: '+path);
  }
  return result;
}
const found=await recurse(site);
const unexpected=found.filter(name=>!expectedSet.has(name));
if(unexpected.length)throw Error('Unreviewed assets included in preview: '+unexpected.join(', '));
for(const name of expected){
  if(!await isFile(join(site,name)))throw Error('Missing staged academic asset: '+name);
}
if(await isFile(join(dist,'CNAME')))throw Error('Production custom domain leaked into preview');
if(!await isFile(join(dist,'pc-only.html')))throw Error('PC-only notice missing from Pages bundle');
if(!await isFile(join(dist,'js/pc-only.js')))throw Error('PC-only gate missing from Pages bundle');
for(const entry of ['index.html','html/developer.html','html/vsugang.html',
  'html/practice.html','html/selectZone.html','html/result.html',
  'degree-rescue/index.html','degree-rescue/catalog.html','degree-rescue/academic-timeline.html']){
  const body=await readFile(join(dist,entry),'utf8');
  const asset=entry==='index.html'?'./js/pc-only.js':'../js/pc-only.js';
  const at=body.indexOf('<script src="'+asset+'"></script>');
  if(at<0||at>body.indexOf('</head>'))throw Error('PC-only guard missing from '+entry);
}


let checkedLinks=0,checkedAria=0;
for(const page of pages){
  const body=await readFile(join(site,page),'utf8');
  const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  const keys=new Set(ids);
  if(keys.size!==ids.length)throw Error('Duplicate DOM id on '+page);
  for(const m of body.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)){
    for(const id of m[1].trim().split(/\s+/)){
      if(!keys.has(id))throw Error(page+' missing accessible reference: '+id);
      checkedAria++;
    }
  }
  for(const m of body.matchAll(/(?:src|href)="([^"]+)"/g)){
    const target=m[1];
    if(target.startsWith('https://')||target.startsWith('mailto:'))continue;
    if(!target.startsWith('./')&&!target.startsWith('../')&&!target.startsWith('#'))
      throw Error(page+' contains unsupported local/relative link: '+target);
    if(target.startsWith('#')){if(!keys.has(target.slice(1)))throw Error(page+' dead fragment '+target);checkedLinks++;continue;}
    const url=new URL(target,'https://preview.invalid/degree-rescue/'+page);
    const resolved=join(dist,decodeURIComponent(url.pathname).replace(/^\//,''));
    if(!resolved.startsWith(dist+sep))throw Error(page+' reference leaves preview');
    if(!await isFile(resolved))throw Error(page+' broken local target: '+target);
    checkedLinks++;
  }
}
const scriptRequirements={
  'index.html':['forecast-input','forecast-run','forecast-reset','forecast-result','forecast-summary',
    'ledger-input','ledger-run','ledger-reset','ledger-result','plan-input','plan-run','plan-reset','plan-result'],
  'catalog.html':['wis-file','department','load-wis','export-csv','catalog-status','catalog-rows','catalog-count','course-search'],
  'academic-timeline.html':['profile-campus','profile-major','profile-double','profile-save','profile-clear',
    'focus-status','focus-list','agenda-list','graduation-steps','data-message','data-official','data-demo',
    'timeline-file','template-export','group-filter','agenda-search','include-unknown','audit-transfer'],
};
for(const [page,needed] of Object.entries(scriptRequirements)){
  const contents=await readFile(join(site,page),'utf8');
  const ids=new Set([...contents.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const id of needed)if(!ids.has(id))throw Error(page+' missing script-bound control: '+id);
}
console.log('Static smoke: '+pages.length+' pages, '+found.length+' allowlisted assets, '
  +checkedLinks+' internal links, '+checkedAria+' ARIA references; no CNAME.');
