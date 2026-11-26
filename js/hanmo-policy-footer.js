// 브라우저 현지 시각을 기준으로 경고만 표시합니다. 연습 진입 제한은 기존 경로에서 처리합니다.
(() => {
  const footer=document.querySelector('.hanmo-policy-footer p');
  if(!footer)return;
  const notice=document.createElement('span');
  notice.className='hanmo-restriction-notice';
  notice.setAttribute('role','status');
  footer.append(notice);
  let timer;
  function update(){
    clearTimeout(timer);
    const now=new Date();
    const minutes=60*now.getHours()+now.getMinutes();
    const message=minutes>=9*60+53&&minutes<=10*60+10
      ?(minutes<9*60+58?'곧 이용 제한 · ':'현재 이용 제한 · ')+'09:58 ~ 10:10'
      :'';
    if(notice.textContent!==message)notice.textContent=message;
    timer=setTimeout(update,60000-now.getSeconds()*1000-now.getMilliseconds());
  }
  window.addEventListener('pageshow',update);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)update();
  });
  update();
})();
