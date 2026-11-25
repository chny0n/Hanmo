// @ts-check
// 학생이 직접 넣는 정보는 가상 과목 4개 항목뿐입니다.
import {validateScenario} from './strategy-engine.mjs';
import {REACTION_KEY,readProfile,deriveActionTimes,automaticSeed} from './reaction-profile.mjs';
const form=document.getElementById('strategy-form');
if(form){
  const body=document.getElementById('strategy-courses');
  const add=document.getElementById('strategy-add');
  const cancel=document.getElementById('strategy-cancel');
  const status=document.getElementById('strategy-status');
  const result=document.getElementById('strategy-result');
  const inputPanel=document.getElementById('strategy-input');
  const orderList=document.getElementById('strategy-order');
  const waitSummary=document.getElementById('strategy-wait-summary');
  const formulas=document.getElementById('strategy-formulas');
  const formulaValues=document.getElementById('strategy-formula-values');
  const redo=document.getElementById('strategy-back');
  const clock=document.getElementById('strategy-clock');
  const reaction=document.getElementById('strategy-reaction');
  let worker=null;
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
    add.disabled=items.length>=8;
  }
  function refreshProfile(){
    const p=readProfile();
    reaction.textContent=p
      ?'반응속도 중앙값 '+p.medianMs+'ms · 행동시간 자동 적용'
      :'반응속도 측정 결과 없음 · 먼저 테스트를 완료하세요.';
    return p;
  }
  function scenario(seed){
    const profile=refreshProfile();
    if(!profile)throw new RangeError('반응속도 테스트를 먼저 완료해야 전략을 계산할 수 있습니다.');
    return validateScenario({
      courses:readRows(),seed,trials:1000,...deriveActionTimes(profile),
    });
  }
  function busy(active){
    for(const input of form.querySelectorAll('input,button'))input.disabled=active;
    cancel.hidden=!active;
    add.disabled=active||body.rows.length>=8;
    for(const button of body.querySelectorAll('button'))button.disabled=active||body.rows.length<=2;
  }
  renderRows(initial);
  const displayed=automaticSeed();
  clock.textContent=displayed.label;
  refreshProfile();
  window.addEventListener('storage',event=>{
    if(event.key===REACTION_KEY||event.key===null)refreshProfile();
  });
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)refreshProfile();
  });
  add.addEventListener('click',()=>{
    const items=readRows();if(items.length>=8)return;
    const id='ABCDEFGH'.split('').find(c=>!items.some(row=>row.id===c));
    if(!id)return;
    items.push({id,name:'과목 '+id,rank:items.length+1,capacity:15,rivals:30});
    renderRows(items);
  });
  cancel.addEventListener('click',()=>{
    if(!worker)return;
    worker.terminate();worker=null;busy(false);
    status.textContent='계산을 취소했습니다.';
  });
  redo.addEventListener('click',()=>{
    result.hidden=true;inputPanel.hidden=false;refreshProfile();
    form.querySelector('input').focus();
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();if(worker)return;
    const {seed,label}=automaticSeed();
    let input;
    try{input=scenario(seed);}
    catch(error){status.textContent=error instanceof Error?error.message:'입력값을 확인하세요.';return;}
    if(typeof Worker!=='function'){
      status.textContent='이 브라우저는 별도 계산 스레드를 지원하지 않습니다.';return;
    }
    try{worker=new Worker(new URL('./strategy-worker.mjs',import.meta.url),{type:'module'});}
    catch{status.textContent='계산 스레드를 실행하지 못했습니다.';return;}
    const active=worker;busy(true);
    clock.textContent=label;
    status.textContent='1,000회 반복 실험 중입니다.';
    active.addEventListener('message',event=>{
      if(worker!==active)return;
      const message=event.data;
      active.terminate();worker=null;busy(false);
      if(message.type==='error'){status.textContent=message.message;return;}
      const r=message.result;
      const outcome=(wins,guaranteed=r.guaranteed)=>{
        if(guaranteed)return '100%';
        if(wins===0)return '성공 미관측 (0/'+r.trials+'회)';
        if(wins===r.trials)return '실패 미관측 ('+r.trials+'/'+r.trials+'회)';
        return (100*wins/r.trials).toFixed(1)+'%';
      };
      /** @param {number} x 0~1 비율 */
      const pct=x=>(100*x).toFixed(1)+'%';
      // 기존 엔진의 추천 순서·관측 횟수·표본 오차를 서로 다른 표시 영역에 배치합니다.
      const set=(id,value)=>{document.getElementById(id).textContent=value;};
      orderList.replaceChildren(...r.order.map((name,slot)=>{
        const item=document.createElement('li');
        const rank=document.createElement('span');rank.className='strategy-order-rank';rank.textContent=(slot+1)+'번째';
        const course=document.createElement('strong');course.textContent=name;
        const rate=document.createElement('span');rate.className='strategy-course-rate';
        rate.textContent=outcome(Math.round(r.courseSuccess[slot]*r.trials),r.courseGuaranteed[slot]);
        const bar=document.createElement('div');bar.className='strategy-course-track';bar.setAttribute('aria-hidden','true');
        const fill=document.createElement('span');
        // 추천 순서와 관측 성공률을 같은 카드에서 확인합니다.
        fill.style.width=pct(r.courseSuccess[slot]);bar.append(fill);
        item.append(rank,course,rate,bar);
        return item;
      }));
      set('strategy-overall-value',outcome(r.allWins));
      set('strategy-sampling',r.guaranteed?'모든 과목의 정원이 경쟁자보다 많음':
        '반복 실험 오차 95% 범위 '+pct(r.uncertainty.allWins[0])+'~'+pct(r.uncertainty.allWins[1]));
      set('strategy-expected-value',r.expectedCourses.toFixed(2)+' / '+r.order.length+'개');
      set('strategy-completion-value',(r.timing.meanCompletionMs/1000).toFixed(1)+'초');
      set('strategy-wait-value',(r.timing.meanWaitMs/1000).toFixed(1)+'초');
      set('strategy-queue-value','혼잡 대기 '+(r.timing.meanQueueWaitMs/1000).toFixed(1)+'초 포함');
      set('strategy-low-overlap',outcome(r.sensitivity.lessOverlap));
      set('strategy-baseline-value',outcome(r.allWins));
      set('strategy-high-overlap',outcome(r.sensitivity.moreOverlap));
      set('strategy-synchronized',outcome(r.sensitivity.synchronized));
      set('strategy-assumption-range','경쟁 가정별 관측 범위 '+pct(r.uncertainty.assumptionRange.min)+'~'+pct(r.uncertainty.assumptionRange.max));
      set('strategy-run-info','조건별 독립 평가 '+r.trials.toLocaleString('ko-KR')+'회 · 실험 시드 '+r.seed+' · 실제 수강신청 예측 아님');
      waitSummary.textContent='평균 누적 대기시간 '+(r.timing.meanWaitMs/1000).toFixed(1)+
        '초 (혼잡 대기 '+(r.timing.meanQueueWaitMs/1000).toFixed(1)+
        '초 포함) · 전체 신청 시도 평균 소요시간 '+(r.timing.meanCompletionMs/1000).toFixed(1)+'초';
      // 현재 실행에 사용된 값을 표시하며 재실험 결과는 항상 접힌 상태에서 시작합니다.
      formulaValues.textContent='N = '+input.courses.length+' · M = '+r.trials+' · a = '+input.actionMs+
        'ms · σ = '+input.jitterMs+'ms · t₀ = '+input.startDelayMs+'ms · τ_min = '+r.serverServiceMs+'ms · 실험 시드 '+r.seed;
      formulas.open=false;
      result.hidden=false;inputPanel.hidden=true;
      result.scrollTop=0;
      result.focus({preventScroll:true});
    });
    active.addEventListener('error',()=>{
      if(worker!==active)return;
      active.terminate();worker=null;busy(false);
      status.textContent='계산 중 오류가 발생했습니다.';
    });
    active.postMessage(input);
  });
}
