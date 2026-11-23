import {test,expect} from '@playwright/test';

const profile={version:1,medianMs:250,p90Ms:420,variationMs:170,count:8,measuredAt:0};
const seedProfile=async page=>{
  await page.addInitScript(p=>{
    localStorage.setItem('hanmo.reaction.profile.v1',JSON.stringify({...p,measuredAt:Date.now()}));
  },profile);
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

test('PC 진단은 실행 전 요청이 없고 다운로드 처리량을 측정한다',async({page})=>{
  const requests=[];
  page.on('request',request=>requests.push(request.url()));
  await page.goto('/html/readiness.html');
  await expect(page.locator('#readiness-result')).toBeHidden();
  await expect(page.locator('#readiness-network')).toBeChecked();
  expect(requests.some(u=>u.includes('network-probe.txt'))).toBe(false);
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-result')).toBeVisible({timeout:30000});
  await expect(page.locator('#readiness-speed-value')).toContainText('Mbps');
  await expect(page.locator('#readiness-latency-value')).toContainText('ms');
  await expect(page.locator('#readiness-jitter-value')).toContainText('ms');
  await expect(page.locator('#readiness-error-value')).toContainText('0/7');
  await expect(page.locator('#readiness-share')).toHaveCount(0);
  expect(requests.filter(u=>u.includes('network-probe.txt')).length).toBe(2);
  expect(requests.some(u=>/hufs\.ac\.kr/.test(u))).toBe(false);
});

test('반응속도 8회 완료 결과가 브라우저에 저장된다',async({page})=>{
  test.setTimeout(65_000);
  await page.goto('/html/reaction-test.html');
  await page.locator('#reaction-start').click();
  for(let i=0;i<8;i++){
    await expect(page.locator('#reaction-target')).toHaveAttribute('data-phase','go',{timeout:5000});
    await page.waitForTimeout(120);
    await page.locator('#reaction-target').click();
  }
  await expect(page.locator('#reaction-result')).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hanmo.reaction.profile.v1')));
  expect(saved.count).toBe(8);
  expect(saved.medianMs).toBeGreaterThanOrEqual(80);
});

test('전략 실험은 네 개의 과목 입력만 요구하고 자동 행동시간으로 실행된다',async({page})=>{
  await seedProfile(page);
  await page.goto('/html/strategy-lab.html');
  await expect(page.locator('#strategy-reaction')).toContainText('250ms');
  await expect(page.locator('#strategy-clock')).toContainText('시');
  await expect(page.locator('#strategy-courses tr')).toHaveCount(3);
  await expect(page.locator('#strategy-courses input')).toHaveCount(12);
  await expect(page.locator('#strategy-form input[name="seed"], #strategy-form input[name="startDelay"], #strategy-form input[name="actionInterval"]')).toHaveCount(0);
  await expect(page.locator('#strategy-share')).toHaveCount(0);
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-result')).toBeVisible({timeout:20000});
  await expect(page.locator('#strategy-recommendation')).toContainText('신청 순서는');
  await expect(page.locator('#strategy-recommendation')).toContainText('모든 과목 성공 확률은');
  await expect(page.locator('#strategy-input')).toBeHidden();
});

test('반응속도 기록이 없으면 결과를 임의 생성하지 않는다',async({page})=>{
  await page.goto('/html/strategy-lab.html');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toContainText('반응속도 테스트를 먼저');
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

test('연습 결과에서 모드와 옵션을 포함한 PNG 파일을 저장한다',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('practiceSetter','1');
    localStorage.setItem('psubjectValue','3');
    localStorage.setItem('subjectValue','2');
    localStorage.setItem('waitingValue','yes');
    localStorage.setItem('waitingEntryValue','no');
    localStorage.setItem('TIMEtime','1.222');
    localStorage.setItem('SELECTtime','3.444');
    localStorage.setItem('SELECTWaitTime','0.100');
    sessionStorage.setItem('hanmo.synthetic404.selection.v1','yes');
    sessionStorage.setItem('hanmo.syntheticCapacity.selection.v1','no');
  });
  await page.goto('/html/result.html');
  const download=page.waitForEvent('download');
  await page.locator('#practice-report-save').click();
  const file=await download;
  expect(file.suggestedFilename()).toBe('hanmo-practice-result.png');
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
