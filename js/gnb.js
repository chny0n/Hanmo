// Shared PC-only header status. Keep deviceInfo as the existing storage key.
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

/** One-time local device check; no user identifier is transmitted. */
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
/** Preserve the original three-step, five-second notice animation. */
function rotateHeaderNotice(){
  $HEADERNOTICELIST.style.bottom=noticeOffsets[headerNoticeIndex]+'px';
  headerNoticeIndex=(headerNoticeIndex+1)%noticeOffsets.length;
}
checkDevice();
setInterval(rotateHeaderNotice,5000);
