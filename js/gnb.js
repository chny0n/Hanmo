// PC 전용 공통 헤더 상태. 다른 페이지와 공유하는 기존 deviceInfo 저장 키는 유지한다.
const $headerNotice=document.getElementsByClassName('headerNotice')[0];
const $HEADERNOTICELIST=document.getElementsByClassName('headerNoticeList')[0];
const $deviceCheck=document.getElementsByClassName('deviceCheck')[0];
const $deviceCheckList=document.getElementsByClassName('deviceCheckList')[0];
const $header=document.getElementsByTagName('header')[0];

const thisTime=new Date();
const isEarlyNotice=thisTime.getHours()===9
  &&thisTime.getMinutes()>=53&&thisTime.getMinutes()<58;

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
    if(isEarlyNotice)$headerNotice.style.display='flex';
    showDeviceCheck();
  }else if(isEarlyNotice){
    $header.style.top='-40px';
    $headerNotice.style.display='flex';
  }
}

const noticeOffsets=[81,137,25];
let headerNoticeIndex=0;
/** 기존 알림의 3단계 표시와 각 5초 전환 동작을 보존한다. */
function rotateHeaderNotice(){
  $HEADERNOTICELIST.style.bottom=noticeOffsets[headerNoticeIndex]+'px';
  headerNoticeIndex=(headerNoticeIndex+1)%noticeOffsets.length;
}
checkDevice();
setInterval(rotateHeaderNotice,5000);
