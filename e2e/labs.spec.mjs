import {test,expect} from '@playwright/test';

const profile={version:1,medianMs:250,p90Ms:420,variationMs:170,count:8,measuredAt:0};
const seedProfile=async page=>{
  await page.addInitScript(p=>{
    localStorage.setItem('hanmo.reaction.profile.v1',JSON.stringify({...p,measuredAt:Date.now()}));
  },profile);
};


// scrollIntoView를 호출하지 않고 화면 안에 실제 배치됐는지 검사합니다.
const expectOneScreen=async(page,selector)=>{
  const geometry=await page.locator(selector).evaluate(root=>{
    const footer=document.querySelector('body > .hanmo-policy-footer')?.getBoundingClientRect();
    const main=document.querySelector('main')?.getBoundingClientRect();
    const limit=Math.min(footer?.top??innerHeight,main?.bottom??innerHeight);
    const bounds=root.getBoundingClientRect();
    const clipped=[];
    for(const node of [root,...root.querySelectorAll('*')]){
      const style=getComputedStyle(node),rect=node.getBoundingClientRect();
      if(!node.getClientRects().length||!rect.width||!rect.height||style.visibility!=='visible')continue;
      if(node.closest('.strategy-formula-body,#notice-list,#catalog-results'))continue;
      const closedDetails=node.closest('details:not([open])');
      if(closedDetails&&node!==closedDetails&&!node.closest('summary'))continue;
      // 달력의 1px 보조 텍스트는 화면에 그리지 않고 접근성 트리에만 남긴다. 실제 날짜와 조작은 계속 검사한다.
      const interactive='button,a[href],input,select,textarea,[tabindex],[contenteditable="true"]';
      if(node.closest('#calendar-view')&&style.position==='absolute'&&rect.width<=1.1&&rect.height<=1.1&&
         (style.clip!=='auto'||style.clipPath!=='none'||style.overflow==='hidden')&&
         !node.matches(interactive)&&!node.querySelector(interactive))continue;
      if(rect.top<bounds.top-1||rect.bottom>limit+1||rect.left< -1||rect.right>innerWidth+1||
        (['auto','scroll','hidden','clip'].includes(style.overflowY)&&node.clientHeight&&node.scrollHeight>node.clientHeight+2)){
        clipped.push({tag:node.id||node.className?.baseVal||node.className||node.tagName,top:rect.top,bottom:rect.bottom});
      }
    }
    return {clipped,limit,bottom:bounds.bottom,scrollHeight:root.scrollHeight,clientHeight:root.clientHeight,
      document:document.documentElement.scrollHeight,viewport:innerHeight};
  });
  expect(geometry.clipped,selector+' '+JSON.stringify(geometry)).toEqual([]);
  expect(geometry.bottom,selector).toBeLessThanOrEqual(geometry.limit+1);
  expect(geometry.scrollHeight,selector).toBeLessThanOrEqual(geometry.clientHeight+2);
  expect(geometry.document,selector).toBeLessThanOrEqual(geometry.viewport+2);
};

test('홈과 각 화면에서 새로운 공통 상단 바를 사용한다',async({page})=>{
  const pages=['/index.html','/html/vsugang.html','/html/result.html',
    '/html/readiness.html','/html/reaction-test.html',
    '/html/strategy-lab.html','/html/academic-timeline.html','/html/catalog.html'];
  for(const path of pages){
    await page.goto(path);
    const links=await page.locator('.hanmo-topbar a').allTextContents();
    expect(links.map(t=>t.trim()),path).toEqual([
      '한모','PC 진단','반응속도 테스트','전략 실험','학사 정보','강의 검색','내정보',
    ]);
    await expect(page.locator('.hanmo-topbar a[href*="academic-support"]')).toHaveCount(0);
    await expect(page.locator('.hanmo-topbar a[href*="academic-calendar"]')).toHaveCount(0);
  }
});

