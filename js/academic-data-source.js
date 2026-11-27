/* 학사정보·강의검색 자료 연결이 준비되기 전에는 모든 외부 자료 연결을 차단합니다. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.HanmoAcademicData=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const CONFIG='../data/academic-source-config.json';
  const TIMEOUT_MS=7000;
  const EMPTY=Object.freeze([]);
  const STATUS=Object.freeze({
    NOT_CONNECTED:'NOT_CONNECTED',EMPTY:'EMPTY',READY:'READY',
    OFFLINE:'OFFLINE',INVALID:'INVALID'
  });
  const result=(status,notices=EMPTY,offerings=EMPTY,meta=null)=>
    Object.freeze({status,notices,offerings,meta});
  function officialUrl(value){
    if(typeof value!=='string')return null;
    try{
      const url=new URL(value);
      if(url.protocol!=='https:'||url.username||url.password)return null;
      if(url.hostname!=='hufs.ac.kr'&&!url.hostname.endsWith('.hufs.ac.kr'))return null;
      return url.href;
    }catch{return null;}
  }
  async function readJson(fetcher,url,options){
    const abort=typeof AbortController==='function'?new AbortController():null;
    const timeout=abort?setTimeout(()=>abort.abort(),TIMEOUT_MS):null;
    try{
      const response=await fetcher(url,{cache:'no-store',credentials:'omit',
        ...options,...(abort?{signal:abort.signal}:{})});
      if(!response||!response.ok)throw new Error('Network or permission failure');
      return await response.json();
    }finally{if(timeout!==null)clearTimeout(timeout);}
  }
  async function load(options={}){
    const fetcher=options.fetcher??(typeof fetch==='function'?fetch:null);
    if(typeof fetcher!=='function')return result(STATUS.OFFLINE);
    let config;
    try{
      config=await readJson(fetcher,options.configPath??CONFIG,{});
    }catch{return result(STATUS.OFFLINE);}
    // 새 공개 자료 계약 및 검수·철회 절차가 완성되기 전에는 연결 설정을 활성화할 수 없습니다.
    if(!config||typeof config!=='object'||Array.isArray(config)||config.schemaVersion!==1||
       Object.keys(config).length!==2||config.mode!=='disabled')return result(STATUS.INVALID);
    return result(STATUS.NOT_CONNECTED);
  }
  return Object.freeze({STATUS,load,officialUrl});
});
