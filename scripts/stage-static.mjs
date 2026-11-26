import {copyFile,lstat,mkdir,readFile,rm,stat,readdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {assertDisabledPreviewConfig,assertPreviewData,assertSyntheticNetworkProbe,stripPreviewPhotoExif} from './preview-data.mjs';
import {assertStudentBundleMeta,readPublicAssets} from './student-boundary.mjs';

const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const build=join(root,'.build');
const bundles=['student-entry.js','academic-calendar.js'];
const rootAssets=['index.html','sitemap.xml','LICENSE'];
const exists=async p=>{try{return(await stat(p)).isFile()}catch{return false}};
for(const bundle of bundles)
  if(!await exists(join(build,bundle)))throw Error('Missing generated academic JS bundle: '+bundle);
if(!await exists(join(build,'academic-calendar.css')))throw Error('Missing FullCalendar CSS bundle');
const config=await readFile(join(root,'data','academic-source-config.json'),'utf8');
const probe=await readFile(join(root,'data','network-probe.txt'),'utf8');
assertDisabledPreviewConfig(config);
assertSyntheticNetworkProbe(probe);
const meta=JSON.parse(await readFile(join(build,'bundle-meta.json'),'utf8'));
assertStudentBundleMeta(meta);
const {outputs}=meta;
const publicAssets=await readPublicAssets(root);
const assetPaths=new Set(publicAssets);
// 허용 목록 오류는 기존 공개 산출물을 지우기 전에 검사합니다.
for(const required of [
  'html/planner.html','html/forecast.html','html/catalog.html','html/readiness.html',
  'html/reaction-test.html','html/strategy-lab.html','html/academic-timeline.html','html/vsugang.html',
  'css/hanmo-labs.css','css/academic-unified.css','js/academic-unified.js','js/readiness.mjs',
  'js/strategy-page.mjs','js/strategy-recommendation.mjs','js/reaction-page.mjs','js/reaction-profile.mjs',
])if(!assetPaths.has(required))throw Error('Missing public student asset '+required);
for(const banned of ['html/academic-progress.html','html/academic-faq.html','css/academic-progress.css',
  'css/academic-faq.css','js/academic-faq.js','js/degree-preparation.js','js/student-forecast.js',
  'js/strategy-engine.mjs','js/strategy-worker.mjs','img/hufs_logo.png','html/scenario-workshop.html','html/scenario-lab.html',
])if(assetPaths.has(banned))throw Error('Disallowed web artifact: '+banned);
if(await exists(join(root,'degree-rescue','package.json')))throw Error('Old nested package remains in repo');
for(const path of [...rootAssets,...publicAssets])
  if(!(await lstat(join(root,path))).isFile())throw Error('정적 공개 파일이 일반 파일이 아닙니다: '+path);
const bundledPackages=new Set();
for(const output of Object.values(outputs)){
  for(const [path,{bytesInOutput}] of Object.entries(output.inputs)){
    const name=path.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)\//)?.[1];
    if(name&&bytesInOutput>0)bundledPackages.add(name);
  }
}
const notices=[];
for(const name of [...bundledPackages].sort()){
  const directory=join(root,'node_modules',name);
  const license=(await readdir(directory)).find(file=>/^LICENSE(?:\.md|\.txt)?$/i.test(file));
  if(!license)throw new Error('번들 라이선스 파일이 없습니다: '+name);
  const {version}=JSON.parse(await readFile(join(directory,'package.json'),'utf8'));
  notices.push(name+' '+version+'\n\n'+(await readFile(join(directory,license),'utf8')).trim());
}
if(!notices.length)throw new Error('번들 라이선스 목록이 비어 있습니다.');
const photoPath='img/developer.jpg';
const photo=assetPaths.has(photoPath)?stripPreviewPhotoExif(await readFile(join(root,photoPath))):null;
await rm(dist,{recursive:true,force:true});
const assetDirectories=new Set(['css','js',...publicAssets.map(path=>dirname(path))]);
await Promise.all([...assetDirectories].map(path=>mkdir(join(dist,path),{recursive:true})));
await mkdir(join(dist,'data'),{recursive:true});
for(const path of rootAssets)await copyFile(join(root,path),join(dist,path));
await writeFile(join(dist,'THIRD-PARTY-NOTICES.txt'),notices.join('\n\n---\n\n')+'\n');
// 새 파일은 허용 목록에 명시하기 전에는 공개 산출물에 복사되지 않는다.
for(const path of publicAssets){
  const target=join(dist,path);
  if(path===photoPath)await writeFile(target,photo);
  else await copyFile(join(root,path),target);
}
await copyFile(join(build,'academic-calendar.css'),join(dist,'css','academic-calendar-vendor.css'));
await writeFile(join(dist,'data','academic-source-config.json'),JSON.stringify({schemaVersion:1,mode:'disabled'},null,2)+'\n');
await writeFile(join(dist,'data','network-probe.txt'),probe);
await assertPreviewData(dist);
for(const bundle of bundles)
  await copyFile(join(build,bundle),join(dist,'js',bundle));
console.log('Hanmo site staged at dist/ with academic bundles, HTML, CSS and public data.');
