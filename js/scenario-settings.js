/* BASIC 모드에서 두 가지 가상 돌발상황을 선택해 연습한다. */
(function(root){
  'use strict';
  const PRESETS=Object.freeze(['LAST_VALID','RECONNECT']);
  const BASIC_MODE=1;
  const RESUME_KEY='hanmo.synthetic404.resume.v1';
  const RESUME_MS=5*60*1000;
  const RESUME_VERSION=2;
  function selected(items){
    return Array.isArray(items)?PRESETS.filter(key=>items.includes(key)):[];
  }
  function delayMs(randomValue){
    const n=Number(randomValue);
    if(!Number.isFinite(n))return 0;
    return Math.max(0,Math.min(6000,Math.floor(n*6001)));
  }
  function mount(doc,host){
    const byId=id=>doc.getElementById(id);
    const settings=byId('scenario-settings'),work=byId('incident-practice');
    const optionsTile=byId('incident-options');
    const yesById=optionInputs(doc,'data-scenario-toggle');
    const noById=optionInputs(doc,'data-scenario-off');
    if(!settings||!work||!optionsTile||!yesById||!noById||
       typeof host.goPractice!=='function'||typeof host.hasValidPracticeSettings!=='function')return null;
    const choices=PRESETS.map(id=>({id,yes:yesById.get(id),no:noById.get(id)}));
    const controls={
      feedback:byId('incident-feedback'),
      dialog:byId('incident-404'),exit:byId('incident-exit'),
      refresh:byId('incident-404-refresh'),back:byId('incident-404-back')
    };
    if(Object.values(controls).some(x=>!x))return null;
    const original=host.goPractice;
    let enabled=[];
    let timer=null,historyPushed=false;
    const local=host.localStorage,session=host.sessionStorage;
    const clock=()=>typeof host.Date?.now==='function'?host.Date.now():Date.now();
    function syncChecks(){
      for(const {id,yes,no} of choices){
        yes.checked=enabled.includes(id);
        no.checked=!yes.checked;
      }
    }
    function openIncidentSettings(){
      if(settings.open)return;
      syncChecks();
      settings.showModal();
    }
    const say=(message,type='info')=>{
      controls.feedback.textContent=message;
      controls.feedback.dataset.result=type;
    };
    function saveResume(phase='ready'){
      if(!enabled.includes('RECONNECT')||!session)return;
      try{session.setItem(RESUME_KEY,JSON.stringify({
        version:RESUME_VERSION,at:clock(),mode:BASIC_MODE,enabled,phase
      }));}catch(_error){/* 브라우저가 저장소 접근을 제한할 수 있다. */}
    }
    function clearResume(){
      try{session?.removeItem(RESUME_KEY);}catch(_error){}
    }
    function drawPractice(){
      work.hidden=false;
      work.removeAttribute('aria-hidden');
      say(enabled.includes('LAST_VALID')
        ?'마지막 과목이 가상 정원 마감으로 실패했습니다. 신청 상태를 확인하세요.'
        :'가상 접속 단절 예시가 나타나면 새로고침 또는 뒤로가기를 선택하세요.');
      if(typeof work.focus==='function')work.focus();
      if(typeof work.scrollIntoView==='function')work.scrollIntoView({block:'start'});
    }
    function clearTimer(){
      if(timer!==null){(host.clearTimeout||clearTimeout)(timer);timer=null;}
    }
    function resume404(reason){
      if(controls.dialog.hidden)return;
      controls.dialog.hidden=true;
      clearTimer();
      saveResume('ready');
      say('404 예시화면을 '+reason+'으로 닫았습니다. 신청 결과는 확정되지 않았으니 상태를 확인하세요.','success');
      if(typeof controls.exit?.focus==='function')controls.exit.focus();
    }
    function show404(){
      timer=null;
      if(work.hidden||!controls.dialog.hidden||!enabled.includes('RECONNECT'))return;
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
      clearTimer();historyPushed=false;
      controls.dialog.hidden=true;work.hidden=true;work.setAttribute('aria-hidden','true');
      clearResume();
      optionsTile.focus();
    }
    function run(n,resume=false){
      if(n!==BASIC_MODE||!enabled.length||!host.hasValidPracticeSettings())return original(n);
      local.setItem('practiceSetter',n);
      drawPractice();
      if(enabled.includes('RECONNECT')&&!resume){
        saveResume('pending');
        const random=typeof host.Math?.random==='function'?host.Math.random():Math.random();
        const delay=delayMs(random);
        timer=(host.setTimeout||setTimeout)(show404,delay);
      }
      return undefined;
    }
    host.goPractice=run;
    optionsTile.addEventListener('click',openIncidentSettings);
    settings.addEventListener('submit',event=>{
      if(event.submitter?.value==='save')enabled=choices.filter(({yes})=>yes.checked).map(({id})=>id);
    });
    for(const {yes,no} of choices){
      yes.addEventListener('change',()=>{no.checked=!yes.checked;});
      no.addEventListener('change',()=>{
        if(no.checked)yes.checked=false;
        no.checked=!yes.checked;
      });
    }
    controls.exit.addEventListener('click',resetPractice);
    controls.refresh.addEventListener('click',()=>{
      if(controls.dialog.hidden)return;
      resume404('새로고침');
      if(typeof host.location?.reload==='function')host.location.reload();
    });
    controls.back.addEventListener('click',()=>{
      if(controls.dialog.hidden)return;
      if(historyPushed&&typeof host.history?.back==='function')host.history.back();
      else resume404('뒤로가기');
    });
    if(typeof host.addEventListener==='function'){
      host.addEventListener('popstate',()=>resume404('뒤로가기'));
      host.addEventListener('hashchange',()=>{
        if(host.location?.hash==='#scenario-settings')openIncidentSettings();
      });
    }
    function restoreReload(){
      if(!session)return;
      let entry;
      try{entry=JSON.parse(session.getItem(RESUME_KEY)||'null');}catch(_error){clearResume();return;}
      const nav=host.performance?.getEntriesByType?.('navigation')?.[0]?.type;
      const age=clock()-entry?.at;
      const saved=selected(entry?.enabled);
      if(!entry||entry.version!==RESUME_VERSION||nav!=='reload'||
        !Number.isFinite(age)||age<0||age>RESUME_MS||
        !saved.includes('RECONNECT')||saved.length!==entry.enabled.length||
        entry.mode!==BASIC_MODE||!host.hasValidPracticeSettings()){
        clearResume();return;
      }
      enabled=saved;
      syncChecks();
      run(entry.mode,true);
      controls.dialog.hidden=true;
      say('404 예시화면에서 새로고침 후 가상 연습으로 돌아왔습니다. 신청 상태를 확인하세요.','success');
      saveResume('ready');
    }
    syncChecks();
    restoreReload();
    if(host.location?.hash==='#scenario-settings')openIncidentSettings();
    return Object.freeze({getEnabled:()=>[...enabled],
      getMode:()=>work.hidden?null:BASIC_MODE,is404:()=>!controls.dialog.hidden});
  }
  function optionInputs(doc,attribute){
    const inputs=Array.from(doc.querySelectorAll('['+attribute+']'));
    const byId=new Map(inputs.map(input=>[input.getAttribute(attribute),input]));
    return inputs.length===PRESETS.length&&PRESETS.every(id=>byId.has(id))?byId:null;
  }
  const api=Object.freeze({PRESETS,selected,delayMs,mount});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.HanmoScenarioSettings=api;
    if(root.document)mount(root.document,root);
  }
})(typeof globalThis==='object'?globalThis:this);
