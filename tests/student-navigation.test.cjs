'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const student=['planner','forecast','catalog','academic-timeline','academic-progress'];
test('public student pages live under html and never request pasted HTML or JSON',()=>{
 for(const name of student){
   const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
   assert.match(html,/class="hanmo-topbar"/);
   assert.match(html,/src="\.\.\/js\/pc-only\.js"/);
   assert.doesNotMatch(html,/<textarea\b|type=["']file["']/i);
   assert.doesNotMatch(html,/planner-sidebar|class="[^"]*sidebar/i);
 }
});
test('index links directly to all student functions and existing practice routes',()=>{
 const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 for(const name of student)assert.ok(src.includes('./html/'+name+'.html'),name);
 for(const name of ['vsugang'])assert.ok(src.includes('./html/'+name+'.html'),name);
 assert.doesNotMatch(src,/scenario-settings|scenario-workshop|돌발상황 연습/,'no standalone incident link on home');
 assert.ok(!src.includes('scenario-workshop.html'), 'dead standalone page link');
 assert.ok(!src.includes('href="./degree-rescue/'), 'no academic UI link to old folder');
});
test('three independently selected incidents are OFF by default; no standalone or composite UI',()=>{
 const html=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 assert.match(html,/id="scenario-settings"/);
 assert.match(html,/id="incident-practice"/);
 assert.match(html,/id="incident-search"/);
 assert.match(html,/id="incident-404"/);
 assert.equal((html.match(/data-scenario-toggle="/g)||[]).length,3);
 assert.equal((html.match(/data-alt-course="/g)||[]).length,3);
 assert.doesNotMatch(html,/data-scenario-toggle="[^"]+"\s+checked/);
 assert.doesNotMatch(html,/data-scenario-toggle="(?:COMPOSITE|LAST_NONE)"|workshop-preset/);
 assert.equal(fs.existsSync(path.join(ROOT,'html/scenario-workshop.html')),false);
 assert.equal(fs.existsSync(path.join(ROOT,'html/scenario-lab.html')),false);
 for(const page of student){
  const body=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
  assert.ok(!body.includes('vsugang.html#scenario-settings'),page);
 }
});

test('academic public assets are still under html; engine remains independently typechecked',()=>{
 const stage=fs.readFileSync(path.join(ROOT,'scripts/stage-static.mjs'),'utf8');
 assert.ok(stage.includes("join(dist,'data')"));
 assert.ok(!stage.includes("join(dist,'degree-rescue')"));
 assert.ok(stage.includes('student-forecast.js'));
});

test('academic package is flat: no nested source package remains',()=>{
 const root=path.join(ROOT,'degree-rescue');
 assert.equal(fs.existsSync(root),false);
 assert.ok(fs.existsSync(path.join(ROOT,'js','academic','core','forecast','offering.ts')));
 assert.ok(fs.existsSync(path.join(ROOT,'package.json')));
});

test('new views preserve original Hanmo palette, watermark and shared layers',()=>{
 const shared=fs.readFileSync(path.join(ROOT,'css','student-ui.css'),'utf8');
 for(const name of ['hanmo-tokens.css','hanmo-components.css','hanmo-views.css'])
   assert.ok(shared.includes(name),'missing style module: '+name);
 const tokens=fs.readFileSync(path.join(ROOT,'css','hanmo-tokens.css'),'utf8');
 const views=fs.readFileSync(path.join(ROOT,'css','hanmo-views.css'),'utf8');
 assert.ok(tokens.includes('--hm-night:#000e18'));
 assert.ok(views.includes('background.svg'));
 for(const name of student){
   const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
   assert.match(html,/class="hanmo-schoolmark"/);
 }
 const originalMenu=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 assert.match(originalMenu,/class='titleContainer'/);
 assert.match(originalMenu,/id="incident-practice"/);
 assert.match(originalMenu,/href="\.\.\/css\/scenario-settings\.css"/);
});

test('in-page incident workflow keeps default OFF and original practice contracts',()=>{
  const source=fs.readFileSync(path.join(ROOT,'js/scenario-settings.js'),'utf8');
  assert.ok(source.includes('OFF: the untouched legacy route.'));
  assert.ok(source.includes('sessionStorage'),'reload recovery must have short-lived scoped state');
  assert.ok(!source.includes('fetch(')&&!source.includes('XMLHttpRequest('));
});

test('academic entry handoff and three A/B/C plans integrate into existing pages without a sidebar',()=>{
 const planner=fs.readFileSync(path.join(ROOT,'html/planner.html'),'utf8');
 const notices=fs.readFileSync(path.join(ROOT,'html/academic-timeline.html'),'utf8');
 const progress=fs.readFileSync(path.join(ROOT,'html/academic-progress.html'),'utf8');
 for(const id of ['planner-campus','planner-major','planner-double','planner-cohort','planner-go-notices'])
  assert.ok(planner.includes('id="'+id+'"'),id);
 assert.ok(planner.includes('../js/student-entry.js'));
 assert.ok(notices.includes('id="notice-context"'));
 for(const id of ['record-form','record-rows','credit-overview','scenario-choice',
  'plan-form','scenario-comparison','plan-term','plan-course'])
  assert.ok(progress.includes('id="'+id+'"'),id);
 assert.ok(progress.includes('../js/academic-progress.js'));
 assert.ok(progress.includes('../css/academic-progress.css'));
 assert.doesNotMatch(progress,/class="planner-sidebar"|type="file"|<textarea/);
});

test('home is a navigation-only page; the Hanmo brand is the single home link',()=>{
 const home=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 assert.match(home,/<body class="hanmo-ui">/);
 assert.match(home,/<nav class="hanmo-topbar"/);
 assert.match(home,/<a class="hanmo-brand" href="\.\/index\.html" aria-label="한모 홈으로 이동"/);
 assert.doesNotMatch(home,/<main\b|academic-entry|<section\b|<aside\b|<footer\b/);
 assert.doesNotMatch(home,/src=['"]\.\/js\/(?:gnb|index)\.js|ChannelIO|class=['"](?:container|headerNotice|deviceCheck)/);
 assert.doesNotMatch(home,/<a[^>]*>홈<\/a>/);
 const allowed=[
  './html/planner.html','./html/academic-timeline.html','./html/forecast.html',
  './html/catalog.html','./html/academic-progress.html','./html/vsugang.html'
 ];
 const links=[...home.matchAll(/<a[^>]+href="([^"]+)"/g)].map(match=>match[1]);
 assert.deepEqual(links,['./index.html',...allowed]);
 for(const page of student){
  const html=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
  assert.match(html,/<a class="hanmo-brand" href="\.\.\/index\.html" aria-label="한모 홈으로 이동"/,page);
  assert.doesNotMatch(html,/<a href="\.\.\/index\.html">홈<\/a>/,page);
 }
 for(const page of ['vsugang','developer','result']){
  const html=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
  assert.match(html,/<a class="hanmo-brand" href="\.\.\/index\.html" aria-label="한모 홈으로 이동"/,page);
  assert.doesNotMatch(html,/<a href="\.\.\/index\.html">홈<\/a>/,page);
 }
});