test('PC 진단은 실행 전 요청이 없고 PC 지표 10개의 독립 등급을 표시한다',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{value:6}));
  await seedProfile(page);
  const requests=[];
  page.on('request',request=>requests.push(request.url()));
  await page.goto('/html/readiness.html');
  await expect(page.locator('body')).not.toContainText(/p95/i);
  await expect(page.locator('#readiness-result')).toBeHidden();
  await expect(page.locator('#readiness-network')).toBeChecked();
  expect(requests.some(u=>u.includes('network-probe.txt'))).toBe(false);
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-result')).toBeVisible({timeout:30000});
  await expect(page.locator('body')).not.toContainText(/p95/i);
  for(const metric of ['frame','drift']){
    await expect(page.locator(`#readiness-${metric}-value`)).toContainText(/95백분위수 \d+\.\dms/);
  }
  await expect(page.locator('#readiness-speed-value')).toContainText('Mbps');
  await expect(page.locator('#readiness-latency-value')).toContainText('ms');
  await expect(page.locator('#readiness-jitter-value')).toContainText('ms');
  await expect(page.locator('#readiness-error-value')).toHaveText('0/7회 실패 · 0회 제외');
  const grades=page.locator('[data-metric-grade]');
  await expect(grades).toHaveCount(10);
  expect(await grades.evaluateAll(nodes=>nodes.every(node=>['A','B','C','D','F','none'].includes(node.getAttribute('data-grade'))))).toBe(true);
  await expect(page.locator('[data-metric-grade="error"]')).toHaveAttribute('data-grade','A');
  await expect(page.locator('[data-metric-grade="threads"]')).toHaveAttribute('data-grade','B');
  await expect(page.locator('#readiness-advice')).toContainText('논리 코어');
  await expect(page.locator('#readiness-advice')).toHaveCSS('background-color','rgb(48, 41, 27)');
  await expect(page.locator('#readiness-advice')).toHaveCSS('border-left-width','4px');
  await expect(page.locator('#readiness-advice-heading')).toHaveCSS('color','rgb(255, 220, 151)');
  await expect(page.locator('#readiness-advice-list li').first()).toHaveCSS('font-weight','600');
  await expect(page.locator('main')).not.toContainText('반응속도 테스트');
  for(const [grade,rgb] of [['A','34, 197, 94'],['B','249, 115, 22'],['C','234, 179, 8'],['D','146, 64, 14'],['F','220, 38, 38']]){
    await expect(page.locator('.readiness-grade-legend [data-grade="'+grade+'"]')).toHaveCSS('background-color','rgb('+rgb+')');
  }
  const criteria=page.locator('#readiness-grade-criteria');
  await expect(criteria).toHaveJSProperty('open',false);
  await criteria.locator('summary').click();
  await expect(criteria).toHaveJSProperty('open',true);
  await expect(criteria).toContainText('미측정·미지원은 F가 아닙니다.');
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await expectOneScreen(page,'#readiness-result');
    await expect(page.locator('.readiness-criteria-list li').last()).toBeInViewport({ratio:1});
  }
  await criteria.locator('summary').click();
  await expect(criteria.locator('.readiness-criteria-list')).toBeHidden();
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await expectOneScreen(page,'#readiness-result');
    await expect(page.locator('[data-metric-grade="memory"]')).toBeInViewport({ratio:1});
    await expect(page.locator('#readiness-back')).toBeInViewport({ratio:1});
  }
  await expect(page.locator('#readiness-share')).toHaveCount(0);
  expect(requests.filter(u=>u.includes('network-probe.txt')).length).toBe(2);
  expect(requests.some(u=>/hufs\.ac\.kr/.test(u))).toBe(false);
});

test('클릭·Space·Enter·숫자패드 Enter로 반응속도 8회를 완료하면 저장된다',async({page})=>{
  test.setTimeout(65_000);
  await page.goto('/html/reaction-test.html');
  await expect(page.locator('.reaction-input-guide')).toContainText('Space · Enter');
  await page.locator('#reaction-start').click();
  await expect(page.locator('#reaction-target')).toContainText('Enter');
  for(let i=0;i<8;i++){
    const target=page.locator('#reaction-target');
    await expect(target).toHaveAttribute('data-phase','go',{timeout:5000});
    await expect(target).toContainText('Enter');
    await page.waitForTimeout(120);
    // 반복 키 입력은 유효한 표본을 소비하지 않습니다.
    if(i===2){
      await target.dispatchEvent('keydown',{key:'Enter',code:'Enter',repeat:true});
      await expect(target).toHaveAttribute('data-phase','go');
    }
    if(i%4===0)await target.click();
    else await page.keyboard.press(['','Space','Enter','NumpadEnter'][i%4]);
  }
  await expect(page.locator('#reaction-result')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hanmo.reaction.profile.v1')));
  expect(saved.count).toBe(8);
  expect(saved.medianMs).toBeGreaterThanOrEqual(80);
});

test('진단은 요청 실패를 분리하고 남은 브라우저 관측값을 표시한다',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.route('**/data/network-probe.txt?*',route=>route.abort());
  await page.goto('/html/readiness.html');
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-result')).toBeVisible();
  await expect(page.locator('#readiness-frame-value')).toContainText('fps 관측');
  await expect(page.locator('#readiness-speed-value')).toHaveText('미측정');
  await expect(page.locator('#readiness-error-value')).toContainText('2/7회 실패');
  await expect(page.locator('[data-metric-grade="speed"]')).toHaveAttribute('data-grade','none');
  await expect(page.locator('[data-metric-grade="error"]')).toHaveAttribute('data-grade','C');
  const advice=page.locator('#readiness-advice');
  await expect(advice).toBeVisible();
  await expect(advice).toContainText('유선 연결');
  await expectOneScreen(page,'#readiness-result');
  await expect(page.locator('#readiness-advice-heading')).toBeInViewport({ratio:1});
  await expect(page.locator('#readiness-back')).toBeEnabled();
  await page.locator('#readiness-back').click();
  await expect(advice).toBeHidden();
  await page.locator('#readiness-network').uncheck();
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-result')).toBeVisible();
  await expect(page.locator('#readiness-error-value')).toHaveText('미측정');
  for(const key of ['latency','jitter','speed','error']){
    await expect(page.locator('[data-metric-grade="'+key+'"]')).toHaveAttribute('data-grade','none');
  }
  await expect(advice).not.toContainText('요청 실패:');
});

