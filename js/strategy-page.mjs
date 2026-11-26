// @ts-check
// 가상 과목 입력과 추천 순서를 화면에 표시합니다.
import {MAX_COURSES,recommendCourses} from './strategy-recommendation.mjs';
const form=document.getElementById('strategy-form');
if(form){
  const body=document.getElementById('strategy-courses');
  const add=document.getElementById('strategy-add');
  const status=document.getElementById('strategy-status');
  const instructions=status.textContent;
  const result=document.getElementById('strategy-result');
  const inputPanel=document.getElementById('strategy-input');
  const orderList=document.getElementById('strategy-order');
  const redo=document.getElementById('strategy-back');
  const initial=[
    {id:'A',name:'과목 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'과목 B',rank:2,capacity:20,rivals:50},
    {id:'C',name:'과목 C',rank:3,capacity:20,rivals:30},
  ];
  function readRows(){
    return [...body.querySelectorAll('tr')].map(row=>{
      const input=name=>row.querySelector('[data-field="'+name+'"]')?.value??'';
      return {id:row.dataset.id,name:input('name').trim(),
        rank:Number(input('rank')),capacity:Number(input('capacity')),rivals:Number(input('rivals'))};
    });
  }
  function renderRows(items){
    body.replaceChildren();
    for(const item of items){
      const tr=document.createElement('tr');tr.dataset.id=item.id;
      for(const field of ['name','rank','capacity','rivals']){
        const td=document.createElement('td'),input=document.createElement('input');
        input.dataset.field=field;input.required=true;
        input.setAttribute('aria-label',item.id+' '+({name:'과목 이름',rank:'중요 순위',capacity:'정원',rivals:'경쟁자'}[field]));
        input.type=field==='name'?'text':'number';
        if(field==='name')input.maxLength=30;
        else{
          input.min=field==='rivals'?'0':'1';
          input.max=field==='rank'?String(items.length):field==='capacity'?'300':'200';
          input.step='1';
        }
        input.value=String(item[field]);td.append(input);tr.append(td);
      }
      const td=document.createElement('td'),remove=document.createElement('button');
      remove.type='button';remove.className='lab-text-button';remove.textContent='삭제';
      remove.disabled=items.length<=2;
      remove.setAttribute('aria-label',item.id+' 삭제');
      remove.addEventListener('click',()=>{
        const next=readRows().filter(c=>c.id!==item.id);
        next.sort((a,b)=>a.rank-b.rank);
        next.forEach((c,index)=>c.rank=index+1);
        renderRows(next);
      });
      td.append(remove);tr.append(td);body.append(tr);
    }
    add.disabled=items.length>=MAX_COURSES;
  }
  renderRows(initial);
  add.addEventListener('click',()=>{
    const items=readRows();if(items.length>=MAX_COURSES)return;
    const id='ABCDEFGH'.split('').find(c=>!items.some(row=>row.id===c));
    if(!id)return;
    items.push({id,name:'과목 '+id,rank:items.length+1,capacity:15,rivals:30});
    renderRows(items);
  });
  const criteria=document.getElementById('strategy-criteria');
  const ratioFormat=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2});
  redo.addEventListener('click',()=>{
    result.hidden=true;
    inputPanel.hidden=false;
    status.textContent=instructions;
    body.querySelector('input').focus();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const order=recommendCourses(readRows());
      orderList.replaceChildren(...order.map(({name,rank,capacity,rivals},slot)=>{
        const item=document.createElement('li');
        const headline=document.createElement('div');
        headline.className='strategy-card-head';
        const position=document.createElement('span');
        position.className='strategy-order-rank';
        position.textContent=(slot+1)+'번째';
        const demand=document.createElement('span');
        demand.className='strategy-course-demand';
        demand.textContent='중요 '+rank+'위';
        headline.append(position,demand);
        const course=document.createElement('strong');
        course.textContent=name;
        const details=document.createElement('span');
        details.className='strategy-course-inputs';
        details.textContent='정원 '+capacity+'명 · 경쟁자 '+rivals+'명';
        const pressure=document.createElement('span');
        pressure.className='strategy-course-inputs';
        pressure.textContent=`자리당 ${ratioFormat.format(rivals/capacity)}~${ratioFormat.format((rivals+1)/capacity)}명`;
        item.append(headline,course,details,pressure);
        return item;
      }));
      criteria.open=false;
      status.textContent='';
      result.hidden=false;
      inputPanel.hidden=true;
      result.focus({preventScroll:true});
    }catch(error){
      status.textContent=error instanceof Error?error.message:'과목 입력값을 확인하세요.';
    }
  });
}
