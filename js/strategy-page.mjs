// @ts-check
// 학생이 직접 넣는 정보는 가상 과목 4개 항목뿐입니다.
import {validateScenario} from './strategy-engine.mjs';
import {readProfile,deriveActionTimes,automaticSeed} from './reaction-profile.mjs';
const form=document.getElementById('strategy-form');
if(form){
  const body=document.getElementById('strategy-courses');
  const add=document.getElementById('strategy-add');
  const cancel=document.getElementById('strategy-cancel');
  const status=document.getElementById('strategy-status');
  const result=document.getElementById('strategy-result');
  const inputPanel=document.getElementById('strategy-input');
  const recommendation=document.getElementById('strategy-recommendation');
  const setup=document.getElementById('strategy-setup');
  const redo=document.getElementById('strategy-back');
  const clock=document.getElementById('strategy-clock');
  const reaction=document.getElementById('strategy-reaction');
  let worker=null;
  const initial=[
    {id:'A',name:'가상 A',rank:1,capacity:8,rivals:30},
    {id:'B',name:'가상 B',rank:2,capacity:20,rivals:50},
    {id:'C',name:'가상 C',rank:3,capacity:20,rivals:30},
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
        input.setAttribute('aria-label',item.id+' '+({name:'과목 이름',rank:'중요 순위',capacity:'가상 정원',rivals:'경쟁자'}[field]));
        input.type=field==='name'?'text':'number';
        if(field==='name')input.maxLength=30;
        else{
          input.min=field==='rivals'?'0':'1';
          input.max=field==='rank'?String(items.length):field==='capacity'?'50':'200';
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
    add.disabled=items.length>=8;
  }
  function refreshProfile(){
    const p=readProfile(localStorage);
    reaction.textContent=p
      ?'반응속도 중앙값 '+p.medianMs+'ms · 행동시간 자동 적용'
      :'반응속도 측정 결과 없음 · 먼저 테스트를 완료하세요.';
    return p;
  }
  function scenario(){
    const profile=refreshProfile();
    if(!profile)throw new RangeError('반응속도 테스트를 먼저 완료해야 전략을 계산할 수 있습니다.');
    return validateScenario({
      courses:readRows(),seed:automaticSeed().seed,trials:1000,...deriveActionTimes(profile),
    });
  }
  function busy(active){
    for(const input of form.querySelectorAll('input,button'))input.disabled=active;
    cancel.hidden=!active;
    if(!active)add.disabled=body.children.length>=8;
  }
  renderRows(initial);
  const displayed=automaticSeed();
  clock.textContent=displayed.label;
  refreshProfile();
  add.addEventListener('click',()=>{
    const items=readRows();if(items.length>=8)return;
    const id='ABCDEFGH'.split('').find(c=>!items.some(row=>row.id===c));
    if(!id)return;
    items.push({id,name:'가상 '+id,rank:items.length+1,capacity:15,rivals:30});
    renderRows(items);
  });
  cancel.addEventListener('click',()=>{
    if(!worker)return;
    worker.terminate();worker=null;busy(false);
    status.textContent='계산을 취소했습니다.';
  });
  redo.addEventListener('click',()=>{
    result.hidden=true;inputPanel.hidden=false;refreshProfile();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();if(worker)return;
    let input;
    try{input=scenario();}
    catch(error){status.textContent=error instanceof Error?error.message:'입력값을 확인하세요.';return;}
    if(typeof Worker!=='function'){
      status.textContent='이 브라우저는 별도 계산 스레드를 지원하지 않습니다.';return;
    }
    try{worker=new Worker(new URL('./strategy-worker.mjs',import.meta.url),{type:'module'});}
    catch{status.textContent='계산 스레드를 실행하지 못했습니다.';return;}
    const active=worker;busy(true);
    clock.textContent=automaticSeed().label;
    status.textContent='가상 경쟁 조건을 1,000회 반복 실험 중입니다.';
    active.addEventListener('message',event=>{
      if(worker!==active)return;
      const message=event.data;
      active.terminate();worker=null;busy(false);
      if(message.type==='error'){status.textContent=message.message;return;}
      const r=message.result;
      recommendation.textContent='신청 순서는 '+r.order.join(' → ')+
        ' 순으로 하는 게 좋고, 모든 과목 성공 확률은 '+r.allRate.toFixed(1)+'%입니다.';
      setup.textContent='반응속도 측정 자동 반영 · 합성 도착률 가정 · 1,000회 반복';
      result.hidden=false;inputPanel.hidden=true;
    });
    active.addEventListener('error',()=>{
      if(worker!==active)return;
      active.terminate();worker=null;busy(false);
      status.textContent='계산 중 오류가 발생했습니다.';
    });
    active.postMessage(input);
  });
}
