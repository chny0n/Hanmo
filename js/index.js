// Landing page notice and availability state; BASIC/TIME/SELECT logic
// lives on the practice pages. All timestamps are local browser time.
const $NOTICELIST=document.getElementsByClassName('noticeList')[0];
const $SUGANGBUTTON=document.getElementsByClassName('button')[0];
const $GANEUNG=document.getElementsByClassName('ganeung')[0];
const $JEHAN=document.getElementsByClassName('jehan')[0];
const $ADFIT=document.getElementsByClassName('adfit')[0];
const title=document.getElementsByClassName('title')[0];
const $TITLECONTAINER=document.getElementsByClassName('titleContainer')[0];
const $CONTAINER=document.getElementsByClassName('container')[0];
const $PHONECONTAINER=document.getElementsByClassName('phoneContainer')[0];
const nowTime=new Date();

// Trusted static notices only. Never interpolate user-entered HTML here.
const noticeList=[
  '<a href="https://everytime.kr/374012/v/415946307">한모 업데이트 내용은 여기를 눌러 확인해주세요.</a>',
  '1년간 4만 명의 학우가 사용한 한모 (2025)',
];
for(let index=noticeList.length-1;index>=0;index--){
  $NOTICELIST.insertAdjacentHTML('afterbegin','<li>'+noticeList[index]+'</li>');
}

let noticeIndex=0;
function rotateNotice(){
  $NOTICELIST.style.bottom=noticeIndex===0?'77px':'0px';
  noticeIndex=(noticeIndex+1)%2;
}
setInterval(rotateNotice,5000);

function check(){
  if(localStorage.getItem('deviceInfo')==='false'){
    $CONTAINER.style.display='none';
    $TITLECONTAINER.style.display='none';
    $PHONECONTAINER.style.display='flex';
    $ADFIT.style.display='none';
  }
  // Preserve the original mock-registration blackout, 09:58–10:10.
  if((nowTime.getHours()===9&&nowTime.getMinutes()>=58)
    ||(nowTime.getHours()===10&&nowTime.getMinutes()<=10)){
    $SUGANGBUTTON.classList.add('noDisplay');
    $SUGANGBUTTON.classList.remove('display');
    $GANEUNG.classList.remove('thisTime');
    $JEHAN.classList.add('thisTime');
  }
}

function setSemester(){
  title.innerText=nowTime.getFullYear()+'-'+(nowTime.getMonth()>=6?2:1)+'학기';
}

setSemester();
check();
