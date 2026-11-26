// 학사 공지와 학사 달력을 단일 화면의 접근 가능한 탭으로 전환합니다.
(function(){
  const tabs=[
    document.getElementById('academic-notice-tab'),
    document.getElementById('academic-calendar-tab'),
  ];
  const panels=[
    document.getElementById('academic-notice-panel'),
    document.getElementById('academic-calendar-panel'),
  ];
  const calendarStatus=document.getElementById('calendar-status');
  const resources=document.getElementById('academic-calendar-resources');
  if(tabs.some(v=>!v)||panels.some(v=>!v)||!calendarStatus||!resources)return;
  const calendarStatusText=calendarStatus.textContent;
  let calendarLoad;
  function showCalendar(){
    if(!calendarLoad){
      calendarStatus.textContent='달력 불러오는 중';
      const styles=Array.from(resources.content.querySelectorAll('link[rel="stylesheet"]'));
      const stylesReady=Promise.all(styles.map(link=>new Promise((resolve,reject)=>{
        link.addEventListener('load',resolve,{once:true});
        link.addEventListener('error',reject,{once:true});
      })));
      resources.replaceWith(resources.content);
      calendarLoad=stylesReady.then(()=>import('./academic-calendar.js')).then(()=>{
        calendarStatus.textContent=calendarStatusText;
        return true;
      },()=>{
        calendarStatus.textContent='달력을 불러오지 못했습니다. 학교 학사일정 원문에서 확인해 주세요.';
        return false;
      });
    }
    void calendarLoad.then(loaded=>{
      if(loaded&&!panels[1].hidden)
        requestAnimationFrame(()=>window.dispatchEvent(new Event('hanmo:calendar:show')));
    });
  }
  function select(index,focus=false){
    tabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index));
      tab.tabIndex=i===index?0:-1;
      panels[i].hidden=i!==index;
    });
    if(focus)tabs[index].focus();
    if(index===1)showCalendar();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(index));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?1:
        (index+(event.key==='ArrowRight'?1:-1)+2)%2;
      select(next,true);
    });
  });
  if(location.hash==='#calendar')select(1);
})();
