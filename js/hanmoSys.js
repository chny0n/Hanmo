// 하위 페이지의 이용 제한과 학기 표시를 유지하면서 선택형 404의 페이지 이동만 감시합니다.
// 원본 practice/selectZone 코드와 버튼·대기열·시간 기록은 수정하지 않습니다.
const now=new Date();
const title=document.getElementsByClassName('title')[0];
const HANMO_404_TRANSITION_KEY='hanmo.synthetic404.transition.v3';
const HANMO_404_TRANSITION_VERSION=3;
const HANMO_404_TRANSITION_TTL_MS=30*60*1000;

function currentHanmoPage(){
  const route=String(location.pathname||location.href||'').split(/[?#]/)[0];
  return route.slice(route.lastIndexOf('/')+1);
}

function restrictHanmo(){
  if(typeof window==='object'&&window.HanmoPcOnly?.blocked)return true;
  const restricted=(now.getHours()===9&&now.getMinutes()>=58)
    ||(now.getHours()===10&&now.getMinutes()<=10);
  // 모드 선택 화면은 이용 제한 안내 중에도 열 수 있게 두고,
  // 실제 연습 페이지의 기존 시간/PC 제한은 유지합니다.
  const isModeMenu=currentHanmoPage()==='vsugang.html';
  if(restricted&&!isModeMenu){
    location.href='/';
    return true;
  }
  return false;
}

function routeHanmoIncident(){
  const page=currentHanmoPage();
  if(page!=='practice.html'&&page!=='selectZone.html')return;
  let session,entry;
  try{
    session=typeof sessionStorage==='object'?sessionStorage:null;
    entry=JSON.parse(session?.getItem(HANMO_404_TRANSITION_KEY)||'null');
  }catch(_error){return;}
  if(!session||!entry)return;
  const elapsed=Date.now()-entry.at;
  if(entry.version!==HANMO_404_TRANSITION_VERSION||entry.mode!==1||
    !Number.isFinite(elapsed)||elapsed<0||elapsed>HANMO_404_TRANSITION_TTL_MS||
    localStorage.getItem('practiceSetter')!=='1'){
    try{session.removeItem(HANMO_404_TRANSITION_KEY);}catch(_error){}
    return;
  }
  if(page==='practice.html'&&entry.phase==='armed'){
    try{
      session.setItem(HANMO_404_TRANSITION_KEY,JSON.stringify({
        ...entry,phase:'practice'
      }));
    }catch(_error){}
    return;
  }
  if(page!=='selectZone.html')return;
  if(entry.phase==='practice'){
    // 원본에서 selectZone으로 이동했을 때만 1회 404를 표시합니다.
    try{
      session.setItem(HANMO_404_TRANSITION_KEY,JSON.stringify({
        ...entry,phase:'error',errorAt:Date.now()
      }));
      location.assign('./incident-404.html');
      return true;
    }catch(_error){
      try{session.removeItem(HANMO_404_TRANSITION_KEY);}catch(_ignored){}
    }
  }else if(entry.phase==='error'){
    // 브라우저 뒤로가기로 복귀한 selectZone에서는 재주입하지 않습니다.
    try{session.removeItem(HANMO_404_TRANSITION_KEY);}catch(_error){}
  }
}

/** 404 분기를 통과하여 실제 신청 화면에 도착한 뒤에만 가상 접속 대기를 시작합니다. */
function startHanmoEntryWaiting(){
  if(currentHanmoPage()!=='selectZone.html')return;
  const mode=localStorage.getItem('practiceSetter');
  if(mode!=='1'&&mode!=='3')return;
  if(localStorage.getItem('waitingEntryValue')!=='yes')return;
  // selectZone.js가 이미 로드한 대기창만 재사용하며 원본 신청 함수는 변경하지 않습니다.
  if(typeof waitingFunc!=='function'||typeof document.querySelector!=='function')return;

  // 접속 대기가 진행 중인 동안 검색·신청·왼쪽 메뉴가 대기열을 우회하지 못하게 합니다.
  const selectors=['.navigation','.menu','.table','.vsugangedTable'];
  const controls=selectors.map(selector=>document.querySelector(selector)).filter(Boolean);
  const previous=controls.map(element=>Boolean(element.inert));
  controls.forEach(element=>{element.inert=true;});

  const restore=()=>controls.forEach((element,index)=>{element.inert=previous[index];});
  try{
    Promise.resolve(waitingFunc()).then(completed=>{
      restore();
      // 접속 대기 취소는 진입 취소로 처리합니다. 신청 버튼 대기 취소 동작은 그대로 둡니다.
      if(!completed)location.replace('./practice.html');
    },restore);
  }catch(_error){
    restore();
  }
}

/** 기존 학기 표시 규칙을 유지합니다. 1~6월은 1학기, 7~12월은 2학기입니다. */
function setSemester(){
  const semester=now.getMonth()>=6?2:1;
  title.innerText=now.getFullYear()+'-'+semester+'학기';
}

setSemester();
if(!restrictHanmo()){
  const interceptedBy404=routeHanmoIncident();
  if(!interceptedBy404)startHanmoEntryWaiting();
  // Chrome의 뒤로가기 캐시 복귀에서는 원본 스크립트가 재실행되지 않을 수 있습니다.
  if(currentHanmoPage()==='selectZone.html'&&typeof window==='object'){
    window.addEventListener?.('pageshow',event=>{
      if(event.persisted)routeHanmoIncident();
    });
  }
}
