/* Historical reference titles only; no auto-scraping or invented deadlines. */
(function(){
 'use strict';
 const list=document.getElementById('notice-list');
 if(!list)return;
 const query=document.getElementById('notice-query');
 const type=document.getElementById('notice-type');
 const count=document.getElementById('notice-count');
 const status=document.getElementById('notice-status');
 let events=[];
 const buckets={
   MAJOR:['DOUBLE_MAJOR_APPLICATION','DOUBLE_MAJOR_CHANGE','PRIMARY_MAJOR_DECLARATION','MAJOR_APPLICATION'],
   COURSE:['WINTER_COURSE','COURSE_REGISTRATION','COURSE_CHANGE','COURSE_CANCELLED'],
   GRAD:['GRADUATION_EXAM','GRADUATION_CERTIFICATION','GRADE_RELEASE','CREDIT_FORFEIT'],
 };
 function category(kind){
   for(const [group,kinds] of Object.entries(buckets))if(kinds.includes(kind))return group;
   if(kind.includes('GRAD')||kind.includes('GRADE')||kind.includes('CREDIT'))return 'GRAD';
   if(kind.includes('MAJOR'))return 'MAJOR';
   if(kind.includes('COURSE')||kind.includes('CLASS'))return 'COURSE';
   return 'OTHER';
 }
 const text=(tag,message,cls)=>{
   const n=document.createElement(tag);n.textContent=message;if(cls)n.className=cls;return n;
 };
 function safeOfficialLink(raw){
   try{const u=new URL(raw);return u.protocol==='https:'&&
     (u.hostname==='hufs.ac.kr'||u.hostname.endsWith('.hufs.ac.kr'))?u.href:null;}
   catch{return null;}
 }
 function render(){
   const search=query.value.trim().toLocaleLowerCase('ko');
   const filter=type.value;
   const matches=events.filter(x=>
     (filter==='ALL'||category(String(x.type))===filter)&&
     (!search||String(x.title).toLocaleLowerCase('ko').includes(search)));
   list.replaceChildren();
   count.textContent=matches.length+'개 참고 공지';
   if(matches.length===0){
     list.append(text('p',events.length
       ?'검색 조건에 맞는 참고 공지가 없어요. 검색어를 바꿔보세요.'
       :'확인 가능한 공지 목록이 없어요. 학교 공지에서 확인해 주세요.','hanmo-empty'));
     return;
   }
   for(const item of matches){
     const card=text('article','','hanmo-item');
     card.append(text('span','제목·게시일만 참고 · 적용/마감 미확인','hanmo-tag wait'));
     card.append(text('h3',String(item.title||'제목 확인 필요')));
     const source=item.source&&typeof item.source==='object'?item.source:{};
     card.append(text('p','게시일: '+String(source.publishedDate||'확인 필요')+
       ' · 현재 자료: 2026-11-17 기준 참고 목록'));
     card.append(text('p','실제 대상자·접수 기간은 공식 원문에서 확인하세요.'));
     const href=safeOfficialLink(source.url);
     if(href){
       const a=text('a','학교 공식 공지 확인 →');
       a.href=href;a.target='_blank';a.rel='noopener noreferrer';
       card.append(a);
     }
     list.append(card);
   }
 }
 query.addEventListener('input',render);
 type.addEventListener('change',render);
 fetch('../data/academic-notices-reference.json',{credentials:'same-origin'})
   .then(r=>{if(!r.ok)throw new Error('자료 조회 실패');return r.json();})
   .then(data=>{
     if(!data||!Array.isArray(data.events))throw new Error('자료 형식 확인 필요');
     events=data.events.filter(x=>x&&typeof x==='object'&&typeof x.title==='string');
     status.textContent='과거 게시 제목 참고용 스냅샷 · '+String(data.snapshotDate||'기준일 미확인')+
       ' · 자동 갱신되지 않습니다.';
     render();
   })
   .catch(()=>{
     events=[];
     status.textContent='자료를 표시할 수 없어요. 학교 공식 공지를 확인해 주세요.';
     render();
   });
})();
