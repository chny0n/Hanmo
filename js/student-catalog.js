/* No WIS HTML import and no invented official course results. */
(function(){
 'use strict';
 const toggle=document.getElementById('catalog-demo');
 if(!toggle)return;
 const query=document.getElementById('catalog-query');
 const campus=document.getElementById('catalog-campus');
 const results=document.getElementById('catalog-results');
 const status=document.getElementById('catalog-status');
 const samples=Object.freeze([
   {id:'SYN-ECON-001',title:'[가상] 경제학입문',campus:'서울',credits:3},
   {id:'SYN-LANG-002',title:'[가상] 외국어 교양',campus:'글로벌',credits:2},
   {id:'SYN-STAT-003',title:'[가상] 기초통계학',campus:'서울',credits:3},
   {id:'SYN-WRIT-004',title:'[가상] 학술글쓰기',campus:'글로벌',credits:2},
 ]);
 let enabled=false;
 function render(){
   results.replaceChildren();
   if(!enabled){
     const p=document.createElement('p');p.className='hanmo-empty';
     p.textContent='검수된 실강좌 데이터가 없습니다.';results.append(p);
     status.textContent='예시 버튼을 누르기 전에는 강좌가 표시되지 않습니다.';
     return;
   }
   const q=query.value.trim().toLocaleLowerCase('ko');
   const matches=samples.filter(x=>(campus.value==='ALL'||x.campus===campus.value)&&
     (!q||x.id.toLowerCase().includes(q)||x.title.toLocaleLowerCase('ko').includes(q)));
   status.textContent='가상 시연 '+matches.length+'개 강좌 · 실제 한국외대 강의·담당교수 정보가 아닙니다.';
   if(!matches.length){
     const p=document.createElement('p');p.className='hanmo-empty';p.textContent='조건에 맞는 가상 예시가 없어요.';
     results.append(p);return;
   }
   for(const x of matches){
     const card=document.createElement('article');card.className='hanmo-item';
     const label=document.createElement('span');label.className='hanmo-tag wait';label.textContent='가상 예시';
     const h=document.createElement('h3');h.textContent=x.title;
     const p=document.createElement('p');p.textContent=x.id+' · '+x.campus+'캠퍼스 · '+x.credits+
       '학점 · 담당교수 미연결';
     card.append(label,h,p);results.append(card);
   }
 }
 toggle.addEventListener('click',()=>{
   enabled=!enabled;
   query.disabled=!enabled;campus.disabled=!enabled;
   toggle.textContent=enabled?'가상 검색 체험 종료':'가상 검색 예시 체험';
   if(!enabled){query.value='';campus.value='ALL';}
   render();
 });
 query.addEventListener('input',render);campus.addEventListener('change',render);
 render();
})();
