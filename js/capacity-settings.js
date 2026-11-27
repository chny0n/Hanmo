// BASIC의 선택형 가상 정원 마감을 세션 범위로 유지한다.
(function(root){
  'use strict';
  const SELECTION='hanmo.syntheticCapacity.selection.v1';
  const ACTIVE='hanmo.syntheticCapacity.active.v1';
  const doc=root.document;
  if(!doc)return;
  const yes=doc.querySelector('[data-capacity-toggle]');
  const no=doc.querySelector('[data-capacity-off]');
  if(!yes||!no||typeof doc.addEventListener!=='function'||typeof root.goPractice!=='function')return;
  const get=key=>{try{return root.sessionStorage?.getItem(key);}catch{return null;}};
  const put=(key,value)=>{try{
    if(value===null)root.sessionStorage?.removeItem(key);
    else root.sessionStorage?.setItem(key,value);
  }catch{/* 저장 거부 시 정원 마감은 활성화하지 않는다. */}};
  let enabled=get(SELECTION)==='yes';
  const sync=()=>{yes.checked=enabled;no.checked=!enabled;};
  // 선택은 SETTING 창 안에 있으므로 창을 열 때 복원하고 확인으로 저장할 때만 반영한다.
  doc.addEventListener('hanmo-settings-open',sync);
  doc.addEventListener('hanmo-settings-saved',()=>{
    enabled=Boolean(yes.checked);
    put(SELECTION,enabled?'yes':'no');
  });
  const previous=root.goPractice;
  root.goPractice=function(mode){
    put(ACTIVE,mode===1&&enabled&&root.hasValidPracticeSettings?.()?'yes':null);
    return previous(mode);
  };
  sync();
  root.HanmoCapacityKeys=Object.freeze({SELECTION,ACTIVE});
})(typeof window==='object'?window:globalThis);
