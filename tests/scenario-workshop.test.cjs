'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=require('../js/scenario-workshop.js');

function createDoc() {
  const ids=[
    'workshop-root','workshop-status','workshop-error','workshop-setup','workshop-run',
    'workshop-report','workshop-step-setup','workshop-step-run','workshop-step-review',
    'workshop-form','workshop-mode','workshop-seed','workshop-consent','workshop-start',
    'workshop-stop','workshop-run-heading','workshop-report-heading',
    'workshop-phase','workshop-scene-title','workshop-scene-description',
    'workshop-progress','workshop-queue','workshop-queue-fill',
    'workshop-alternatives','workshop-alternative-details',
    'workshop-actions','workshop-live-steps','workshop-virtual-metrics',
    'workshop-report-type','workshop-report-title','workshop-report-summary',
    'workshop-feedback','workshop-metrics','workshop-replay-timeline',
    'workshop-report-notice','workshop-mistakes','workshop-mistake-list',
    'workshop-retry','workshop-new-seed','workshop-change',
    'workshop-copy','workshop-copy-status',
  ];
  function node(tag='div') {
    const handlers={};
    return {
      tagName:tag.toUpperCase(),textContent:'',value:'',checked:false,hidden:false,
      disabled:false,children:[],style:{},attributes:{},focusCount:0,
      setAttribute(k,v){this.attributes[k]=String(v);},
      removeAttribute(k){delete this.attributes[k];},
      focus(){this.focusCount++;},
      addEventListener(type,fn){handlers[type]=fn;},
      trigger(type){
        assert.equal(typeof handlers[type],'function','missing handler '+type);
        handlers[type]({preventDefault(){}});
      },
      replaceChildren(){this.children=[];},
      append(...children){this.children.push(...children);},
    };
  }
  const nodes=Object.fromEntries(ids.map(id=>[id,node()]));
  const state={preset:'LAST_VALID'};
  nodes['workshop-mode'].value='SELECT';
  nodes['workshop-seed'].value='2';
  return {
    nodes,state,
    doc:{
      getElementById:id=>nodes[id]??null,
      querySelector:selector=>selector==='input[name="workshop-preset"]:checked'?{value:state.preset}:null,
      createElement:tag=>node(tag),
    },
    begin(preset='LAST_VALID',seed='2',consent=true) {
      state.preset=preset;
      nodes['workshop-seed'].value=seed;
      nodes['workshop-consent'].checked=consent;
      nodes['workshop-form'].trigger('submit');
    },
    click(type){
      const action=nodes['workshop-actions'].children.find(n=>n.attributes['data-action']===type);
      assert.ok(action,'expected '+type+' action');
      action.trigger('click');
    },
  };
}
test('catalog, seed and consent inputs are strict; OFF cannot become a silent exercise',()=>{
  const h=createDoc(),lab=ui.mount(h.doc);
  assert.equal(lab.getState(),'OFF');
  assert.equal(h.nodes['workshop-setup'].hidden,false);
  h.begin('LAST_VALID','2',false);
  assert.equal(lab.getState(),'OFF');
  assert.match(h.nodes['workshop-error'].textContent,/동의/);
  h.begin('LAST_VALID','2.4',true);
  assert.equal(lab.getState(),'OFF');
  assert.match(h.nodes['workshop-error'].textContent,/정수/);
  h.begin('LAST_VALID','4294967296',true);
  assert.equal(lab.getState(),'OFF');
  h.begin('LAST_VALID','2',true);
  assert.equal(lab.getState(),'READY');
  assert.equal(h.nodes['workshop-run'].hidden,false);
  assert.equal(h.nodes['workshop-step-run'].attributes['aria-current'],'step');
});
test('student LAST scenario completes using a valid manually chosen synthetic alternative',()=>{
  const h=createDoc(),lab=ui.mount(h.doc);
  h.begin();
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])h.click(type);
  assert.equal(lab.getState(),'SEARCH_ALTERNATIVE');
  assert.equal(h.nodes['workshop-alternatives'].hidden,false);
  assert.match(h.nodes['workshop-alternative-details'].children[0].children[0].textContent,/SYN-ALT-1/);
  h.click('CHOOSE_ALTERNATIVE');
  assert.equal(lab.getState(),'REPLACED');
  assert.equal(h.nodes['workshop-report'].hidden,false);
  assert.equal(lab.getReview().disposition,'OBSERVED_CORRECT');
  assert.equal(h.nodes['workshop-mistakes'].hidden,true);
  assert.ok(h.nodes['workshop-feedback'].children.length>=2);
  assert.equal(h.nodes['workshop-report-heading'].focusCount,1);
  assert.equal(lab.getReview().timeline.length,4);
  const before=lab.getConfiguration().seed;
  h.nodes['workshop-retry'].trigger('click');
  assert.equal(lab.getState(),'READY');
  assert.equal(lab.getConfiguration().seed,before);
  h.nodes['workshop-new-seed'].trigger('click');
  assert.equal(lab.getConfiguration().seed,before+1);
});
test('time conflict cannot be treated as a successful alternative',()=>{
  const h=createDoc(),lab=ui.mount(h.doc);
  h.begin('LAST_CONFLICT');
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])h.click(type);
  h.click('CHOOSE_ALTERNATIVE');
  assert.equal(lab.getState(),'SEARCH_ALTERNATIVE');
  assert.match(h.nodes['workshop-error'].textContent,/제약/);
  h.click('DECLARE_NO_ALTERNATIVE');
  assert.equal(lab.getReview().disposition,'NEEDS_REVIEW');
  assert.equal(h.nodes['workshop-mistakes'].hidden,false);
  assert.equal(h.nodes['workshop-mistake-list'].children.length,1);
  assert.match(h.nodes['workshop-mistake-list'].children[0].textContent,/충족하지 않는/);
  assert.equal(lab.getReview().lastLabel,'유효한 대체과목이 없음을 확인함');
  assert.equal(h.nodes['workshop-error'].textContent,'');
});
test('reconnect UNKNOWN never auto-submits twice and remains distinct from success',()=>{
  const h=createDoc(),lab=ui.mount(h.doc);
  h.begin('RECONNECT','2');
  h.click('SUBMIT');
  h.click('SUBMIT');
  assert.equal(lab.getSummary().duplicateAttempts,1);
  assert.match(h.nodes['workshop-error'].textContent,/중복 신청/);
  h.click('VIRTUAL_DROP');
  assert.equal(h.nodes['workshop-error'].textContent,'');
  h.click('RECONNECT');
  assert.equal(h.nodes['workshop-queue'].hidden,false);
  assert.equal(h.nodes['workshop-queue-fill'].style.width,'45%');
  h.click('QUEUE_FINISHED');
  h.click('VERIFY');
  assert.equal(lab.getState(),'UNKNOWN');
  assert.equal(lab.getReview().disposition,'NEEDS_REVIEW');
  assert.equal(h.nodes['workshop-mistakes'].hidden,false);
  assert.equal(h.nodes['workshop-mistake-list'].children.length,1);
  assert.match(h.nodes['workshop-report-notice'].textContent,/반복하면 안 됩니다/);
});
test('composite UI handles failure, mistaken cancellation, queue and terminal review',()=>{
  const h=createDoc(),lab=ui.mount(h.doc);
  h.begin('COMPOSITE','2');
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES'])h.click(type);
  h.click('CHOOSE_ALTERNATIVE');
  assert.equal(lab.getState(),'SEARCH_ALTERNATIVE');
  h.click('DECLARE_NO_ALTERNATIVE');
  assert.equal(lab.getState(),'CANCEL_CHOICE');
  h.click('MISTAKEN_CANCEL');
  assert.equal(lab.getState(),'READY_RECONNECT');
  h.click('CONTINUE_RECONNECT');
  for(const type of ['SUBMIT','VIRTUAL_DROP','RECONNECT','QUEUE_FINISHED','VERIFY'])h.click(type);
  assert.equal(lab.getSummary().terminalState,'COMPLETED');
  assert.equal(lab.getReview().cancellationMistakes,1);
  assert.equal(lab.getReview().disposition,'NEEDS_REVIEW');
  assert.equal(lab.getReview().timeline.length,11);
  h.nodes['workshop-change'].trigger('click');
  assert.equal(lab.getState(),'OFF');
  assert.equal(h.nodes['workshop-consent'].checked,false);
});
test('copy produces clearly synthetic human-readable review text only on direct click',async()=>{
  let copied='';
  const h=createDoc(),lab=ui.mount(h.doc,{clipboard:{writeText:async value=>{copied=value;}}});
  h.begin('LAST_VALID');
  for(const type of ['CONFIRM_PREVIOUS','ATTEMPT_LAST','OPEN_ALTERNATIVES','CHOOSE_ALTERNATIVE'])
    h.click(type);
  assert.equal(copied,'');
  h.nodes['workshop-copy'].trigger('click');
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.match(copied,/공식 수강신청이 아닙니다/);
  assert.doesNotMatch(copied,/실제 수강신청 완료/);
  assert.equal(lab.getReview().source,'SYNTHETIC');
});
test('five incident presets are integrated inside the existing SETTING page',()=>{
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'html/vsugang.html'),'utf8');
  assert.equal([...html.matchAll(/name="workshop-preset"/g)].length,5);
  assert.equal([...html.matchAll(/data-scenario-toggle="/g)].length,5);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  const known=new Set(ids);
  assert.equal(known.size,ids.length,'duplicate HTML IDs');
  for(const ref of html.matchAll(/\b(?:for|aria-labelledby|aria-describedby)="([^"]+)"/g)){
    for(const id of ref[1].trim().split(/\s+/))assert.ok(known.has(id),'missing accessible target '+id);
  }
  assert.ok(html.indexOf('../js/pc-only.js')<html.indexOf('</head>'));
  for(const script of ['../js/scenario-engine.js','../js/scenario-composite.js',
    '../js/scenario-review.js','../js/scenario-workshop.js','../js/scenario-settings.js'])
    assert.ok(html.includes('src="'+script+'"'));
  assert.ok(html.includes('href="../css/scenario-settings.css"'));
  assert.ok(html.includes('UNMAPPED'));
  assert.ok(html.includes('id="workshop-mistake-list"'));
  assert.ok(html.includes('class="mapping-details"'));
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('role="status"'));
  for(const forbidden of ['../js/selectZone.js','../js/practice.js','../js/result.js',
    'id="json-input"','name="studentId"'])assert.equal(html.includes(forbidden),false);
});

