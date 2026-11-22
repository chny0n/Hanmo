// 방문자가 고른 월의 실제 날짜 격자만 생성하며 미검수 학사일정을 추정하지 않는다.
(function(){
 'use strict';
 const month=document.getElementById('calendar-month');
 if(!month)return;
 const grid=document.getElementById('calendar-days');
 const heading=document.getElementById('calendar-heading');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'})
   .format(new Date()).replace('/', '-');
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(new Date());
 month.value=parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
 function render(){
  const valid=/^20\d\d-(0[1-9]|1[0-2])$/.exec(month.value);
  if(!valid){heading.textContent='조회 월을 확인해 주세요.';grid.replaceChildren();return;}
  const [year,mm]=month.value.split('-').map(Number);
  const first=new Date(Date.UTC(year,mm-1,1)).getUTCDay();
  const days=new Date(Date.UTC(year,mm,0)).getUTCDate();
  grid.replaceChildren();heading.textContent=year+'년 '+mm+'월 · 공식 행사 데이터 확인 필요';
  for(let offset=0;offset<first;offset++){
   const blank=document.createElement('li');blank.setAttribute('aria-hidden','true');blank.className='empty';grid.append(blank);
  }
  for(let day=1;day<=days;day++){
   const li=document.createElement('li');li.textContent=String(day);
   li.setAttribute('aria-label',year+'년 '+mm+'월 '+day+'일, 공식 일정 미연결');
   grid.append(li);
  }
 }
 function move(delta){
  const [y,m]=month.value.split('-').map(Number);if(!y||!m)return;
  const date=new Date(Date.UTC(y,m-1+delta,1));
  month.value=date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0');
  render();
 }
 month.addEventListener('change',render);
 document.getElementById('calendar-prev').addEventListener('click',()=>move(-1));
 document.getElementById('calendar-next').addEventListener('click',()=>move(1));
 render();
})();