test('긴 작업이 미지원이면 다른 PC 진단 결과를 계속 표시한다',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(PerformanceObserver,'supportedEntryTypes',{value:[]}));
  await page.goto('/html/readiness.html');
  await page.locator('#readiness-network').uncheck();
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-task-value')).toHaveText('지원되지 않음');
  await expect(page.locator('[data-metric-grade="task"]')).toHaveAttribute('data-grade','none');
  await expect(page.locator('#readiness-frame-value')).toContainText('fps 관측');
  await expect(page.locator('#readiness-latency-value')).toHaveText('미측정');
});

test('신호 전 입력과 탭 숨김은 반응 표본을 저장하지 않는다',async({page})=>{
  await page.goto('/html/reaction-test.html');
  await page.locator('#reaction-start').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#reaction-status')).toContainText('너무 빨리');
  await page.locator('#reaction-start').click();
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#reaction-status')).toContainText('탭이 숨겨져');
  await expect(page.locator('#reaction-count')).toHaveText('0 / 8');
  expect(await page.evaluate(()=>localStorage.getItem('hanmo.reaction.profile.v1'))).toBeNull();
});

test('저장에 실패해도 8회 반응 결과를 보여 준다',async({page})=>{
  await page.clock.install({time:new Date('2026-11-26T12:00:00Z')});
  await page.addInitScript(()=>{
    Math.random=()=>0;
    Storage.prototype.setItem=()=>{throw new Error('브라우저 저장 차단');};
  });
  await page.goto('/html/reaction-test.html');
  await page.clock.pauseAt(new Date('2026-11-26T12:05:00Z'));
  await page.locator('#reaction-start').click();
  const target=page.locator('#reaction-target');
  for(let i=0;i<8;i++){
    await page.clock.runFor(1000);
    await expect(target).toHaveAttribute('data-phase','go');
    await page.keyboard.press('Space');
    await expect(target).toHaveAttribute('data-phase','break');
    await page.clock.runFor(350);
  }
  await expect(page.locator('#reaction-report')).toBeVisible();
  await expect(page.locator('#reaction-report')).toHaveText(/^사용자님의 반응속도는 중앙값 \d+ms 입니다\.$/);
  await expect(page.locator('#reaction-status')).toHaveText('브라우저에 이번 반응속도 결과를 저장하지 못했습니다.');
  await expect(page.locator('#reaction-result a')).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('hanmo.reaction.profile.v1'))).toBeNull();
});

