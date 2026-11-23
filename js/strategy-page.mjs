// @ts-check
// 합성 경쟁 모델의 입력·Worker 실행·공유 카드 생성만 담당합니다.
import {validateScenario} from './strategy-engine.mjs';
import {saveReportCard} from './lab-share.mjs';
const form=document.getElementById('strategy-form');
if(form){
  const body=document.getElementById('strategy-courses');
  const add=document.getElementById('strategy-add');
  const run=document.getElementById('strategy-run');
  const cancel=document.getElementById('strategy-cancel');
  const status=document.getElementById('strategy-status');
  const result=document.getElementById('strategy-result');
  const rows=document.getElementById('strategy-results');
  const sensitivity=document.getElementById('strategy-sensitivity');
  const details=document.getElementById('strategy-details');
  const share=document.getElementById('strategy-share');
  let worker=null,reportRows=[];
  const initial=[
    {id:'A',name:'가상 A',weight:5,capacity:8,rivals:30,rate:0.08,manualOrder:1},
    {id:'B',name:'가상 B',weight:4,capacity:20,rivals:50,rate:0.05,manualOrder:2},
    {id:'C',name:'가상 C',weight:2,capacity:20,rivals:30,rate:0.04,manualOrder:3},
  ];
  function createCell(text){
    const td=document.createElement('td');td.textContent=text;return td;
  }
  function readRows(){
    return [...body.querySelectorAll('tr')].map(row=>{
      const get=field=>row.querySelector('[data-field="'+field+'"]')?.value??'';
      return {
        id:row.dataset.id,name:get('name').trim(),weight:Number(get('weight')),
        capacity:Number(get('capacity')),rivals:Number(get('rivals')),
        rate:Number(get('rate')),manualOrder:Number(get('manualOrder')),
      };
    });
  }
  function showRows(items){
    body.replaceChildren();
    for(const item of items){
      const tr=document.createElement('tr');
      tr.dataset.id=item.id;
      tr.append(createCell(item.id));
      for(const [field,label,type,min,max,step] of [
        ['name','과목 이름','text',null,null,null],
        ['weight','중요도','number',1,5,1],
        ['capacity','가상 정원','number',1,50,1],
        ['rivals','경쟁자 수','number',0,200,1],
        ['rate','도착률 (초당)','number',0.01,1,0.01],
        ['manualOrder','직접 선택 순서','number',1,8,1],
      ]){
        const td=document.createElement('td');
        const input=document.createElement('input');
        input.dataset.field=field;
        input.setAttribute('aria-label',item.id+' '+label);
        input.type=type;
        if(type==='number'){
          input.min=String(min);input.max=String(max);input.step=String(step);
        }else input.maxLength=30;
        input.required=true;input.value=String(item[field]);
        td.append(input);tr.append(td);
      }
      const td=document.createElement('td'),remove=document.createElement('button');
      remove.type='button';remove.textContent='삭제';remove.className='lab-text-button';
      remove.setAttribute('aria-label',item.id+' 삭제');
      remove.disabled=items.length<=2;
      remove.addEventListener('click',()=>{
        const next=readRows().filter(course=>course.id!==item.id);
        next.forEach((course,index)=>course.manualOrder=index+1);
        showRows(next);
      });
      td.append(remove);tr.append(td);body.append(tr);
    }
    add.disabled=items.length>=8;
  }
  function setBusy(busy){
    worker=busy?worker:null;
    for(const element of form.querySelectorAll('input,select,button'))element.disabled=busy;
    cancel.hidden=!busy;
    if(!busy)add.disabled=body.children.length>=8;
  }
  function makeScenario(){
    const value=name=>Number(form.elements.namedItem(name)?.value);
    return validateScenario({
      courses:readRows(),
      seed:value('seed'),trials:value('trials'),
      startDelayMs:Math.round(value('startDelay')*1000),
      actionMs:Math.round(value('actionInterval')*1000),
      jitterMs:Math.round(value('jitter')*1000),
    });
  }
  const number=value=>Number(value).toFixed(1);
  function render(reports){
    const base=reports.find(item=>item.id==='base')?.result;
    if(!base)throw new Error('기준 조건 결과가 없습니다.');
    rows.replaceChildren();
    for(const line of base.results){
      const tr=document.createElement('tr');
      for(const text of [
        line.label,number(line.mean)+'점 ± '+number(line.margin),
        number(line.allRate)+'%',line.order.join(' → '),
      ])tr.append(createCell(text));
      rows.append(tr);
    }
    sensitivity.replaceChildren();
    for(const variation of reports){
      const best=variation.result.results.reduce((a,b)=>a.mean>=b.mean?a:b);
      const item=document.createElement('li');
      item.textContent=variation.label+': '+best.label+' '+number(best.mean)+'점';
      sensitivity.append(item);
    }
    const paired=base.comparisons.map(pair=>{
      const label=pair.first==='priority'?'중요도 우선':'가상 소진속도 우선';
      const sign=pair.meanDifference>=0?'+':'';
      return label+' - 직접 정한 순서: '+sign+number(pair.meanDifference)+
        '점 (Monte Carlo 95% 오차 ±'+number(pair.margin)+'점)';
    });
    details.textContent='시드 '+base.seed+' · 회당 '+base.trials+'회 반복. '+
      paired.join(' / ')+' · 오차범위는 합성 반복의 표본오차이며 실제 성공률이 아닙니다.';
    reportRows=[
      '난수 시드 '+base.seed+' · 반복 '+base.trials+'회',
      ...base.results.map(line=>line.label+' '+number(line.mean)+'점 · 전부 성공 '+number(line.allRate)+'%'),
      ...paired,
    ];
    result.hidden=false;
    share.disabled=false;
    status.textContent='합성 조건의 비교가 끝났습니다. 실제 학교 수강신청에 대한 예측이 아닙니다.';
  }
  showRows(initial);
  add.addEventListener('click',()=>{
    const current=readRows();
    if(current.length>=8)return;
    const used=new Set(current.map(item=>item.id));
    const id='ABCDEFGH'.split('').find(letter=>!used.has(letter));
    if(!id)return;
    current.push({id,name:'가상 '+id,weight:3,capacity:15,rivals:30,rate:0.05,manualOrder:current.length+1});
    showRows(current);
  });
  cancel.addEventListener('click',()=>{
    if(!worker)return;
    worker.terminate();worker=null;setBusy(false);
    status.textContent='계산을 중단했습니다. 이전 결과가 있더라도 새 실험으로 갱신됩니다.';
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(worker)return;
    let scenario;
    try{scenario=makeScenario();}
    catch(error){status.textContent=error instanceof Error?error.message:'입력값을 확인해 주세요.';return;}
    if(typeof Worker!=='function'){
      status.textContent='이 브라우저에서 Web Worker를 지원하지 않아 계산을 실행할 수 없습니다.';
      return;
    }
    result.hidden=true;share.disabled=true;reportRows=[];
    try{worker=new Worker(new URL('./strategy-worker.mjs',import.meta.url),{type:'module'});}
    catch{status.textContent='별도 계산 스레드를 생성하지 못했습니다.';return;}
    const activeWorker=worker;
    setBusy(true);
    status.textContent='가상 경쟁자 도착시각을 생성하고 있습니다. 조건 0 / 5';
    activeWorker.addEventListener('message',event=>{
      if(worker!==activeWorker)return;
      const message=event.data;
      if(message.type==='progress'){
        status.textContent='가상 조건 '+message.done+' / '+message.total+' 분석 중…';
      }else if(message.type==='complete'){
        activeWorker.terminate();worker=null;setBusy(false);
        try{render(message.reports);}
        catch(error){status.textContent=error instanceof Error?error.message:'분석 결과를 표시하지 못했습니다.';}
      }else if(message.type==='error'){
        activeWorker.terminate();worker=null;setBusy(false);
        status.textContent=message.message;
      }
    });
    activeWorker.addEventListener('error',()=>{
      if(worker!==activeWorker)return;
      activeWorker.terminate();worker=null;setBusy(false);
      status.textContent='시뮬레이션을 실행하지 못했습니다. 다시 시도해 주세요.';
    });
    activeWorker.postMessage(scenario);
  });
  share.addEventListener('click',async()=>{
    if(!reportRows.length)return;
    try{await saveReportCard('수강신청 전략 가상 실험',reportRows,'hanmo-strategy.png');}
    catch(error){status.textContent=error instanceof Error?error.message:'결과 카드를 저장하지 못했습니다.';}
  });
}
