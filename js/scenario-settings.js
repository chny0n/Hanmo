/* Optional synthetic incident settings on vsugang.html.
 * No persistence of ON settings; original BASIC/TIME/SELECT pages and their scripts remain untouched.
 * OFF => original goPractice route is used unchanged.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else{root.HanmoScenarioSettings=api;if(root.document)api.mount(root.document,root);}
})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const PRESETS=Object.freeze(['LAST_VALID','LAST_CONFLICT','LAST_NONE','RECONNECT','COMPOSITE']);
const MODES=Object.freeze({1:'BASIC',2:'TIME',3:'SELECT'});
function selected(values){
  if(!Array.isArray(values))return [];
  return PRESETS.filter(id=>values.includes(id));
}
function mount(doc,host){
  const panel=doc.getElementById('scenario-settings');
  const workspace=doc.getElementById('workshop-root');
  const toggles=Array.from(doc.querySelectorAll('[data-scenario-toggle]'));
  const radios=Array.from(doc.querySelectorAll('input[name="workshop-preset"]'));
  const original=host.goPractice,save=host.getSettingValue,open=host.openSettingPanel;
  const close=doc.getElementById('workshop-exit');
  if(!panel||!workspace||toggles.length!==5||radios.length!==5||
      typeof original!=='function'||typeof save!=='function'||typeof open!=='function')
    return null;
  let enabled=[];
  const getChecks=()=>toggles.filter(x=>x.checked).map(x=>x.getAttribute('data-scenario-toggle'));
  const refresh=()=>{
    for(const toggle of toggles){
      const badge=toggle.closest('label')?.querySelector('em');
      if(badge)badge.textContent=toggle.checked?'ON':'OFF';
    }
  };
  const summary=()=>{
    const out=doc.querySelector('.printValue');
    if(out&&typeof host.validSetting==='function'){
      const ok=host.validSetting(Number(host.localStorage?.getItem('psubjectValue')),
        Number(host.localStorage?.getItem('subjectValue')),
        host.localStorage?.getItem('waitingValue'));
      if(ok){
        out.textContent=enabled.length
          ?'과목 설정 완료 · 가상 상황 '+enabled.length+'종 ON'
          :'과목 설정 완료 · 돌발상황 모두 OFF';
        out.style.color=enabled.length?'#f4c76c':'white';
      }
    }
  };
  const resetWorkspace=()=>{
    if(host.HanmoWorkshopSession)host.HanmoWorkshopSession.reset();
    workspace.hidden=true;
    workspace.setAttribute('aria-hidden','true');
  };
  const run=(mode)=>{
    const active=selected(enabled);
    if(!active.length)return original(mode); // Zero overhead, original behavior exactly.
    const pre=Number(host.localStorage?.getItem('psubjectValue'));
    const req=Number(host.localStorage?.getItem('subjectValue'));
    const waiting=host.localStorage?.getItem('waitingValue');
    if(!(MODES[mode]&&host.validSetting(pre,req,waiting)))return original(mode);
    const ui=host.HanmoWorkshopSession;
    if(!ui)return original(mode); // Missing synthetic code must never break original mode.
    host.localStorage.setItem('practiceSetter',mode);
    ui.reset();
    for(const radio of radios){
      const visible=active.includes(radio.value);
      const label=radio.closest('label');
      if(label)label.hidden=!visible;
      radio.checked=false;
      radio.disabled=!visible;
    }
    const first=radios.find(r=>active.includes(r.value));
    if(first)first.checked=true;
    const modeField=doc.getElementById('workshop-mode');
    if(modeField)modeField.value=MODES[mode];
    resetWorkspace();
    workspace.hidden=false;
    workspace.removeAttribute('aria-hidden');
    workspace.focus();
    if(typeof workspace.scrollIntoView==='function')workspace.scrollIntoView({block:'start'});
    return undefined;
  };
  host.goPractice=run;
  host.getSettingValue=function(){
    const pre=Number(doc.querySelector('.psugangVal')?.value);
    const req=Number(doc.querySelector('.vsugangVal')?.value);
    const waiting=doc.querySelector('input[name="waitingYN"]:checked')?.value;
    if(!host.validSetting(pre,req,waiting))return save();
    const result=save();
    enabled=selected(getChecks());
    refresh();summary();
    return result;
  };
  host.openSettingPanel=function(){
    const out=open();
    for(const toggle of toggles)toggle.checked=enabled.includes(toggle.getAttribute('data-scenario-toggle'));
    refresh();
    return out;
  };
  toggles.forEach(toggle=>toggle.addEventListener('change',refresh));
  doc.getElementById('scenario-all-on')?.addEventListener('click',()=>{
    for(const toggle of toggles)toggle.checked=true;
    refresh();
  });
  doc.getElementById('scenario-all-off')?.addEventListener('click',()=>{
    for(const toggle of toggles)toggle.checked=false;
    refresh();
  });
  close?.addEventListener('click',()=>{
    resetWorkspace();
    const item=doc.querySelector('.setting');
    if(typeof item?.focus==='function')item.focus();
  });
  const hashHandler=()=>{
    if(host.location?.hash==='#scenario-settings'){
      host.openSettingPanel();
      const el=toggles[0];
      if(typeof el?.focus==='function')el.focus();
    }
  };
  if(typeof host.addEventListener==='function')host.addEventListener('hashchange',hashHandler);
  refresh();summary();hashHandler();
  return Object.freeze({
    getEnabled:()=>[...enabled],
    run,
    close:resetWorkspace,
  });
}
return Object.freeze({PRESETS,MODES,selected,mount});
});
