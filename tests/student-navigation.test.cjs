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
 const stage=fs.readFileSync(path.join(ROOT,'degree-rescue/scripts/stage-static.mjs'),'utf8');
 assert.ok(stage.includes("join(dist,'data')"));
 assert.ok(!stage.includes("join(dist,'degree-rescue')"));
 assert.ok(stage.includes('student-forecast.js'));
});