test('workshop controller is stateless outside this page and no raw data persistence/network',()=>{
  const code=fs.readFileSync(path.join(__dirname,'../js/scenario-workshop.js'),'utf8');
  for(const item of ['localStorage.','sessionStorage.','fetch(','XMLHttpRequest(','WebSocket('])
    assert.equal(code.includes(item),false,'browser side effect '+item);
  const h=createDoc(),lab=ui.mount(h.doc);
  assert.equal(lab.getSummary(),null);
  h.begin('RECONNECT','2');
  h.nodes['workshop-stop'].trigger('click');
  assert.equal(lab.getSummary(),null);
  assert.equal(h.nodes['workshop-live-steps'].children.length,0);
});

test('inline scenario assets resolve and old standalone pages are absent',()=>{
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'html/vsugang.html'),'utf8');
  for(const asset of ['scenario-engine.js','scenario-composite.js','scenario-review.js',
    'scenario-workshop.js','scenario-settings.js']){
    const url='../js/'+asset;
    assert.ok(html.includes('src="'+url+'"'));
    assert.ok(fs.statSync(path.resolve(root,'html',url)).isFile(),asset);
  }
  assert.ok(fs.statSync(path.resolve(root,'css/scenario-settings.css')).isFile());
  for(const deleted of ['html/scenario-workshop.html','html/scenario-lab.html',
    'css/scenario-workshop.css','css/scenario-lab.css']){
    assert.equal(fs.existsSync(path.join(root,deleted)),false,deleted+' must not exist');
  }
});
