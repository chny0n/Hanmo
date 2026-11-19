// Secondary pages share the original practice restriction (09:58–10:10).
// The home page applies its own notice state in index.js instead.
const now=new Date();
const title=document.getElementsByClassName('title')[0];

function restrictHanmo(){
  const restricted=(now.getHours()===9&&now.getMinutes()>=58)
    ||(now.getHours()===10&&now.getMinutes()<=10);
  if(restricted||localStorage.getItem('deviceInfo')==='false'){
    location.href='/';
  }
}

/** Preserve the displayed semester convention: Jan–Jun=1, Jul–Dec=2. */
function setSemester(){
  const semester=now.getMonth()>=6?2:1;
  title.innerText=now.getFullYear()+'-'+semester+'학기';
}

setSemester();
restrictHanmo();
