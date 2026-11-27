import assert from 'node:assert/strict';
import {execFile,spawn} from 'node:child_process';
import {once} from 'node:events';
import {cp,mkdir,mkdtemp,readFile,rename,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {test} from 'node:test';
import {promisify} from 'node:util';
import {assertPreviewData,stripPreviewPhotoExifAndXmp} from '../scripts/preview-data.mjs';

import {assertStagedAssets,readPublicAssets,resolveSiteTarget,canonicalSiteBase,previewSiteBase,siteTarget} from '../scripts/student-boundary.mjs';

const root=resolve(import.meta.dirname,'..');
const run=promisify(execFile);

test('정적 미리보기 재배포가 철회된 합성 스냅샷의 직접 URL을 제거한다',async t=>{
  const workspace=await mkdtemp(join(tmpdir(),'hanmo-withdrawal-'));
  /** @type {import('node:child_process').ChildProcess|undefined} */
  let server;
  t.after(async()=>{
    if(server&&server.exitCode===null&&server.signalCode===null){
      const stopped=once(server,'exit');
      server.kill();
      await stopped;
    }
    await rm(workspace,{recursive:true,force:true});
  });
  await Promise.all([
    ...['.build','css','dist','html','img','js','LICENSE','index.html','sitemap.xml','robots.txt','CNAME'].map(path=>
      cp(join(root,path),join(workspace,path),{recursive:true})),
    symlink(join(root,'node_modules'),join(workspace,'node_modules'),'junction'),
    mkdir(join(workspace,'scripts')),
    mkdir(join(workspace,'data')),
  ]);
  await Promise.all([
    ...['preview-data.mjs','stage-static.mjs','serve-static.mjs','student-boundary.mjs','public-assets.json'].map(name=>
      cp(join(root,'scripts',name),join(workspace,'scripts',name))),
    cp(join(root,'data','academic-source-config.json'),join(workspace,'data','academic-source-config.json')),
  ]);

  const dist=join(workspace,'dist');
  const obsolete='withdrawn-synthetic-snapshot.json';
  const obsoleteBody={synthetic:true,release:'withdrawal-drill'};
  await writeFile(join(dist,'data',obsolete),JSON.stringify(obsoleteBody));
  await writeFile(join(workspace,'data',obsolete),JSON.stringify(obsoleteBody));
  await assert.rejects(assertPreviewData(dist),/미승인 자료 파일/);
  const approvedAssets=await readPublicAssets(workspace);
  await assert.rejects(assertStagedAssets(dist,approvedAssets),/Unexpected staged asset data\//);

  const startup=AbortSignal.timeout(5000);
  server=spawn(process.execPath,['scripts/serve-static.mjs'],{
    cwd:workspace,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit'],windowsHide:true,
  });
  const started=Promise.race([
    once(server.stdout,'data',{signal:startup}).then(([data])=>String(data)),
    once(server,'exit',{signal:startup}).then(([code])=>{throw Error('미리보기 서버 시작 실패: '+code);}),
  ]);
  const base=(await started).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(base);
  const staleUrl=base+'/data/'+obsolete;
  const stale=await fetch(staleUrl);
  assert.equal(stale.status,200);
  assert.deepEqual(await stale.json(),obsoleteBody);

  const stage=(target=siteTarget.name)=>run(process.execPath,['scripts/stage-static.mjs'],{cwd:workspace,env:{...process.env,HANMO_SITE_TARGET:target},timeout:15000});
  await writeFile(join(workspace,'js','unapproved-research.js'),'console.log("synthetic");');
  const originalPhoto=await readFile(join(workspace,'img','developer.jpg'));
  await stage();
  await assertStagedAssets(dist,approvedAssets);
  // 두 산출물의 주소와 CNAME을 실제 임시 빌드로 교차 검증합니다.
  for(const [name,siteBase] of [['production',canonicalSiteBase],['preview',previewSiteBase]]){
    await stage(name);
    const staged=await assertStagedAssets(dist,approvedAssets,resolveSiteTarget(name));
    assert.equal(staged.has('CNAME'),name==='production');
    assert.match(await readFile(join(dist,'robots.txt'),'utf8'),new RegExp('Sitemap: '+siteBase.replaceAll('.','\\.')+'sitemap\\.xml'));
    assert.ok((await readFile(join(dist,'sitemap.xml'),'utf8')).includes('<loc>'+siteBase+'</loc>'));
    if(name==='production')assert.equal((await readFile(join(dist,'CNAME'),'utf8')).trim(),'tofuhanmo.com');
    else assert.equal((await fetch(base+'/CNAME')).status,404);
  }
  await stage();
  await assertStagedAssets(dist,approvedAssets);
  const retired=join(dist,'js','unapproved-research.js');
  await writeFile(retired,'console.log("synthetic");');
  await assert.rejects(assertStagedAssets(dist,approvedAssets),/Unexpected staged asset js\/unapproved-research\.js/);
  await rm(retired);
  const essential=join(dist,'js','strategy-worker.mjs');
  const stashed=join(workspace,'strategy-worker.mjs');
  await rename(essential,stashed);
  await assert.rejects(assertStagedAssets(dist,approvedAssets),/Missing staged asset js\/strategy-worker\.mjs/);
  await rename(stashed,essential);
  const publicPhoto=await fetch(base+'/img/developer.jpg');
  assert.equal(publicPhoto.status,200);
  assert.deepEqual(Buffer.from(await publicPhoto.arrayBuffer()),stripPreviewPhotoExifAndXmp(originalPhoto));
  const photoHead=await fetch(base+'/img/developer.jpg',{method:'HEAD'});
  assert.equal(photoHead.status,publicPhoto.status);
  for(const header of ['content-type','cache-control'])
    assert.equal(photoHead.headers.get(header),publicPhoto.headers.get(header));
  assert.equal((await photoHead.arrayBuffer()).byteLength,0);
  assert.deepEqual(await readFile(join(workspace,'img','developer.jpg')),originalPhoto);
  assert.equal((await fetch(base+'/js/unapproved-research.js')).status,404);
  assert.deepEqual(JSON.parse(await readFile(join(workspace,'data',obsolete),'utf8')),obsoleteBody);
  await assertPreviewData(dist);
  const priorConfig=join(workspace,'data','academic-source-config.json');
  await writeFile(priorConfig,JSON.stringify({schemaVersion:1,mode:'supabase'}));
  await assert.rejects(stage(),/비활성 학사자료 설정만 허용/);
  await writeFile(priorConfig,JSON.stringify({schemaVersion:1,mode:'disabled'}));
  const publicManifest=join(workspace,'scripts','public-assets.json');
  const assets=JSON.parse(await readFile(publicManifest,'utf8'));
  await writeFile(publicManifest,JSON.stringify(assets.filter(path=>path!=='html/vsugang.html')));
  await assert.rejects(stage(),/Missing public student asset html\/vsugang\.html/);
  await writeFile(publicManifest,JSON.stringify([...assets,'html/scenario-workshop.html']));
  await assert.rejects(stage(),/Disallowed web artifact: html\/scenario-workshop\.html/);
  await assertPreviewData(dist);
  for(const url of [staleUrl,staleUrl+'?previous=1']){
    const response=await fetch(url);
    assert.equal(response.status,404,url);
    await response.text();
  }
  assert.equal((await fetch(staleUrl,{method:'HEAD'})).status,404);
  const config=await fetch(base+'/data/academic-source-config.json');
  assert.equal(config.headers.get('cache-control'),'no-store');
  assert.deepEqual(await config.json(),{schemaVersion:1,mode:'disabled'});
  const practice=await fetch(base+'/html/vsugang.html');
  assert.equal(practice.status,200);
  assert.match(await practice.text(),/BASIC MODE/);
});
