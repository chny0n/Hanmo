// Practice entry: preserve the original BASIC/TIME/SELECT routes, timers and
// browser storage keys. The real university registration system is not used.
// 기존 페이지와 결과 화면이 공유하는 모드 키이므로 이름과 숫자(1/2/3)를 변경하지 않는다.
const practiceValue=Number(localStorage.getItem('practiceSetter'));
const practiceMode=document.getElementsByClassName('practiceMode')[0];
const timer=document.getElementsByClassName('timer')[0];

// Starting any practice mode resets these report values.
localStorage.setItem('TIMEtime','0.000');
localStorage.setItem('SELECTtime','0.000');
localStorage.setItem('SELECTWaitTime','0.000');

if(practiceValue===3){
  // SELECT mode has no TIME gate on this page.
  practiceMode.innerText='연습 모드: SELECT MODE';
  timer.innerHTML='<span>10:00:00</span>';
}else{
  practiceMode.innerText=practiceValue===2
    ?'연습 모드: TIME MODE':'연습 모드: BASIC MODE';
  timer.innerHTML='<span class="hours">09</span>:<span class="minutes">59</span>:<span class="seconds">50</span>';

  const clock={
    hours:9,minutes:59,seconds:50,
    hoursElement:document.getElementsByClassName('hours')[0],
    minutesElement:document.getElementsByClassName('minutes')[0],
    secondsElement:document.getElementsByClassName('seconds')[0],
  };
  const registerButton=document.getElementsByClassName('sugang')[0];
  let startTime;

  /** Displayed 09:59:50 clock: independent of the measured elapsed wall time. */
  function tickClock(){
    clock.seconds++;
    if(clock.seconds>=60){
      clock.seconds=0;
      clock.minutes++;
    }
    if(clock.minutes>=60){
      clock.minutes=0;
      clock.hours++;
    }
    clock.secondsElement.innerText=String(clock.seconds).padStart(2,'0');
    clock.minutesElement.innerText=String(clock.minutes).padStart(2,'0');
    clock.hoursElement.innerText=String(clock.hours).padStart(2,'0');
    // 10시 정각의 색상 변경은 표시 효과다. 실제 진입 가능 여부는 startTime으로만 판정한다.
    if(clock.hours===10&&clock.minutes===0&&clock.seconds===0){
      clock.secondsElement.style.color='#5d5d5d';
    }
  }

  function enterRegistration(){
    // Original 10-second entry gate; no actual server time/SSO dependency.
    if(!startTime){
      alert('수강신청 기간이 아닙니다.');
      return;
    }
    // 측정 시간은 화면 시계 값이 아니라 입장 허용 시각부터의 실제 경과 초다.
    localStorage.setItem('TIMEtime',(new Date()-startTime)/1000);
    location.replace(practiceValue===1?'./selectZone.html':'./result.html');
  }

  // Keep original page-load scheduling and route contracts.
  // 기존 DOM과 이벤트 연결에 의존하므로 초기화 순서를 바꿀 때 TIME/SELECT 회귀를 확인한다.
  window.onload=function startPractice(){
    setInterval(tickClock,1000);
    setTimeout(()=>{startTime=new Date();},10000);
  };
  registerButton.onclick=enterRegistration;
}