test('전략 실험은 네 개의 과목 입력만 요구하고 자동 행동시간으로 실행된다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  await expect(page.locator('#strategy-input')).not.toContainText('가상');
  await expect(page.locator('#strategy-status')).toContainText('한 번의 선착순 신청 회차');
  await expect(page.locator('#strategy-reaction')).toContainText('250ms');
  await expect(page.locator('#strategy-clock')).toContainText('시');
  await expect(page.locator('#strategy-courses tr')).toHaveCount(3);
  await expect(page.locator('#strategy-courses input')).toHaveCount(12);
  await expect(page.getByRole('textbox',{name:'A 과목 이름',exact:true})).toHaveValue('과목 A');
  await expect(page.getByRole('spinbutton',{name:'A 정원',exact:true})).toHaveValue('8');
  await page.getByRole('button',{name:'과목 추가',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'D 과목 이름',exact:true})).toHaveValue('과목 D');
  await page.getByRole('button',{name:'D 삭제',exact:true}).click();
  await expect(page.locator('#strategy-form input[name="seed"], #strategy-form input[name="startDelay"], #strategy-form input[name="actionInterval"]')).toHaveCount(0);
  await expect(page.locator('#strategy-share')).toHaveCount(0);
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-result')).toBeVisible({timeout:20000});
  await expect(page.locator('#strategy-recommendation')).toContainText('추천 신청 순서');
  await expect(page.locator('#strategy-recommendation')).toContainText('전체 성공률');
  await expect(page.locator('#strategy-recommendation')).not.toContainText('(기본 가정)');
  await expect(page.locator('#strategy-order li')).toHaveCount(3);
  await expect(page.locator('#strategy-order .strategy-course-rate')).toHaveCount(3);
  await expect(page.locator('#strategy-setup tbody tr')).toHaveCount(4);
  for(const name of ['낮은 경쟁 중복도','기본 조건','높은 경쟁 중복도','경쟁자 전원 동시 시작']){
    await expect(page.locator('#strategy-setup tbody')).toContainText(name);
  }
  await expect(page.locator('#strategy-run-info')).toContainText('실험 시드');
  await expect(page.locator('#strategy-expected-value')).toHaveText(/\d+\.\d{2} \/ 3개/);
  await expect(page.locator('#strategy-completion-value')).toHaveText(/\d+\.\d초/);
  await expect(page.locator('#strategy-wait-value')).toHaveText(/\d+\.\d초/);
  await expect(page.locator('#strategy-sampling')).toContainText('반복 실험 오차 95% 범위');
  await expect(page.locator('#strategy-assumption-range')).toContainText('경쟁 가정별 관측 범위');
  expect(await page.locator('.strategy-course-track span').evaluateAll(nodes=>nodes.every(node=>parseFloat(node.style.width)>=0&&parseFloat(node.style.width)<=100))).toBe(true);
  const assumptions=page.locator('#strategy-assumptions');
  await expect(assumptions).toHaveJSProperty('open',false);
  await expect(assumptions.locator('#strategy-rival-heading')).toBeHidden();
  await expect(assumptions.locator('#strategy-wait-heading')).toBeHidden();
  await assumptions.locator('summary').press('Enter');
  await expect(assumptions.locator('#strategy-rival-heading')).toBeVisible();
  await expect(assumptions).toContainText('본인 입력과 별도로 5~8과목에서 추출');
  await expect(assumptions).toContainText('오픈 후 1초 안에 진입');
  await expect(assumptions.locator('#strategy-wait-heading')).toBeVisible();
  await expect(assumptions.locator('#strategy-stable-wait')).not.toBeEmpty();
  await expect(page.locator('.strategy-course-rate').first()).toHaveAttribute('title',/가정별.*평균 처리 시각/);
  await expectOneScreen(page,'#strategy-result');
  await expect(page.locator('#strategy-wait-summary')).toHaveText(/평균 누적 대기시간 \d+\.\d초 \(혼잡 대기 \d+\.\d초 포함\) · 전체 신청 시도 평균 소요시간 \d+\.\d초/);
  await expect(page.locator('#strategy-result')).toContainText('실제 학교 서버의 대기시간을 측정한 값은 아닙니다.');
  await expect(page.locator('#strategy-result')).not.toContainText('경쟁자 중복');
  await expect(page.locator('#strategy-input')).toBeHidden();
  await expect(page.locator('#strategy-result')).toContainText('가상 처리율은 시작 후 2초까지 초당 50건, 5초까지 80건, 이후 100건이며 혼잡이 없는 기본 응답시간은 1~3초');
  await assumptions.locator('summary').press('Enter');
  await expect(assumptions).toHaveJSProperty('open',false);
  const formulas=page.locator('#strategy-formulas');
  const summary=formulas.locator('summary');
  await expect(summary).toHaveText('수식 보기');
  await expect(formulas).toHaveJSProperty('open',false);
  await expect(formulas.locator('.strategy-formula-body')).toBeHidden();
  await page.setViewportSize({width:1280,height:720});
  await expectOneScreen(page,'#strategy-result');
  await summary.click();
  await expect(formulas).toHaveJSProperty('open',true);
  await expect(formulas.locator('.strategy-formula-body')).toBeVisible();
  await expect(page.locator('#strategy-order')).toBeHidden();
  await expect(page.locator('#strategy-results-heading')).toBeVisible();
  await expect(page.locator('#strategy-back')).toBeInViewport({ratio:1});
  const formulaScroll=await formulas.locator('.strategy-formula-body').evaluate(el=>({client:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY}));
  expect(formulaScroll.overflow).toBe('auto');
  expect(formulaScroll.scroll).toBeGreaterThan(formulaScroll.client);
  await expect(page.locator('#strategy-formula-values')).toContainText('N = 3 · M = 1000 · a = 630ms · σ = 170ms · t₀ = 0ms');
  await expect(page.locator('#strategy-formula-values')).toContainText('τ_min = 10ms');
  await expect(formulas.locator('code')).toHaveCount(0);
  await expect(formulas.locator('math')).toHaveCount(39);
  await expect(page.locator('#strategy-result')).toContainText('240~300ms 사이에서 변합니다');
  for(const id of ['rival-group','rival-reaction','rival-lognormal','rival-jitter','rival-tail','rival-action','fitts','fitts-geometry','population','overlap','membership','workload','background-urgency','preference','choice','entry','entry-share','service','base-delay','queue-start','queue-end','queue-wait','objective','all-success','evaluated-course','expected-courses']){
    await expect(formulas.locator('math[data-formula="'+id+'"]')).toBeVisible();
  }
  for(const width of [1200,800,400]){
    await page.setViewportSize({width,height:800});
    const overflowing=await formulas.locator('.strategy-math-line').evaluateAll(lines=>lines.filter(line=>{
      const style=getComputedStyle(line);
      return ['auto','scroll'].includes(style.overflowX)||line.scrollWidth>line.clientWidth+1;
    }).map(line=>line.querySelector('math')?.getAttribute('data-formula')));
    expect(overflowing).toEqual([]);
  }
  await page.setViewportSize({width:1200,height:800});
  const math=formulas.locator('math[data-formula="urgency"]');
  await expect(math.locator('msqrt mfrac')).toHaveCount(1);
  const fraction=await math.locator('mfrac').evaluate(el=>{
    const [num,den]=Array.from(el.children).map(child=>child.getBoundingClientRect());
    return {namespace:el.namespaceURI,numTop:num.top,denTop:den.top,numWidth:num.width,denWidth:den.width};
  });
  expect(fraction.namespace).toBe('http://www.w3.org/1998/Math/MathML');
  expect(fraction.denTop).toBeGreaterThan(fraction.numTop);
  expect(fraction.numWidth).toBeGreaterThan(0);
  expect(fraction.denWidth).toBeGreaterThan(0);
  await expect(formulas.locator('math[data-formula="all-success"] munderover')).toHaveCount(2);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(formulas).toHaveJSProperty('open',false);
});

