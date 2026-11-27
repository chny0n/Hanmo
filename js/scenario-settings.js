/* BASIC 모드의 선택형 가상 404를 기존 모의신청 흐름에 연결합니다. */
(function(root){
  'use strict';
  const PRESETS=Object.freeze(['RECONNECT']);
  const BASIC_MODE=1;
  const TRANSITION_KEY='hanmo.synthetic404.transition.v3';
  const SELECTION_KEY='hanmo.synthetic404.selection.v1';
  const TRANSITION_VERSION=3;

  function selected(items){
    return Array.isArray(items)?PRESETS.filter(key=>items.includes(key)):[];
  }

  function mount(doc,host){
    // 돌발상황 선택은 SETTING 창 안에 있으며 창 열기·저장 이벤트에 맞춰 복원·저장합니다.
    const yes=doc.querySelector('[data-scenario-toggle="RECONNECT"]');
    const no=doc.querySelector('[data-scenario-off="RECONNECT"]');
    if(!yes||!no||typeof doc.addEventListener!=='function'||
      typeof host.goPractice!=='function'||
      typeof host.hasValidPracticeSettings!=='function')return null;

    const originalGoPractice=host.goPractice;
    // 첫 방문은 OFF, 같은 탭에서는 이전에 저장한 선택을 복원합니다.
    let enabled=false;
    try{enabled=host.sessionStorage?.getItem(SELECTION_KEY)==='yes';}
    catch(_error){/* 저장소를 사용할 수 없는 경우 안전한 기본값 OFF를 유지합니다. */}

    function syncChecks(){
      yes.checked=enabled;
      no.checked=!enabled;
    }
    function clearTransition(){
      try{host.sessionStorage?.removeItem(TRANSITION_KEY);}
      catch(_error){/* 저장소가 차단되면 기존 연습으로 복귀합니다. */}
    }
    function armTransition(){
      try{
        if(!host.sessionStorage)return;
        const now=typeof host.Date?.now==='function'?host.Date.now():Date.now();
        host.sessionStorage.setItem(TRANSITION_KEY,JSON.stringify({
          version:TRANSITION_VERSION,phase:'armed',mode:BASIC_MODE,at:now
        }));
      }catch(_error){/* 저장소 접근이 불가능하면 장애를 주입하지 않습니다. */}
    }
    function start(mode){
      clearTransition();
      if(mode===BASIC_MODE&&enabled&&host.hasValidPracticeSettings())armTransition();
      return originalGoPractice(mode);
    }

    host.goPractice=start;
    // 창을 열 때는 저장된 선택을 보여 주고, 닫기로 나가면 다음에 열 때 다시 복원합니다.
    doc.addEventListener('hanmo-settings-open',syncChecks);
    doc.addEventListener('hanmo-settings-saved',()=>{
      enabled=Boolean(yes.checked);
      try{host.sessionStorage?.setItem(SELECTION_KEY,enabled?'yes':'no');}
      catch(_error){/* 저장 거부 시 이 페이지에서만 설정을 유지합니다. */}
      syncChecks();
    });
    yes.addEventListener('change',()=>{
      if(yes.checked)no.checked=false;
      else no.checked=true;
    });
    no.addEventListener('change',()=>{
      if(no.checked)yes.checked=false;
      else yes.checked=true;
    });
    syncChecks();
    return Object.freeze({getEnabled:()=>enabled?['RECONNECT']:[]});
  }

  const api=Object.freeze({PRESETS,selected,mount,TRANSITION_KEY,SELECTION_KEY});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.HanmoScenarioSettings=api;
    if(root.document)mount(root.document,root);
  }
})(typeof globalThis==='object'?globalThis:this);
