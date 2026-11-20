'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('../js/scenario-settings.js');

function harness(){
  const handlers={},store=new Map([['psubjectValue','3'],['subjectValue','2'],['waitingValue','no']]);
  const tracking={original:[],saves:0,opened:0,resets:0,focused:0};
  const badge=()=>({textContent:'OFF'});
  const toggles=api.PRESETS.map(id=>{
    const b=badge();
    return {id,checked:false,em:b,listeners:{},
      getAttribute:key=>key==='data-scenario-toggle'?id:null,
      closest:()=>({querySelector:()=>b}),
      addEventListener(k,fn){this.listeners[k]=fn;},
      focus(){tracking.focused++},
    };
  });
  const radios=api.PRESETS.map(value=>{
    const label={hidden:false};
    return {value,checked:false,disabled:false,closest:()=>label,label};
  });
  const inputs={'.psugangVal':{value:'3'},'.vsugangVal':{value:'2'},
    'input[name="waitingYN"]:checked':{value:'no'},
    '.printValue':{textContent:'',style:{}},'.setting':{focus(){tracking.focused++}}};
  const nodes={
    'scenario-settings':{},'workshop-root':{
      hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v;},
      removeAttribute(k){delete this.attrs[k];},focus(){tracking.focused++},scrollIntoView(){},
    },
    'workshop-mode':{value:'SELECT'},'workshop-exit':{addEventListener(k,fn){handlers['exit']=fn}},
    'scenario-all-on':{addEventListener(k,fn){handlers['on']=fn}},
    'scenario-all-off':{addEventListener(k,fn){handlers['off']=fn}},
  };
  const host={
    location:{href:null,hash:''},
    localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},
    validSetting:(p,r,w)=>Number.isInteger(p)&&p>=1&&p<=15&&Number.isInteger(r)&&r>=1&&r<=p&&(w==='yes'||w==='no'),
    goPractice(mode){tracking.original.push(mode);this.location.href='practice.html';},
    getSettingValue(){tracking.saves++},
    openSettingPanel(){tracking.opened++},
    HanmoWorkshopSession:{reset(){tracking.resets++}},
    addEventListener(k,fn){handlers[k]=fn},
  };
  const doc={
    getElementById:id=>nodes[id]??null,
    querySelectorAll:q=>q==='[data-scenario-toggle]'?toggles:
      q==='input[name="workshop-preset"]'?radios:[],
    querySelector:q=>inputs[q]||null,
  };
  const mounted=api.mount(doc,host);
  assert.ok(mounted);
  return {api:mounted,doc,host,handlers,toggles,radios,nodes,store,tracking,inputs};
}
test('all five incident toggles initialize OFF, including a new visit',()=>{
  const h=harness();assert.deepEqual(h.api.getEnabled(),[]);
  assert.ok(h.toggles.every(t=>!t.checked&&t.em.textContent==='OFF'));
  h.host.goPractice(1);
  assert.deepEqual(h.tracking.original,[1]);
  assert.equal(h.host.location.href,'practice.html');
  assert.equal(h.nodes['workshop-root'].hidden,true);
  const next=harness();assert.deepEqual(next.api.getEnabled(),[]);
});
test('enabling selected presets starts only inside vsugang, not on a separate page',()=>{
  const h=harness();
  h.toggles[0].checked=true;h.toggles[3].checked=true;
  h.host.getSettingValue();
  assert.deepEqual(h.api.getEnabled(),['LAST_VALID','RECONNECT']);
  assert.equal(h.tracking.saves,1);
  h.host.goPractice(3);
  assert.equal(h.tracking.original.length,0);
  assert.equal(h.host.location.href,null);
  assert.equal(h.store.get('practiceSetter'),'3');
  assert.equal(h.nodes['workshop-root'].hidden,false);
  assert.equal(h.nodes['workshop-mode'].value,'SELECT');
  assert.deepEqual(h.radios.filter(r=>!r.label.hidden).map(r=>r.value),['LAST_VALID','RECONNECT']);
  assert.equal(h.radios.find(r=>r.checked)?.value,'LAST_VALID');
  h.handlers.exit();
  assert.equal(h.nodes['workshop-root'].hidden,true);
});
test('all ON and all OFF actions update choices, OFF restores BASIC/TIME routes',()=>{
  const h=harness();
  h.handlers.on();
  assert.ok(h.toggles.every(t=>t.checked));
  h.host.getSettingValue();assert.equal(h.api.getEnabled().length,5);
  h.host.goPractice(2);assert.equal(h.nodes['workshop-mode'].value,'TIME');
  h.host.openSettingPanel();assert.ok(h.toggles.every(t=>t.checked));
  h.handlers.off();h.host.getSettingValue();
  assert.deepEqual(h.api.getEnabled(),[]);
  h.host.goPractice(2);
  assert.deepEqual(h.tracking.original,[2]);
});
test('invalid course settings reject scenario opt-in, no silent runtime activation',()=>{
  const h=harness();
  h.toggles[3].checked=true;h.inputs['.psugangVal'].value='0';
  h.host.getSettingValue();
  assert.deepEqual(h.api.getEnabled(),[]);
  assert.equal(h.tracking.saves,1);
  h.host.goPractice(1);
  assert.equal(h.tracking.original.length,1);
});
test('deep links open SETTING but never switch any incident ON',()=>{
  const h=harness();
  h.host.location.hash='#scenario-settings';
  h.handlers.hashchange();
  assert.equal(h.tracking.opened,1);
  assert.ok(h.toggles.every(t=>!t.checked));
  assert.deepEqual(api.selected(['RECONNECT','INVALID','RECONNECT','LAST_NONE']),['LAST_NONE','RECONNECT']);
});
