'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const logic=require('../js/incident-courses.js');
const ui=require('../js/scenario-settings.js');
function node(attrs={}){
 const events={};return {checked:false,hidden:false,disabled:false,value:'',textContent:'',dataset:{},style:{},attrs,
  setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},getAttribute(k){return this.attrs[k];},
  addEventListener(type,fn){events[type]=fn;},fire(type){assert.ok(events[type],type);events[type]({preventDefault(){}});},
  focus(){},scrollIntoView(){},closest(){return {querySelector:()=>this.badge}},
 };
}
function harness(resume=null,navType='navigate'){
 const store=new Map([['psubjectValue','3'],['subjectValue','2'],['waitingValue','no']]);
 const cache=new Map(resume||[]),timers=[];const listeners={};
 const ids={};for(const name of ['scenario-settings','incident-practice','incident-feedback','incident-base','incident-candidates',
  'incident-search','incident-status','incident-mode','incident-404','incident-exit','incident-404-refresh','incident-404-back',
  'scenario-all-on','scenario-all-off'])ids[name]=node();
 ids['incident-practice'].hidden=true;ids['incident-candidates'].hidden=true;ids['incident-404'].hidden=true;
 const toggles=logic.OPTIONS.map(id=>{let n=node({'data-scenario-toggle':id});n.badge={textContent:'OFF'};return n});
 const bases=logic.IDS.map(id=>node({'data-base-course':String(id)}));
 const alts=logic.IDS.map(id=>node({'data-alt-course':String(id)}));
 const form={'.printValue':node(),'.psugangVal':node(),'.vsugangVal':node(),
  'input[name="waitingYN"]:checked':node(),'.setting':node()};
 form['.psugangVal'].value='3';form['.vsugangVal'].value='2';form['input[name="waitingYN"]:checked'].value='no';
 const doc={getElementById:id=>ids[id]??null,
  querySelectorAll:q=>({'[data-scenario-toggle]':toggles,'[data-base-course]':bases,'[data-alt-course]':alts}[q]||[]),
  querySelector:q=>form[q]||null};
 const host={localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},
  sessionStorage:{getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)},
  Date:{now:()=>100000000},Math:{random:()=>0.5},
  setTimeout:(fn,ms)=>{let id=timers.length;timers.push({fn,ms,active:true});return id;},
  clearTimeout:id=>{if(timers[id])timers[id].active=false;},
  history:{pushState(){},back(){listeners.popstate?.();}},location:{href:'http://mock/html/vsugang.html',hash:'',reload(){host.reloads++}},reloads:0,
  performance:{getEntriesByType:()=>[{type:navType}]},
  addEventListener:(type,fn)=>{listeners[type]=fn},
  validSetting:(p,r,w)=>Number.isInteger(p)&&p>=1&&p<=15&&Number.isInteger(r)&&r>=1&&r<=p&&(w==='no'||w==='yes'),
  goPractice(mode){host.lastOriginal=mode;host.location.href='practice.html';},
  getSettingValue(){host.saves=(host.saves||0)+1;store.set('psubjectValue',form['.psugangVal'].value);store.set('subjectValue',form['.vsugangVal'].value);store.set('waitingValue',form['input[name="waitingYN"]:checked'].value);},
  openSettingPanel(){host.opens=(host.opens||0)+1},
 };
 const app=ui.mount(doc,host);assert.ok(app);
 return {app,host,doc,ids,toggles,bases,alts,store,cache,timers,listeners,form};
}
test('three same-number candidate conflicts and other numbers are accepted',()=>{
 assert.deepEqual(logic.initialCourses(['LAST_CONFLICT']),[1,2]);
 assert.equal(logic.choose([1,2],1).ok,false);
 assert.equal(logic.choose([1,2],2).ok,false);
 assert.equal(logic.choose([1,2],3).ok,true);
 assert.equal(logic.noAlternative([1,2,3]),true);
 assert.equal(logic.noAlternative([1,2]),false);
 assert.deepEqual(logic.initialCourses(['LAST_VALID','LAST_CONFLICT']),[1,2]);
 assert.deepEqual(logic.enabled(['LAST_NONE']),[],'removed setting must not re-enable an old scenario');
 for(const n of [1,2,3])assert.equal(logic.choose([1,2,3],n).ok,false);
 assert.throws(()=>logic.choose([1,2,3],4),/1~3/);
 assert.equal(logic.delayMs(0),0);assert.equal(logic.delayMs(1),6000);
});
test('three independent OFF toggles do not alter original route',()=>{
 const h=harness();assert.deepEqual(h.app.getEnabled(),[]);
 h.host.goPractice(2);assert.equal(h.host.lastOriginal,2);
 assert.equal(h.ids['incident-practice'].hidden,true);
 assert.equal(logic.OPTIONS.includes('COMPOSITE'),false);
});
test('combined selected toggles, mandatory search, and candidate click flow',()=>{
 const h=harness();h.toggles[1].checked=true;h.toggles[2].checked=true;
 h.host.getSettingValue();assert.deepEqual(h.app.getEnabled(),['LAST_CONFLICT','RECONNECT']);
 h.host.goPractice(3);assert.equal(h.ids['incident-practice'].hidden,false);
 assert.equal(h.ids['incident-candidates'].hidden,true);
 assert.deepEqual(h.app.getBase(),[1,2]);
 h.ids['incident-search'].fire('click');
 assert.equal(h.ids['incident-candidates'].hidden,false);
 h.alts[0].fire('click');assert.match(h.ids['incident-feedback'].textContent,/겹쳐/);
 h.alts[2].fire('click');assert.match(h.ids['incident-feedback'].textContent,/가능/);
 assert.deepEqual(h.app.getBase(),[1,2,3]);
 assert.equal(h.timers.at(-1).ms,3000);
 h.timers.at(-1).fn();assert.equal(h.app.is404(),true);
 h.ids['incident-404-back'].fire('click');assert.equal(h.app.is404(),false);
 h.ids['incident-exit'].fire('click');assert.equal(h.ids['incident-practice'].hidden,true);
 assert.equal(h.cache.size,0);
});
test('all three selected courses naturally conflict without a dedicated scenario option',()=>{
 const h=harness();h.toggles[1].checked=true;h.host.getSettingValue();
 h.host.goPractice(1);
 assert.deepEqual(h.app.getBase(),[1,2]);
 h.bases[2].checked=true;h.bases[2].fire('change');
 assert.deepEqual(h.app.getBase(),[1,2,3]);h.ids['incident-search'].fire('click');
 assert.match(h.ids['incident-status'].textContent,/모든 대체과목의 시간이 겹칩니다/);
 for(const alt of h.alts){alt.fire('click');assert.match(h.ids['incident-feedback'].textContent,/수강신청이 불가/);}
 h.bases[2].checked=false;h.bases[2].fire('change');
 assert.equal(h.ids['incident-candidates'].hidden,true,'new search required after changing base');
 h.ids['incident-search'].fire('click');h.alts[2].fire('click');
 assert.match(h.ids['incident-feedback'].textContent,/수강신청이 가능/);
});
test('404 refresh resumes, does not replay 404, and a new navigation remains OFF',()=>{
 const h=harness();h.toggles[2].checked=true;h.host.getSettingValue();h.host.goPractice(1);
 h.timers.at(-1).fn();assert.equal(h.app.is404(),true);
 h.ids['incident-404-refresh'].fire('click');assert.equal(h.host.reloads,1);
 const reloaded=harness(h.cache,'reload');
 assert.deepEqual(reloaded.app.getEnabled(),['RECONNECT']);
 assert.equal(reloaded.ids['incident-practice'].hidden,false);
 assert.equal(reloaded.app.is404(),false);
 const newNavigation=harness(h.cache,'navigate');
 assert.deepEqual(newNavigation.app.getEnabled(),[]);
 assert.equal(newNavigation.ids['incident-practice'].hidden,true);
});
test('settings changes require confirmed valid course numbers',()=>{
 const h=harness();h.toggles[1].checked=true;h.form['.psugangVal'].value='0';
 h.host.getSettingValue();assert.deepEqual(h.app.getEnabled(),[]);
 h.host.goPractice(2);assert.equal(h.host.lastOriginal,2);
});
