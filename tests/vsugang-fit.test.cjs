'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/vsugang-fit.js'),'utf8');
function harness({height=800,width=1400,h=690,w=1000,barY=78,ad=0}={}){
 const vars={},cssvars={},events={},queue=[],observed=[],cls=new Set();
 const footer={getBoundingClientRect:()=>({height:ad})};
 const landing={scrollHeight:h,offsetHeight:h,scrollWidth:w,offsetWidth:w,
   style:{setProperty:(k,v)=>cssvars[k]=v}};
 const main={clientHeight:height,clientWidth:width,
   querySelector:k=>k==='.f-dirt-down'?landing:k==='.f-dirt-up'?footer:null};
 const bar={getBoundingClientRect:()=>({bottom:barY})};
 const body={style:{setProperty:(k,v)=>vars[k]=v},
   classList:{toggle:(k,v)=>v?cls.add(k):cls.delete(k)},
   querySelector:k=>k==='.hanmo-topbar'?bar:k==='main'?main:null};
 const context={document:{readyState:'complete',querySelector:k=>k==='body.hanmo-vsugang'?body:null,
   fonts:{ready:Promise.resolve()}},window:{
   getComputedStyle:()=>({paddingTop:'10px',paddingBottom:'10px',paddingLeft:'16px',paddingRight:'16px'}),
   requestAnimationFrame:fn=>{queue.push(fn);return queue.length},
   addEventListener:(name,fn)=>events[name]=fn},
   ResizeObserver:class{observe(el){observed.push(el)}}
 };
 vm.runInNewContext(source,context,{filename:'vsugang-fit.js'});
 const flush=()=>{const fn=queue.shift();assert.ok(fn);fn();};
 flush();
 return {vars,cssvars,events,queue,observed,cls,main,bar,landing,footer,flush};
}
test('normal monitor fits all mode tiles without scrolling document',()=>{
 const x=harness({height:910,width:1440,h:700,w:1200,barY:95});
 assert.equal(Number(x.cssvars['--vsugang-fit-scale']),1);
 assert.equal(x.vars['--vsugang-topbar-bottom'],'95px');
 assert.equal(x.cls.has('vsugang-compact-scroll'),false);
 assert.equal(x.observed.length,4);
});
test('720px-height desktop menu scales proportionally beneath nav',()=>{
 const x=harness({height:605,width:1280,h:750,w:1000,barY:105});
 const scale=Number(x.cssvars['--vsugang-fit-scale']);
 assert.ok(scale<1&&scale>=0.65);
 assert.ok(scale*750<=605-20-12);
 assert.equal(x.cls.has('vsugang-compact-scroll'),false);
});
test('at high zoom only main gets scrollable and nav stays visible',()=>{
 const x=harness({height:300,width:650,h:750,w:1200,barY:190});
 assert.equal(x.cls.has('vsugang-compact-scroll'),true);
 assert.equal(x.cssvars['--vsugang-fit-scale'],'1');
 assert.equal(x.vars['--vsugang-topbar-bottom'],'190px');
});
test('resize and ad height remeasure fit and preserve navigation offset',()=>{
 const x=harness({height:900,width:1400,h:700,w:1100});
 x.footer.getBoundingClientRect=()=>({height:240});
 x.events.resize();x.flush();
 assert.equal(x.vars['--vsugang-footer-height'],'240px');
 assert.ok(Number(x.cssvars['--vsugang-fit-scale'])<1);
 x.main.clientHeight=310;
 x.events.pageshow();x.flush();
 assert.equal(x.cls.has('vsugang-compact-scroll'),true);
});

const menuSource=fs.readFileSync(path.join(__dirname,'../js/vsugang.js'),'utf8');
const menuStyles=fs.readFileSync(path.join(__dirname,'../css/vsugang-fit.css'),'utf8');

function menuSettingHarness(){
  const stored=new Map();
  const parts={
    printValue:{innerText:'',style:{}},
    setting:{style:{}},
    settingSection:{style:{}},
    psugangVal:{value:''},
    vsugangVal:{value:''}
  };
  const incident={style:{}};
  const document={
    getElementsByClassName(name){return parts[name]?[parts[name]]:[];},
    querySelector(selector){
      if(selector==='#incident-options')return incident;
      if(selector==='input[name="waitingYN"]:checked')return {value:'no'};
      return null;
    }
  };
  const localStorage={
    getItem(key){return stored.get(key)??null;},
    setItem(key,value){stored.set(key,String(value));},
    removeItem(key){stored.delete(key);}
  };
  const context={document,localStorage,alert(){},location:{href:''}};
  vm.runInNewContext(menuSource,context,{filename:'vsugang.js'});
  return {stored,parts,incident,context};
}

test('필수 설정 미완료일 때 SETTING만 붉고 선택형 돌발상황은 남색 기본값을 유지한다',()=>{
  const x=menuSettingHarness();
  assert.equal(x.parts.setting.style.background,'#120000');
  assert.equal(x.incident.style.background,undefined);
  assert.match(menuStyles,
    /body\.hanmo-vsugang \.grid > :is\(\.setting,#incident-options\)\{[^}]*background:#06111c/);
});

test('설정 유효성 변경은 선택형 돌발상황 타일 색상을 바꾸지 않는다',()=>{
  const x=menuSettingHarness();
  x.stored.set('psubjectValue','5');
  x.stored.set('subjectValue','2');
  x.stored.set('waitingValue','no');
  x.context.setValue();
  assert.equal(x.parts.setting.style.background,'#001203');
  assert.equal(x.incident.style.background,undefined);
  x.stored.delete('waitingValue');
  x.context.setValue();
  assert.equal(x.parts.setting.style.background,'#120000');
  assert.equal(x.incident.style.background,undefined);
});
