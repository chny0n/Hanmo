/* 입력한 학점의 합계를 계산한다. */
(function(){
 'use strict';
 const form=document.getElementById('credit-form');
 if(!form)return;
 const summary=document.getElementById('credit-summary');
 const status=document.getElementById('credit-status');
 const bar=document.getElementById('credit-bar');
 const val=id=>Number(document.getElementById(id).value);
 const text=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n;};
 form.addEventListener('submit',event=>{
   event.preventDefault();
   if(!form.reportValidity())return;
   const target=val('credit-target'),earned=val('credit-earned'),going=val('credit-going'),planned=val('credit-planned');
   const all=[target,earned,going,planned];
   if(!all.every(Number.isFinite)||target<=0||all.slice(1).some(x=>x<0)||earned>400){
     status.textContent='학점이 올바르게 입력됐는지 확인해 주세요.';return;
   }
   const left=Math.max(0,target-earned);
   summary.replaceChildren();
   summary.append(text('strong','취득 '+earned+'학점 · 남은 '+left+'학점'));
   summary.append(text('p','수강 중 '+going+'학점 · 예정 '+planned+'학점'));
   bar.style.width=Math.min(100,Math.max(0,earned/target*100))+'%';
   const warnings=[];
   if(earned>target)warnings.push('취득 학점이 목표보다 '+(earned-target)+'학점 많습니다.');
   if(earned+going+planned>target)warnings.push('취득·수강 중·예정 합계가 목표를 초과합니다. 중복 합산 여부를 확인해 주세요.');
   status.textContent='목표 달성률 '+Math.round(Math.min(100,earned/target*100))+'%'+
     (warnings.length?' · '+warnings.join(' '):'');
 });
 form.addEventListener('reset',()=>{
   summary.textContent='—';
   bar.style.width='0%';status.textContent='';
 });
})();
