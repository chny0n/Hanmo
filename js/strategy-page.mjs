// @ts-check
// 가상 과목 입력과 추천 순서를 화면에 표시합니다.
import {MAX_COURSES,MAX_RIVALS,recommendCourses} from './strategy-recommendation.mjs';
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
          input.max=field==='rank'?String(items.length):field==='capacity'?'300':String(MAX_RIVALS);
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
  const sensitivity=document.getElementById('strategy-sensitivity');
  const sensitivitySummary=document.getElementById('strategy-sensitivity-summary');
  const sensitivityList=document.getElementById('strategy-sensitivity-list');
  let sensitivityWorker=null;
  function stopSensitivity(){
    sensitivityWorker?.terminate();
    sensitivityWorker=null;
  }
  function startSensitivity(courses,order,rankLabels){
    stopSensitivity();
    const values=new Map();
    const positions=new Map(order.map(({id},index)=>[id,index+1]));
    sensitivityList.replaceChildren(...order.map(({id,name},index)=>{
      const row=document.createElement('li');
      const value=document.createElement('span');
      value.textContent='계산 중';
      values.set(id,value);
      const position=document.createElement('strong');
      position.textContent=(index+1)+'번째';
      position.title=name;
      row.append(position,' ',value);
      return row;
    }));
    sensitivitySummary.textContent='· 계산 중';
    let nearest=null;
    function showError(){
      stopSensitivity();
      sensitivitySummary.textContent='· 계산할 수 없음';
      for(const value of values.values())value.textContent='계산할 수 없음';
    }
    try{
      const worker=new Worker(new URL('./strategy-sensitivity-worker.mjs',import.meta.url),{type:'module'});
      sensitivityWorker=worker;
      worker.addEventListener('error',()=>{
        if(sensitivityWorker===worker)showError();
      });
      worker.addEventListener('message',({data})=>{
        if(sensitivityWorker!==worker)return;
        if('checkedDistance' in data){
          if(nearest===null)sensitivitySummary.textContent='· ±'+data.checkedDistance+'명까지 확인 중';
          return;
        }
        const {id,changes}=data;
        const value=values.get(id);
        value.textContent=changes.length
          ?changes.map(({delta,moved})=>{
            const count=delta>0?'+'+delta:'−'+Math.abs(delta);
            const slots=moved.map(movedId=>positions.get(movedId)).sort((a,b)=>a-b).join('·');
            return count+'명 · '+slots+'번째 자리 변경';
          }).join(' / ')
          :'0~'+MAX_RIVALS+'명에서 동일';
        values.delete(id);
        for(const {delta,moved} of changes){
          const distance=Math.abs(delta);
          nearest=Math.min(nearest??distance,distance);
          if(distance===1){
            for(const movedId of moved){
              const label=rankLabels.get(movedId);
              if(!label.textContent.endsWith(' 참고'))label.textContent+=' 참고';
            }
          }
        }
        if(nearest!==null)sensitivitySummary.textContent='· 최소 '+nearest+'명 차이';
        if(!values.size){
          if(nearest===null)sensitivitySummary.textContent='· 입력 범위에서 그대로';
          stopSensitivity();
        }
      });
      worker.postMessage({courses,orderedIds:order.map(course=>course.id)});
    }catch{
      showError();
    }
  }
  const ratioFormat=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:2});
  redo.addEventListener('click',()=>{
    stopSensitivity();
    result.hidden=true;
    inputPanel.hidden=false;
    status.textContent=instructions;
    body.querySelector('input').focus();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    try{
      const courses=readRows();
      const order=recommendCourses(courses);
      const rankLabels=new Map();
      orderList.replaceChildren(...order.map(({id,name,rank,capacity,rivals},slot)=>{
        const item=document.createElement('li');
        const headline=document.createElement('div');
        headline.className='strategy-card-head';
        const position=document.createElement('span');
        position.className='strategy-order-rank';
        position.textContent=(slot+1)+'번째';
        const demand=document.createElement('span');
        demand.className='strategy-course-demand';
        demand.textContent='중요 '+rank+'위';
        rankLabels.set(id,demand);
        headline.append(position,demand);
        const course=document.createElement('strong');
        course.textContent=name;
        const details=document.createElement('span');
        details.className='strategy-course-inputs';
        details.textContent='정원 '+capacity+'명 · 경쟁자 '+rivals+'명';
        const pressure=document.createElement('span');
        pressure.className='strategy-course-inputs';
        pressure.textContent=`자리당 ${ratioFormat.format(rivals/capacity)}명`;
        item.append(headline,course,details,pressure);
        return item;
      }));
      criteria.open=false;
      sensitivity.open=false;
      status.textContent='';
      result.hidden=false;
      inputPanel.hidden=true;
      result.focus({preventScroll:true});
      startSensitivity(courses,order,rankLabels);
    }catch(error){
      status.textContent=error instanceof Error?error.message:'과목 입력값을 확인하세요.';
    }
  });
}
