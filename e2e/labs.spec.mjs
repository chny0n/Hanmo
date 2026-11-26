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
  await page.addInitScript(()=>{
    Math.random=()=>0;
    Storage.prototype.setItem=()=>{throw new Error('브라우저 저장 차단');};
  });
  await page.goto('/html/reaction-test.html');
  await page.locator('#reaction-start').click();
  for(let i=0;i<8;i++){
    await expect(page.locator('#reaction-target')).toHaveAttribute('data-phase','go');
    await page.waitForTimeout(120);
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#reaction-report')).toBeVisible();
  await expect(page.locator('#reaction-status')).toContainText('저장하지 못해');
  await expect(page.locator('#reaction-result a')).toHaveCount(0);
  await expect(page.locator('#reaction-report')).not.toContainText('저장된');
  expect(await page.evaluate(()=>localStorage.getItem('hanmo.reaction.profile.v1'))).toBeNull();
});

test('전략 실험은 한 명 차이에서는 중요 순위를 반영하고 계산식을 보여 준다',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('저장소 차단');}}));
  await page.goto('/html/strategy-lab.html');
  const rows=page.locator('#strategy-courses tr');
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('spinbutton',{name:'A 정원',exact:true}).fill('20');
  const rivals=page.getByRole('spinbutton',{name:'A 경쟁자',exact:true});
  await rivals.fill('19');
  await page.getByRole('spinbutton',{name:'B 경쟁자',exact:true}).fill('20');
  await page.getByRole('spinbutton',{name:'C 정원',exact:true}).fill('8');
  await page.getByRole('button',{name:'과목 추가',exact:true}).click();
  await page.getByRole('button',{name:'D 삭제',exact:true}).click();
  await page.locator('#strategy-run').click();
  const result=page.locator('#strategy-result');
  const order=page.locator('#strategy-order li strong');
  await expect(result).toBeVisible();
  await expect(order).toHaveText(['과목 C','과목 A','과목 B']);
  await expect(page.locator('#strategy-order li').nth(1)).toContainText('자리당 0.95~1명');
  await expect(page.locator('#strategy-order li').nth(2)).toContainText('자리당 1~1.05명');
  await expect(result).not.toContainText(/성공률|%/);
  const criteria=page.locator('#strategy-criteria');
  await expect(criteria).toHaveJSProperty('open',false);
  await criteria.locator('summary').press('Enter');
  await expect(criteria).toHaveJSProperty('open',true);
  await expect(criteria).toContainText('(경쟁자 수 + 1) ÷ 정원');
  await expectOneScreen(page,'#strategy-result');
  await page.locator('#strategy-back').click();
  await expect(rivals).toHaveValue('19');
  await expect(page.locator('#strategy-courses tr:first-child input').first()).toBeFocused();
  await rivals.fill('20');
  await page.locator('#strategy-run').click();
  await expect(order).toHaveText(['과목 C','과목 A','과목 B']);
});

test('전략 입력은 중요 순위가 중복되면 추천하지 않고 최소 두 과목을 유지한다',async({page})=>{
  await page.goto('/html/strategy-lab.html');
  await page.getByRole('button',{name:'C 삭제',exact:true}).click();
  await expect(page.getByRole('button',{name:'A 삭제',exact:true})).toBeDisabled();
  await page.getByRole('spinbutton',{name:'B 중요 순위',exact:true}).fill('1');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toContainText('중복 없이');
  await expect(page.locator('#strategy-result')).toBeHidden();
});

test('학사 공지와 학사 달력은 한 URL의 탭으로 전환된다',async({page})=>{
  await page.goto('/html/academic-timeline.html');
  await expect(page.getByRole('tab',{name:'학사 공지'})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'학사 달력'}).click();
  await expect(page.locator('#academic-calendar-panel')).toBeVisible();
  await expect(page.locator('#calendar-view [role="table"]')).toBeVisible();
  await expect(page.locator('#academic-notice-panel')).toBeHidden();
  await page.getByRole('tab',{name:'학사 공지'}).click();
  await expect(page.locator('#academic-notice-panel')).toBeVisible();
  expect((await page.request.get('/html/academic-support.html')).status()).toBe(404);
  expect((await page.request.get('/html/academic-calendar.html')).status()).toBe(404);
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

test('8과목 추천 결과는 좁은 화면에서도 가로 스크롤 없이 표시된다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  for(let i=3;i<8;i++)await page.locator('#strategy-add').click();
  for(const id of 'ABCDEFGH'){
    await page.getByRole('spinbutton',{name:id+' 경쟁자',exact:true}).fill('199');
    await page.getByRole('textbox',{name:id+' 과목 이름',exact:true}).fill(id+'수강신청전략실험긴과목명'.repeat(3).slice(0,29));
  }
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-result')).toBeVisible({timeout:20000});
  await expect(page.locator('#strategy-order li')).toHaveCount(8);
  await expect(page.locator('#strategy-order .strategy-course-demand')).toHaveCount(8);
  await expect(page.locator('#strategy-order')).not.toContainText('100%');
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]){
    await page.setViewportSize(viewport);
    await expectOneScreen(page,'#strategy-result');
    await expect(page.locator('#strategy-back')).toBeInViewport({ratio:1});
    await expect(page.locator('.strategy-order-rank').first()).toHaveText('1번째');
  }
  await page.locator('#strategy-criteria summary').press('Enter');
  await page.setViewportSize({width:1280,height:720});
  await expectOneScreen(page,'#strategy-result');
  for(const width of [1440,1200,800,400]){
    await page.setViewportSize({width,height:800});
    const overflow=await page.locator('#strategy-order, #strategy-order li, .strategy-card-head').evaluateAll(nodes=>
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
