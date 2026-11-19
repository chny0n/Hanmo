// 하위 페이지의 모의수강신청 이용 제한(09:58~10:10)을 공유한다.
// 홈 화면은 index.js에서 별도로 알림 상태를 처리한다.
const now=new Date();
const title=document.getElementsByClassName('title')[0];

function restrictHanmo(){
  const restricted=(now.getHours()===9&&now.getMinutes()>=58)
    ||(now.getHours()===10&&now.getMinutes()<=10);
  if(restricted||localStorage.getItem('deviceInfo')==='false'){
    location.href='/';
  }
}

/** 기존 학기 표시 규칙을 유지한다. 1~6월은 1학기, 7~12월은 2학기로 표시한다. */
function setSemester(){
  const semester=now.getMonth()>=6?2:1;
  title.innerText=now.getFullYear()+'-'+semester+'학기';
}

setSemester();
restrictHanmo();
