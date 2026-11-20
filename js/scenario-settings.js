/* In-page mock-registration incidents. Three independent switches, all OFF by default.
 * Never modifies the protected HUFS imitation pages or their controllers.
 */
(function(root,factory){
  const logic=typeof module==='object'&&module.exports?require('./incident-courses.js'):root.HanmoIncidentCourses;
  const api=factory(logic);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.HanmoScenarioSettings=api;if(root.document)api.mount(root.document,root);}
})(typeof globalThis==='object'?globalThis:this,function(logic){
  'use strict';
  const PRESETS=logic.OPTIONS;
  const MODES=Object.freeze({1:'BASIC',2:'TIME',3:'SELECT'});
  const RESUME_KEY='hanmo.synthetic404.resume.v1';
  const RESUME_MS=5*60*1000;
  const selected=logic.enabled;
  function mount(doc,host){
    const byId=id=>doc.getElementById(id);
    const settings=byId('scenario-settings'),work=byId('incident-practice');
    const toggles=Array.from(doc.querySelectorAll('[data-scenario-toggle]'));
    if(!settings||!work||toggles.length!==PRESETS.length||
       typeof host.goPractice!=='function'||typeof host.getSettingValue!=='function'||
       typeof host.openSettingPanel!=='function')return null;
    const controls={
      feedback:byId('incident-feedback'),base:byId('incident-base'),
      results:byId('incident-candidates'),search:byId('incident-search'),
      status:byId('incident-status'),mode:byId('incident-mode'),
      dialog:byId('incident-404'),exit:byId('incident-exit'),
      refresh:byId('incident-404-refresh'),back:byId('incident-404-back')
    };
    const original=host.goPractice,save=host.getSettingValue,open=host.openSettingPanel;
    let enabled=[],mode=null,base=[],searched=false,courseChosen=false;
    let timer=null,historyPushed=false,showing404=false;
    const local=host.localStorage,session=host.sessionStorage;
    const clock=()=>typeof host.Date?.now==='function'?host.Date.now():Date.now();
    const getChecks=()=>toggles.filter(x=>x.checked).map(x=>x.getAttribute('data-scenario-toggle'));
    function refresh(){
      for(const toggle of toggles){
        const b=toggle.closest('label')?.querySelector('em');
        if(b)b.textContent=toggle.checked?'ON':'OFF';
      }
    }
    function summary(){
      const target=doc.querySelector('.printValue');
      if(target&&host.validSetting(Number(local?.getItem('psubjectValue')),
         Number(local?.getItem('subjectValue')),local?.getItem('waitingValue'))){
        target.textContent=enabled.length?'과목 설정 완료 · 가상 상황 '+enabled.length+'종 ON':
          '과목 설정 완료 · 돌발상황 모두 OFF';
        target.style.color=enabled.length?'#f4c76c':'white';
      }
    }
    const say=(message,type='info')=>{
      controls.feedback.textContent=message;
      controls.feedback.dataset.result=type;
    };
    function saveResume(phase='ready'){
      if(!enabled.includes('RECONNECT')||!session)return;
      try{session.setItem(RESUME_KEY,JSON.stringify({
        version:1,at:clock(),mode,enabled,base,searched,phase
      }));}catch(_error){/* Private browsing may block storage; buttons still work. */}
    }
    function clearResume(){
      try{session?.removeItem(RESUME_KEY);}catch(_error){}
    }
    function renderBase(){
      for(const box of doc.querySelectorAll('[data-base-course]')){
        const n=Number(box.getAttribute('data-base-course'));
        box.checked=base.includes(n);
      }
    }
    function drawCandidates(){
      controls.results.hidden=!searched;
      if(!searched)return;
      for(const button of doc.querySelectorAll('[data-alt-course]')){
        const n=Number(button.getAttribute('data-alt-course'));
        button.disabled=false;
        const conflict=base.includes(n);
        button.setAttribute('aria-label','가상 대체과목 '+n+'번 신청');
        button.setAttribute('data-conflict',conflict?'true':'false');
      }
      if(logic.noAlternative(base)){
        controls.status.textContent='선택한 기본과목 1·2·3번과 모든 대체과목의 시간이 겹칩니다.';
      }else{
        controls.status.textContent='후보 1·2·3번에서 선택하세요. 기존 과목과 같은 번호만 시간표가 겹칩니다.';
      }
    }
    function ensureModeValid(n){
      return Boolean(MODES[n]&&host.validSetting(Number(local?.getItem('psubjectValue')),
        Number(local?.getItem('subjectValue')),local?.getItem('waitingValue')));
    }
    function drawPractice(){
      work.hidden=false;
      work.removeAttribute('aria-hidden');
      controls.mode.textContent=MODES[mode]+' MODE · 가상 돌발상황';
      renderBase();drawCandidates();
      if(!searched){
        say(enabled.includes('LAST_VALID')?'마지막 과목이 가상 정원 마감되었습니다. 검색을 눌러 대체과목을 확인하세요.':
          '원래 담은 기본과목을 확인한 뒤 검색을 눌러 대체과목을 선택하세요.');
      }
      if(typeof work.focus==='function')work.focus();
      if(typeof work.scrollIntoView==='function')work.scrollIntoView({block:'start'});
    }
    function clearTimer(){
      if(timer!==null){(host.clearTimeout||clearTimeout)(timer);timer=null;}
    }
    function resume404(reason){
      if(!showing404)return;
      showing404=false;
      controls.dialog.hidden=true;
      clearTimer();
      saveResume('ready');
      say('404 예시화면을 '+reason+'으로 닫았습니다. 이어서 대체과목을 검색하거나 신청할 수 있습니다.','success');
      if(typeof controls.search?.focus==='function')controls.search.focus();
    }
    function show404(){
      timer=null;
      if(work.hidden||showing404||!enabled.includes('RECONNECT'))return;
      showing404=true;
      controls.dialog.hidden=false;
      saveResume('404');
      if(!historyPushed&&host.history&&typeof host.history.pushState==='function'){
        try{
          host.history.pushState({hanmoSynthetic404:true},'',host.location?.href);
          historyPushed=true;
        }catch(_error){}
      }
      if(typeof controls.refresh?.focus==='function')controls.refresh.focus();
    }
    function resetPractice(){
      clearTimer();showing404=false;historyPushed=false;
      controls.dialog.hidden=true;work.hidden=true;work.setAttribute('aria-hidden','true');
      controls.results.hidden=true;mode=null;base=[];searched=false;courseChosen=false;
      clearResume();
      const tile=doc.querySelector('.setting');
      if(typeof tile?.focus==='function')tile.focus();
    }
    function run(n,options={}){
      const active=logic.enabled(enabled);
      if(!active.length)return original(n); // OFF: the untouched legacy route.
      if(!ensureModeValid(n))return original(n);
      mode=n;base=options.base?logic.selection(options.base):logic.initialCourses(active);
      searched=Boolean(options.searched);courseChosen=false;
      local.setItem('practiceSetter',n);
      drawPractice();
      if(active.includes('RECONNECT')&&!options.resume){
        saveResume('pending');
        const random=typeof host.Math?.random==='function'?host.Math.random():Math.random();
        const delay=logic.delayMs(random);
        timer=(host.setTimeout||setTimeout)(show404,delay);
      }
      return undefined;
    }
    host.goPractice=run;
    host.getSettingValue=function(){
      const p=Number(doc.querySelector('.psugangVal')?.value);
      const r=Number(doc.querySelector('.vsugangVal')?.value);
      const w=doc.querySelector('input[name="waitingYN"]:checked')?.value;
      if(!host.validSetting(p,r,w))return save();
      const result=save();enabled=selected(getChecks());refresh();summary();return result;
    };
    host.openSettingPanel=function(){
      const result=open();
      for(const toggle of toggles)toggle.checked=enabled.includes(toggle.getAttribute('data-scenario-toggle'));
      refresh();return result;
    };
    for(const t of toggles)t.addEventListener('change',refresh);
    byId('scenario-all-on')?.addEventListener('click',()=>{for(const t of toggles)t.checked=true;refresh();});
    byId('scenario-all-off')?.addEventListener('click',()=>{for(const t of toggles)t.checked=false;refresh();});
    for(const input of doc.querySelectorAll('[data-base-course]')){
      input.addEventListener('change',()=>{
        base=logic.selection(Array.from(doc.querySelectorAll('[data-base-course]'))
          .filter(x=>x.checked).map(x=>Number(x.getAttribute('data-base-course'))));
        searched=false;controls.results.hidden=true;
        say('기본과목 구성을 변경했습니다. 대체과목을 다시 검색하세요.');
        saveResume();
      });
    }
    controls.search.addEventListener('click',()=>{
      searched=true;drawCandidates();saveResume();
    });
    for(const button of doc.querySelectorAll('[data-alt-course]')){
      button.addEventListener('click',()=>{
        if(!searched||showing404)return;
        const n=Number(button.getAttribute('data-alt-course'));
        const result=logic.choose(base,n);
        say(result.message,result.ok?'success':'error');
        if(result.ok){base=logic.selection([...base,n]);courseChosen=true;renderBase();}
        drawCandidates();saveResume();
      });
    }
    controls.exit.addEventListener('click',resetPractice);
    controls.refresh.addEventListener('click',()=>{
      if(!showing404)return;
      resume404('새로고침');
      if(typeof host.location?.reload==='function')host.location.reload();
    });
    controls.back.addEventListener('click',()=>{
      if(!showing404)return;
      if(historyPushed&&typeof host.history?.back==='function')host.history.back();
      else resume404('뒤로가기');
    });
    if(typeof host.addEventListener==='function'){
      host.addEventListener('popstate',()=>{if(showing404)resume404('뒤로가기');});
      host.addEventListener('hashchange',()=>{
        if(host.location?.hash==='#scenario-settings')host.openSettingPanel();
      });
    }
    function restoreReload(){
      if(!session)return false;
      let entry;
      try{entry=JSON.parse(session.getItem(RESUME_KEY)||'null');}catch(_error){clearResume();return false;}
      const nav=host.performance?.getEntriesByType?.('navigation')?.[0]?.type;
      if(!entry||entry.version!==1||nav!=='reload'||clock()-entry.at>RESUME_MS||
        !Array.isArray(entry.enabled)||!ensureModeValid(entry.mode)||
        !entry.enabled.includes('RECONNECT')){clearResume();return false;}
      enabled=selected(entry.enabled);
      for(const toggle of toggles)toggle.checked=enabled.includes(toggle.getAttribute('data-scenario-toggle'));
      refresh();summary();
      run(entry.mode,{resume:true,base:entry.base,searched:entry.searched});
      controls.dialog.hidden=true;showing404=false;
      say('404 예시화면에서 새로고침 후 연습을 이어갑니다.','success');
      saveResume('ready');
      return true;
    }
    refresh();summary();
    restoreReload();
    if(host.location?.hash==='#scenario-settings')host.openSettingPanel();
    return Object.freeze({getEnabled:()=>[...enabled],run,close:resetPractice,
      getBase:()=>[...base],getMode:()=>mode,is404:()=>showing404,trigger404:show404});
  }
  return Object.freeze({PRESETS,MODES,selected,mount});
});
