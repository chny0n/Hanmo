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
 for(const name of ['vsugang','scenario-workshop'])assert.ok(src.includes('./html/'+name+'.html'),name);
 assert.ok(!src.includes('href="./degree-rescue/'), 'no academic UI link to old folder');
});
test('scenario UI preserves explicit opt-in, but technical seed/mode are no longer form fields',()=>{
 const src=fs.readFileSync(path.join(ROOT,'html/scenario-workshop.html'),'utf8');
 assert.match(src,/id="workshop-consent" type="checkbox"/);
 assert.match(src,/type="hidden" id="workshop-mode" value="SELECT"/);
 assert.match(src,/type="hidden" id="workshop-seed" value="2"/);
 assert.doesNotMatch(src,/class="workshop-config"/);
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
 for(const name of ['planner','forecast','catalog','academic-timeline','academic-progress','scenario-workshop','scenario-lab']){
   const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
   assert.match(html,/class="hanmo-schoolmark"/);
 }
});
