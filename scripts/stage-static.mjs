import {copyFile,lstat,mkdir,readFile,rm,stat,readdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {assertDisabledPreviewConfig,assertPreviewData,assertSyntheticNetworkProbe,createSyntheticNetworkProbe,stripPreviewPhotoExifAndXmp} from './preview-data.mjs';
import {assertStudentBundleMeta,assertStagedAssets,bundleOutputs,readPublicAssets,rootAssets,siteTarget,canonicalSiteBase} from './student-boundary.mjs';

const root=resolve(import.meta.dirname,'..');
const dist=join(root,'dist');
const build=join(root,'.build');
const exists=async p=>{try{return(await stat(p)).isFile()}catch{return false}};
for(const path of Object.keys(bundleOutputs))
  if(!await exists(join(build,path)))throw Error('Missing generated bundle: '+path);
const config=await readFile(join(root,'data','academic-source-config.json'),'utf8');
const probe=createSyntheticNetworkProbe();
assertDisabledPreviewConfig(config);
assertSyntheticNetworkProbe(probe);
const meta=JSON.parse(await readFile(join(build,'bundle-meta.json'),'utf8'));
assertStudentBundleMeta(meta);
const {outputs}=meta;
const publicAssets=await readPublicAssets(root);
const sourceDomain=(await readFile(join(root,'CNAME'),'utf8')).trim();
if(sourceDomain!==new URL(canonicalSiteBase).host)throw Error('Invalid source CNAME');
for(const path of new Set([...rootAssets,'CNAME',...publicAssets]))
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
const photo=publicAssets.includes(photoPath)?stripPreviewPhotoExifAndXmp(await readFile(join(root,photoPath))):null;
await rm(dist,{recursive:true,force:true});
const assetDirectories=new Set(['css','js',...publicAssets.map(path=>dirname(path))]);
await Promise.all([...assetDirectories].map(path=>mkdir(join(dist,path),{recursive:true})));
await mkdir(join(dist,'data'),{recursive:true});
for(const path of rootAssets){
  if(path==='sitemap.xml'||path==='robots.txt'){
    const source=await readFile(join(root,path),'utf8');
    if(!source.includes(canonicalSiteBase))throw Error('Missing canonical site address in '+path);
    await writeFile(join(dist,path),source.replaceAll(canonicalSiteBase,siteTarget.base));
  }else await copyFile(join(root,path),join(dist,path));
}
await writeFile(join(dist,'THIRD-PARTY-NOTICES.txt'),notices.join('\n\n---\n\n')+'\n');
// 새 파일은 허용 목록에 명시하기 전에는 공개 산출물에 복사되지 않는다.
for(const path of publicAssets){
  const target=join(dist,path);
  if(path===photoPath)await writeFile(target,photo);
  else if(path==='html/pc-only.html'){
    const source=await readFile(join(root,path),'utf8');
    const canonicalHost=new URL(canonicalSiteBase).host;
    const displayUrl=new URL(siteTarget.base);
    const displayHost=displayUrl.host+(displayUrl.pathname==='/'?'':displayUrl.pathname);
    const anchor='<b>'+canonicalHost+'</b>';
    if(!source.includes(anchor))throw Error('PC-only source must display the canonical domain');
    await writeFile(target,source.replace(anchor,'<b>'+displayHost+'</b>'));
  }else await copyFile(join(root,path),target);
}
await writeFile(join(dist,'data','academic-source-config.json'),JSON.stringify({schemaVersion:1,mode:'disabled'},null,2)+'\n');
await writeFile(join(dist,'data','network-probe.txt'),probe);
await assertPreviewData(dist);
for(const [source,target] of Object.entries(bundleOutputs))
  await copyFile(join(build,source),join(dist,target));
await assertStagedAssets(dist,publicAssets);
console.log('Hanmo site staged at dist/ with academic bundles, HTML, CSS and public data.');