test('전략 실험은 경쟁 중에는 100% 반올림을 피하고 충분한 정원은 100%로 표시한다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  const readout=page.locator('#strategy-recommendation');
  const capacity=page.getByRole('spinbutton',{name:'A 정원',exact:true});
  for(const id of ['B','C']){
    await page.getByRole('spinbutton',{name:id+' 경쟁자',exact:true}).fill('0');
  }
  await page.getByRole('spinbutton',{name:'A 경쟁자',exact:true}).fill('200');
  await capacity.fill('200');
  await page.locator('#strategy-run').click();
  await expect(readout).toContainText('실패 미관측');
  await page.locator('#strategy-back').click();
  await capacity.fill('201');
  await page.locator('#strategy-run').click();
  await expect(readout).toContainText('100%');
  await expect(readout).not.toContainText('(기본 가정)');
});

test('전략 실험은 다른 탭의 반응 프로필 등록과 삭제를 반영한다',async({page,context})=>{
  await page.goto('/html/strategy-lab.html');
  const measurement=await context.newPage();
  await measurement.goto('/html/reaction-test.html');
  await measurement.evaluate(p=>{
    localStorage.setItem('hanmo.reaction.profile.v1',JSON.stringify({...p,measuredAt:Date.now()}));
  },profile);
  const summary=page.locator('#strategy-reaction');
  await expect(summary).toContainText('250ms');
  await measurement.evaluate(()=>localStorage.removeItem('hanmo.reaction.profile.v1'));
  await expect(summary).toContainText('측정 결과 없음');
});

test('반응속도 기록이 없으면 결과를 임의 생성하지 않는다',async({page})=>{
  await page.goto('/html/strategy-lab.html');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toContainText('반응속도 테스트를 먼저');
  await expect(page.locator('#strategy-result')).toBeHidden();
});

test('전략 계산을 취소해도 최소 과목 수를 유지한다',async({page})=>{
  await seedProfile(page);
  await page.addInitScript(()=>{
    Worker.prototype.postMessage=()=>{};
  });
  await page.goto('/html/strategy-lab.html');
  const rows=page.locator('#strategy-courses tr');
  await rows.last().getByRole('button').click();
  await expect(rows).toHaveCount(2);
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toHaveText('1,000회 반복 실험 중입니다.');
  await page.locator('#strategy-cancel').click();
  await expect(page.locator('#strategy-status')).toHaveText('계산을 취소했습니다.');
  for(const button of await rows.getByRole('button').all()) await expect(button).toBeDisabled({timeout:1000});
  await expect(page.locator('#strategy-run')).toBeEnabled();
});

