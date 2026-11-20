/* Deterministic mock-course candidates. Not school data or real enrollment. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HanmoIncidentCourses=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const IDS=Object.freeze([1,2,3]);
  const OPTIONS=Object.freeze(['LAST_VALID','LAST_CONFLICT','LAST_NONE','RECONNECT']);
  function selection(items){
    if(!Array.isArray(items))return [];
    return IDS.filter(n=>items.includes(n));
  }
  function enabled(items){
    if(!Array.isArray(items))return [];
    return OPTIONS.filter(k=>items.includes(k));
  }
  function initialCourses(incidents){
    const on=enabled(incidents);
    return on.includes('LAST_NONE')?[1,2,3]:on.includes('LAST_CONFLICT')?[1,2]:[1];
  }
  function candidates(base){
    const picked=selection(base);
    return Object.freeze(IDS.map(n=>Object.freeze({
      id:n,label:'가상 대체과목 '+n,correspondsTo:'기본과목 '+n,
      conflict:picked.includes(n)
    })));
  }
  function choose(base,n){
    if(!IDS.includes(n))throw new RangeError('가상 과목 번호는 1~3만 허용됩니다.');
    const picked=selection(base);
    if(picked.includes(n))return Object.freeze({ok:false,id:n,
      message:'기본과목 '+n+'번과 시간표가 겹쳐 수강신청이 불가합니다.'});
    return Object.freeze({ok:true,id:n,
      message:'대체과목 '+n+'번은 기본과목과 번호가 겹치지 않아 수강신청이 가능합니다.'});
  }
  function noAlternative(base){return candidates(base).every(x=>x.conflict);}
  function delayMs(randomValue){
    const n=Number(randomValue);
    if(!Number.isFinite(n))return 0;
    return Math.max(0,Math.min(6000,Math.floor(n*6001)));
  }
  return Object.freeze({IDS,OPTIONS,selection,enabled,initialCourses,candidates,choose,noAlternative,delayMs});
});
