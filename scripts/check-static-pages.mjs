import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';

const here=resolve(import.meta.dirname,'..');
const dist=join(here,'dist');
const studentPages=[
  'html/planner.html','html/academic-timeline.html','html/forecast.html',
  'html/catalog.html','html/academic-progress.html',
];
const htmlRoutes=[
  'index.html',...studentPages,
  'html/vsugang.html','html/practice.html','html/selectZone.html',
  'html/result.html','html/developer.html',
];
const exists=async(path)=>{try{return (await stat(path)).isFile();}catch{return false;}};
const must=async(name)=>{if(!await exists(join(dist,name)))throw Error('Missing staged asset '+name);};
for(const name of [
  'index.html','css/student-ui.css','js/student-forecast.js',
  'js/student-preferences.js','js/student-notices.js','js/student-catalog.js','js/student-progress.js',
  'data/academic-notices-reference.json','html/pc-only.html','js/pc-only.js',
  ...htmlRoutes,
])await must(name);
if(await exists(join(dist,'CNAME')))throw Error('CNAME leaked into fork QA');
if((await readdir(dist)).includes('degree-rescue'))throw Error('Academic student pages must not live under /degree-rescue/');
let linkCount=0,ariaCount=0;
for(const page of htmlRoutes){
  const body=await readFile(join(dist,page),'utf8');
  const pc=page==='index.html'?'./js/pc-only.js':'../js/pc-only.js';
  const guard=body.indexOf('<script src="'+pc+'"></script>');
  if(guard<0||guard>body.indexOf('</head>'))throw Error('PC-only guard missing or async: '+page);
}
for(const page of studentPages){
  const body=await readFile(join(dist,page),'utf8');
  if(/<textarea\b|<input\b[^>]*type=["']file["']/i.test(body))
    throw Error('A student page still requires raw HTML/JSON input: '+page);
  if(/planner-sidebar|<aside\s+class=["'].*sidebar/i.test(body))
    throw Error('Left sidebar is forbidden on '+page);
  if(!body.includes('class="hanmo-topbar"'))throw Error('Missing top menu: '+page);
  const ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  const set=new Set(ids);
  if(set.size!==ids.length)throw Error('Duplicate DOM id: '+page);
  for(const [,references] of body.matchAll(/aria-(?:labelledby|describedby)="([^"]+)"/g)){
    for(const id of references.trim().split(/\s+/)){
      if(!set.has(id))throw Error('Broken ARIA ref '+page+' #'+id);
      ariaCount++;
    }
  }
  for(const [,target] of body.matchAll(/(?:src|href)="([^"]+)"/g)){
    if(/^(?:https?:|mailto:|tel:|data:)/i.test(target))continue;
    if(target.startsWith('#')){
      if(!set.has(target.slice(1)))throw Error('Dead fragment: '+page+' '+target);
      linkCount++;continue;
    }
    if(!/^\.?\.\//.test(target))throw Error('Unsupported student-relative URL: '+page+' '+target);
    const url=new URL(target,'https://preview.invalid/'+page);
    if(url.origin!=='https://preview.invalid')throw Error('Link leaves QA');
    const resolved=resolve(dist,decodeURIComponent(url.pathname).replace(/^\//,''));
    if(!resolved.startsWith(dist+sep)||!await exists(resolved))
      throw Error('Broken student link: '+page+' '+target);
    linkCount++;
  }
}
const root=await readFile(join(dist,'index.html'),'utf8');
for(const path of studentPages){
  if(!root.includes('./'+path))throw Error('Root main menu does not link to '+path);
}
if(!root.includes('./html/vsugang.html'))
  throw Error('Root main menu missing exercise navigation');
const menu=await readFile(join(dist,'html/vsugang.html'),'utf8');
for(const id of ['scenario-settings','incident-practice','incident-search',
 'incident-candidates','incident-404','incident-404-refresh','incident-404-back']){
 if(!menu.includes('id="'+id+'"'))throw Error('Missing in-menu incident UI: '+id);
}
for(const file of ['js/incident-courses.js','js/scenario-settings.js','css/scenario-settings.css'])
  await must(file);
if((menu.match(/data-scenario-toggle=/g)||[]).length!==4)
  throw Error('Four independently selected OFF-by-default incident toggles required');
if((menu.match(/data-alt-course=/g)||[]).length!==3)
  throw Error('Three numbered substitute courses required');
if(menu.includes('data-scenario-toggle="COMPOSITE"'))
  throw Error('Composite switch must not exist');
for(const page of [root]){
 // Landing must not advertise a standalone incident exercise.
 if(page.includes('scenario-workshop.html')||page.includes('vsugang.html#scenario-settings'))
   throw Error('Standalone incident link remains on landing');
}
for(const oldPage of ['html/scenario-workshop.html','html/scenario-lab.html'])
  if(await exists(join(dist,oldPage)))throw Error('Standalone synthetic page remains: '+oldPage);
for(const p of htmlRoutes){
  const html=await readFile(join(dist,p),'utf8');
  if(/(?:href|src)=["'][^"']*scenario-(?:workshop|lab)\.html/i.test(html))
    throw Error('Dead standalone scenario link from '+p);
}
console.log('Student preview smoke: '+studentPages.length+' student pages, '+
  linkCount+' links, '+ariaCount+' ARIA references; four independent incidents are OFF-by-default settings within vsugang.html.');