test('로컬 저장소 접근이 차단되어도 반응 테스트와 전략 화면이 응답한다',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});
  });
  await page.goto('/html/reaction-test.html');
  await page.locator('#reaction-start').click();
  await expect(page.locator('#reaction-target')).toBeEnabled({timeout:1000});
  await page.goto('/html/strategy-lab.html');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toContainText('반응속도 테스트를 먼저');
});

test('달력은 학사 달력 탭을 처음 열 때 한 번만 불러온다',async({page})=>{
  const resources=['/css/academic-calendar-vendor.css','/css/academic-calendar.css','/js/academic-calendar.js'];
  const calendarRequests=[];
  page.on('request',request=>{
    const path=new URL(request.url()).pathname;
    if(resources.includes(path))calendarRequests.push(path);
  });
  await page.goto('/html/academic-timeline.html');
  expect(calendarRequests).toHaveLength(0);
  await expect(page.getByRole('tab',{name:'학사 공지'})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'학사 달력'}).click();
  await expect(page.locator('#academic-calendar-panel')).toBeVisible();
  await expect(page.locator('#calendar-view [role="table"]')).toBeVisible();
  await expect(page.locator('#academic-notice-panel')).toBeHidden();
  await page.getByRole('tab',{name:'학사 공지'}).click();
  await expect(page.locator('#academic-notice-panel')).toBeVisible();
  await page.getByRole('tab',{name:'학사 공지'}).press('ArrowRight');
  await expect(page.locator('#calendar-view [role="table"]')).toBeVisible();
  expect(calendarRequests.sort()).toEqual(resources);
  expect((await page.request.get('/html/academic-support.html')).status()).toBe(404);
  expect((await page.request.get('/html/academic-calendar.html')).status()).toBe(404);
});

test('달력 스타일을 받지 못해도 학교 일정 원문과 공지 탭을 열 수 있다',async({page})=>{
  await page.route('**/css/academic-calendar-vendor.css',route=>route.abort());
  await page.goto('/html/academic-timeline.html#calendar');
  await expect(page.locator('#calendar-status')).toContainText('달력을 불러오지 못했습니다.');
  await expect(page.locator('#calendar-view [role="table"]')).toHaveCount(0);
  await expect(page.getByRole('link',{name:/학교 학사일정 원문/})).toBeVisible();
  await page.getByRole('tab',{name:'학사 공지'}).click();
  await expect(page.locator('#academic-notice-panel')).toBeVisible();
});

test.describe('Temporal API가 없는 브라우저',()=>{
  test.use({timezoneId:'UTC'});

  test('학사 달력은 서울 날짜로 표시하고 월을 이동한다',async({page})=>{
    await page.addInitScript(()=>Reflect.deleteProperty(globalThis,'Temporal'));
    await page.clock.setFixedTime(new Date('2026-11-30T15:00:00Z'));
    await page.goto('/html/academic-timeline.html#calendar');
    const calendar=page.locator('#calendar-view');
    const month=calendar.getByRole('heading');
    await expect(month).toHaveText('2026년 12월');
    await expect(calendar.locator('[data-date="2026-12-01"][aria-current="date"]')).toBeVisible();
    await calendar.getByRole('button',{name:'이전',exact:true}).click();
    await expect(month).toHaveText('2026년 11월');
    await calendar.getByRole('button',{name:'오늘',exact:true}).click();
    await expect(month).toHaveText('2026년 12월');
    expect(await page.evaluate(()=>typeof globalThis.Temporal)).toBe('undefined');
  });
});

test('모의수강신청 결과의 PNG 저장 UI와 스크립트를 제거한다',async({page})=>{
  await page.goto('/html/result.html');
  await expect(page.locator('#practice-report-save')).toHaveCount(0);
  await expect(page.locator('script[src*="practice-report-share"]')).toHaveCount(0);
  expect((await page.request.get('/js/practice-report-share.mjs')).status()).toBe(404);
});

test('반응속도 측정 결과는 중앙값만 한 줄로 표시된다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/reaction-test.html');
  await expect(page.locator('#reaction-result')).toBeVisible();
  await expect(page.locator('#reaction-report')).toHaveText('저장된 사용자님의 반응속도는 중앙값 250ms 입니다.');
  await expect(page.locator('#reaction-result a')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'내 반응시간'})).toHaveCount(0);
  await expect(page.locator('#reaction-result .lab-footnote')).toHaveCount(0);
});

