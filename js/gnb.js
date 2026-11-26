// PC 전용 공통 헤더 상태. 다른 페이지와 공유하는 기존 deviceInfo 저장 키는 유지한다.
const $deviceCheck=document.getElementsByClassName('deviceCheck')[0];
const $deviceCheckList=document.getElementsByClassName('deviceCheckList')[0];
const $header=document.getElementsByTagName('header')[0];

function isUnsupportedDevice(){
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** 최초 한 번만 기기 유형을 로컬에서 확인한다. 사용자 식별 정보는 전송하지 않는다. */
function showDeviceCheck(){
  const unsupported=isUnsupportedDevice();
  $deviceCheck.style.background=unsupported?'#800309':'#038003';
  $deviceCheck.style.height='64px';
  $deviceCheckList.style.bottom=unsupported?'26px':'164px';
  localStorage.setItem('deviceInfo',!unsupported);
  if(unsupported)location.href='/';
  setTimeout(()=>{$header.style.top='-64px';},1500);
}

function checkDevice(){
  // 예전 모바일 판정이 남아 있어도 현재 PC라면 정상 이용할 수 있게 다시 검사한다.
  if(!isUnsupportedDevice() && localStorage.getItem('deviceInfo')==='false'){
    localStorage.removeItem('deviceInfo');
  }
  if(localStorage.getItem('deviceInfo')===null){
    $header.style.top='0px';
    showDeviceCheck();
  }
}

checkDevice();
