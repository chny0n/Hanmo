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
        rank:Number(input('rank')),capacity:Number(input('capacity')),rivals:Number(input('rivals')),
        important:row.querySelector('[data-field="important"]').checked};
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
      const flagCell=document.createElement('td'),flag=document.createElement('input');
      flag.type='checkbox';flag.dataset.field='important';flag.checked=Boolean(item.important);
      flag.setAttribute('aria-label',item.id+' 중요 과목');
      flagCell.append(flag);tr.append(flagCell);
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
    items.push({id,name:'과목 '+id,rank:items.length+1,capacity:15,rivals:30,important:false});
    renderRows(items);
  });
  const criteria=document.getElementById('strategy-criteria');
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
      orderList.replaceChildren(...order.map(({name,rank,capacity,rivals,important},slot)=>{
        const item=document.createElement('li');
        const headline=document.createElement('div');
        headline.className='strategy-card-head';
        const position=document.createElement('span');
        position.className='strategy-order-rank';
        position.textContent=(slot+1)+'번째';
        const demand=document.createElement('span');
        demand.className='strategy-course-demand';
        const competition=rivals>=capacity?'경합':'정원 여유';
        demand.textContent=important?'중요 · '+competition:competition;
        headline.append(position,demand);
        const course=document.createElement('strong');
        course.textContent=name;
        const details=document.createElement('span');
        details.className='strategy-course-inputs';
        details.textContent='중요 '+rank+'위 · 정원 '+capacity+'명 · 경쟁자 '+rivals+'명';
        item.append(headline,course,details);
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