test('다섯 기능 화면의 메뉴명·제목·i 도움말·구분선 좌표를 통일한다',async({page})=>{
  const routes=[
    ['readiness','PC 진단'],['reaction-test','반응속도 테스트'],
    ['strategy-lab','전략 실험'],['academic-timeline','학사 정보'],['catalog','강의 검색'],
  ];
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    const positions=[];
    for(const [slug,label] of routes){
      await page.goto('/html/'+slug+'.html');
      await expect(page.locator('.hanmo-topbar a[aria-current="page"]')).toHaveText(label);
      await expect(page.locator('main .hanmo-schoolmark h1')).toHaveText(label);
      await expect(page.locator('.hanmo-title-divider')).toHaveCount(1);
      await expect(page.locator('.hanmo-title-divider img')).toBeVisible();
      const info=page.locator('.hanmo-title-help-button');
      const tooltip=page.locator('.hanmo-title-help-tip');
      await expect(info).toHaveText('i');
      await expect(tooltip).toBeHidden();
      await info.hover();
      await expect(tooltip).toBeVisible();
      expect((await tooltip.innerText()).length).toBeLessThan(80);
      await page.mouse.move(0,0);
      await info.focus();
      await expect(tooltip).toBeVisible();
      const divider=await page.locator('.hanmo-title-divider').boundingBox();
      const title=await page.locator('.hanmo-schoolmark h1').boundingBox();
      expect(divider,slug).not.toBeNull();
      expect(title,slug).not.toBeNull();
      positions.push({slug,barTop:divider.y,barLeft:divider.x,barWidth:divider.width,titleTop:title.y});
    }
    for(const key of ['barTop','barLeft','barWidth','titleTop']){
      const values=positions.map(item=>item[key]);
      expect(Math.max(...values)-Math.min(...values),viewport.width+' '+key+' '+JSON.stringify(positions)).toBeLessThanOrEqual(1);
    }
  }
});

test('일반 PC 뷰포트에서 새 페이지와 통합 학사 화면의 문서 스크롤이 없다',async({page})=>{
  for(const viewport of [{width:1440,height:900},{width:1280,height:720}]){
    await page.setViewportSize(viewport);
    for(const route of ['/html/readiness.html','/html/reaction-test.html',
      '/html/strategy-lab.html','/html/academic-timeline.html']){
      await page.goto(route);
      const sizes=await page.evaluate(()=>({
        document:document.documentElement.scrollHeight,viewport:document.documentElement.clientHeight,
        main:document.querySelector('main')?.getBoundingClientRect().bottom,
        footer:document.querySelector('body > footer')?.getBoundingClientRect().top,
      }));
      expect(sizes.document,route).toBeLessThanOrEqual(sizes.viewport+2);
      expect(sizes.main,route).toBeLessThanOrEqual(sizes.footer+1);
    }
  }
});


test('1280×720에서 최대 8개 과목 입력과 모든 핵심 동작이 가려지지 않는다',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  for(let i=3;i<8;i++)await page.locator('#strategy-add').click();
  await expect(page.locator('#strategy-courses tr')).toHaveCount(8);
  const check=async selector=>{
    const p=await page.locator(selector).evaluate(el=>{
      const rect=el.getBoundingClientRect(),footer=document.querySelector('body > footer')?.getBoundingClientRect();
      return {top:rect.top,bottom:rect.bottom,limit:footer?.top??window.innerHeight};
    });
    expect(p.top,selector).toBeGreaterThanOrEqual(0);
    expect(p.bottom,selector).toBeLessThanOrEqual(p.limit+1);
  };
  await check('#strategy-courses tr:last-child');
  await check('#strategy-run');
  await check('#strategy-status');
});

test('8과목 결과의 추천 순서와 성공률은 좁은 화면에서도 가로 스크롤 없이 표시된다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  for(let i=3;i<8;i++)await page.locator('#strategy-add').click();
  for(const id of 'ABCDEFGH'){
    await page.getByRole('spinbutton',{name:id+' 경쟁자',exact:true}).fill('0');
    await page.getByRole('textbox',{name:id+' 과목 이름',exact:true}).fill(id+'수강신청전략실험긴과목명'.repeat(3).slice(0,29));
  }
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-result')).toBeVisible({timeout:20000});
  await expect(page.locator('#strategy-order li')).toHaveCount(8);
  await expect(page.locator('#strategy-order .strategy-course-rate')).toHaveCount(8);
  await expect(page.locator('#strategy-overall-value')).toHaveText('100%');
  await expect(page.locator('#strategy-expected-value')).toHaveText('8.00 / 8개');
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await expectOneScreen(page,'#strategy-result');
    await expect(page.locator('#strategy-back')).toBeInViewport({ratio:1});
    const heading=await page.locator('.strategy-order-heading').boundingBox();
    const order=await page.locator('#strategy-order').boundingBox();
    expect(order.y).toBeGreaterThanOrEqual(heading.y+heading.height);
    expect(order.width).toBeGreaterThanOrEqual(heading.width-1);
    await expect(page.locator('.strategy-course-rate').first()).toHaveCSS('font-size','18px');
    await expect(page.locator('.strategy-order-rank').first()).toHaveText('1번째');
  }
  for(const width of [1440,1200,800,400]){
    await page.setViewportSize({width,height:800});
    const overflow=await page.locator('#strategy-order, #strategy-order li, .strategy-result-metrics, .strategy-result-metrics>div, .strategy-conditions').evaluateAll(nodes=>
      nodes.filter(node=>node.scrollWidth>node.clientWidth+1).map(node=>node.className||node.tagName));
    expect(overflow).toEqual([]);
  }
});

