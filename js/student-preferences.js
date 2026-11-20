/* Student-selected campus and major are optional and remain on this browser. No JSON/HTML uploads. */
(function(){
 'use strict';
 const form=document.getElementById('planner-profile');
 if(!form)return;
 const campus=document.getElementById('planner-campus');
 const major=document.getElementById('planner-major');
 const message=document.getElementById('planner-message');
 const reset=document.getElementById('planner-clear');
 const key='hanmo:student-planner:profile:v1';
 try{
   const raw=localStorage.getItem(key);
   if(raw){
     const value=JSON.parse(raw);
     if(value&&typeof value==='object'){
       campus.value=['SEOUL','GLOBAL'].includes(value.campus)?value.campus:'';
       major.value=typeof value.major==='string'?value.major.slice(0,80):'';
       message.textContent='이 브라우저에 저장된 선택을 불러왔어요. 학교 시스템과 연결되지 않습니다.';
     }
   }
 }catch{message.textContent='저장된 선택을 불러오지 못했어요. 저장 없이도 이용할 수 있습니다.';}
 form.addEventListener('submit',event=>{
   event.preventDefault();
   if(!form.reportValidity())return;
   try{
     localStorage.setItem(key,JSON.stringify({campus:campus.value,major:major.value.trim().slice(0,80)}));
     message.textContent='선택을 이 브라우저에만 저장했어요. 학교 계정이나 성적표와 연결되지 않습니다.';
   }catch{message.textContent='이 브라우저에 저장할 수 없어요. 다른 메뉴는 그대로 이용할 수 있습니다.';}
 });
 reset.addEventListener('click',()=>{
   try{localStorage.removeItem(key);}catch{/* private browsing */}
   form.reset();message.textContent='저장된 학업 선택을 지웠어요.';
 });
})();