test('학사정보와 강의 검색은 결과 목록만 세로 스크롤 예외로 둔다',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  for(const [route,id] of [['academic-timeline','notice-list'],['catalog','catalog-results']]){
    await page.goto('/html/'+route+'.html');
    const list=page.locator('#'+id);
    await expect(list).toHaveAttribute('tabindex','0');
    await expect(list).toHaveCSS('overflow-y','auto');
    // 실자료 연결 없이 긴 합성 목록의 레이아웃만 검증합니다.
    await list.evaluate(el=>{
      el.replaceChildren(...Array.from({length:40},(_,index)=>{
        const item=document.createElement('article');item.className='hanmo-item';
        const heading=document.createElement('h3');heading.textContent='합성 결과 '+(index+1);
        const text=document.createElement('p');text.textContent='화면 배치 시험용 가상 검색 결과';
        item.append(heading,text);return item;
      }));
    });
    const sizes=await list.evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight}));
    expect(sizes.height).toBeGreaterThan(0);
    expect(sizes.scroll).toBeGreaterThan(sizes.height);
    await expect(page.locator('body > footer')).toBeInViewport({ratio:1});
    expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(722);
  }
  await page.goto('/html/academic-timeline.html');
  await page.getByRole('tab',{name:'학사 달력'}).click();
  await expectOneScreen(page,'#academic-calendar-panel');
  const dates=page.locator('#calendar-view [role="cell"][data-date] .hanmo-calendar-date');
  expect(await dates.count()).toBeGreaterThanOrEqual(28);
  for(const date of await dates.all())await expect(date).toBeInViewport({ratio:1});
  for(const name of ['이전','다음','오늘'])await expect(page.locator('#calendar-view').getByRole('button',{name,exact:true})).toBeInViewport({ratio:1});
});

test('홈·모드 선택·개발자 소개는 기능 화면과 동일한 제목 및 구분선 기준을 사용한다',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-27T12:00:00+09:00'));
  for(const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);
    const positions=[];
    const titles=[];
    for(const route of ['/index.html','/html/vsugang.html','/html/developer.html','/html/readiness.html']){
      await page.goto(route);
      await page.evaluate(()=>document.fonts.ready);
      const title=page.locator('main h1').first();
      const divider=page.locator('main .hanmo-title-divider');
      await expect(title).toBeInViewport({ratio:1});
      await expect(divider).toBeInViewport({ratio:1});
      const h=await title.boundingBox(),d=await divider.boundingBox();
      positions.push({route,hTop:h.y,dTop:d.y,dWidth:d.width,center:d.x+d.width/2});
      titles.push((await title.innerText()).replace(/\s+/g,' ').trim());
      if(route.includes('vsugang'))await expect(page.locator('.grid')).toBeInViewport({ratio:1});
      if(route==='/index.html')await expect(page.locator('.buttonContainer')).toBeInViewport({ratio:1});
      if(route==='/html/developer.html'){
        await expect(page.locator('.hanmo-contributor-list li').last()).toBeInViewport({ratio:1});
        await expect(page.locator('.container > .button')).toBeInViewport({ratio:1});
        const geometry=await page.evaluate(()=>{
          const main=document.querySelector('main');
          const footer=document.querySelector('body > footer').getBoundingClientRect();
          const button=document.querySelector('.container > .button').getBoundingClientRect();
          return {height:main.clientHeight,scroll:main.scrollHeight,footerTop:footer.top,buttonBottom:button.bottom};
        });
        expect(geometry.scroll).toBeLessThanOrEqual(geometry.height+1);
        expect(geometry.buttonBottom).toBeLessThanOrEqual(geometry.footerTop+1);
      }
      await expect(page.locator('body > footer')).toBeInViewport({ratio:1});
    }
    expect(titles[0]).toBe(titles[1]);
    for(const key of ['hTop','dTop','dWidth','center']){
      const values=positions.map(item=>item[key]);
      expect(Math.max(...values)-Math.min(...values),key+' '+JSON.stringify(positions)).toBeLessThanOrEqual(2);
    }
  }
});
