// @ts-check
import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4174/')
    ?route.continue():route.abort());
});

test('정보처 서면 이후 금지된 페이지와 메뉴가 보이지 않고 비공식 고지가 남는다',async({page})=>{
 await page.goto('/index.html');
 await expect(page.locator('.hanmo-topbar a[href*="academic-progress"]')).toHaveCount(0);
 await expect(page.locator('.hanmo-topbar a[href*="academic-faq"]')).toHaveCount(0);
 await expect(page.locator('.mainNotice')).toContainText('본 서비스는 한국외국어대학교의 공식 서비스가 아니며');
 for(const slug of ['academic-timeline','catalog','academic-calendar','academic-support','planner']){
  await page.goto('/html/'+slug+'.html');
  await expect(page.locator('.hanmo-policy-note')).toContainText('정확한 정보는 학교 원문');
  await expect(page.locator('.hanmo-markline')).toHaveCount(0);
  await expect(page.locator('.hanmo-topbar')).toBeVisible();
 }
});

test('관심강좌·전공·교양·기초 선택은 Search 전 메뉴만 바꾸고 네 화면을 캡처한다',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('deviceInfo','true');
    localStorage.setItem('practiceSetter','3');
    localStorage.setItem('psubjectValue','3');
    localStorage.setItem('subjectValue','1');
    localStorage.setItem('waitingValue','no');
    localStorage.setItem('waitingEntryValue','no');
  });
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/html/selectZone.html');
  const modes=['INTEREST','MAJOR','GENERAL','FOUNDATION'];
  await expect(page.locator('input[name="course-mode"]')).toHaveCount(4);
  mkdirSync('e2e-artifacts',{recursive:true});
  for(const mode of modes){
    await page.locator('input[name="course-mode"][value="'+mode+'"]').check();
    await expect(page.locator('#course-mode-nav')).toHaveAttribute('data-mode',mode);
    await expect(page.locator('#course-search-prompt')).toBeVisible();
    await expect(page.locator('.table')).toBeHidden();
    await expect(page.locator('#course-general-warning'))[mode==='GENERAL'?'toBeVisible':'toBeHidden']();
    if(mode!=='INTEREST')
      await expect(page.locator('[data-course-filter="'+mode+'"]')).toBeVisible();
    const offset=await page.evaluate(()=>{
      const nav=document.getElementById('course-mode-nav');
      if(!nav)return 9999;
      const boxes=[...nav.querySelectorAll('.course-types label,.menu-extra:not([hidden]),button.search')]
        .map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
      const center=(Math.min(...boxes.map(r=>r.left))+Math.max(...boxes.map(r=>r.right)))/2;
      const navBox=nav.getBoundingClientRect();
      return Math.abs(center-(navBox.left+navBox.width/2));
    });
    expect(offset).toBeLessThan(18);
    await page.screenshot({path:'e2e-artifacts/selectzone-'+mode+'.png',fullPage:false});
  }
  page.once('dialog',async dialog=>{
    expect(dialog.message()).toBe('조회구분을 선택해주세요.');
    await dialog.accept();
  });
  await page.locator('button.search').click();
  await expect(page.locator('.table')).toBeHidden();
  await page.locator('select[aria-label="기초 조회구분"]').selectOption('AVAILABLE');
  await page.locator('button.search').click();
  await expect(page.locator('.table')).toBeVisible();
  await expect(page.locator('[data-synthetic-alternative="true"]')).toHaveCount(6);
});

test('교양과목·조회구분이 ***Select***이면 각각 브라우저 알림 후 검색을 중단한다',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('practiceSetter','3');
    localStorage.setItem('psubjectValue','3');
    localStorage.setItem('subjectValue','1');
    localStorage.setItem('waitingValue','no');
  });
  await page.goto('/html/selectZone.html');
  await page.locator('input[name="course-mode"][value="GENERAL"]').check();
  let message='';
  page.on('dialog',async dialog=>{message=dialog.message();await dialog.accept();});
  await page.locator('button.search').click();
  expect(message).toBe('교양과목을 선택해주세요.');
  await expect(page.locator('.table')).toBeHidden();
  await page.locator('select[aria-label="교양과목"]').selectOption('GENERAL');
  await page.locator('button.search').click();
  expect(message).toBe('조회구분을 선택해주세요.');
  await expect(page.locator('.table')).toBeHidden();
  await page.locator('select[aria-label="교양 조회구분"]').selectOption('AVAILABLE');
  await page.locator('button.search').click();
  await expect(page.locator('[data-synthetic-alternative="true"]')).toHaveCount(6);
});

test('CAPACITY는 SELECT 모드에서 저장 플래그가 있어도 비활성이다',async({page})=>{
  await page.addInitScript(()=>{
    sessionStorage.setItem('hanmo.syntheticCapacity.active.v1','yes');
    localStorage.setItem('practiceSetter','3');
    localStorage.setItem('psubjectValue','3');
    localStorage.setItem('subjectValue','1');
    localStorage.setItem('waitingValue','no');
  });
  await page.goto('/html/selectZone.html');
  await page.locator('button.search').click();
  await expect(page.locator('.course-capacity-label')).toHaveCount(0);
  await expect(page.locator('button.register')).toHaveCount(3);
});

test('BASIC 정원 마감 ON에서 임의의 한 register를 제거하고 합성 대체과목을 신청한다',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0.65;});
  const dialogs=[];
  page.on('dialog',dialog=>{dialogs.push(dialog.message());void dialog.accept();});
  await page.goto('/html/vsugang.html');
  await page.getByRole('button',{name:'모의신청 설정 열기'}).click();
  await page.locator('.psugangVal').fill('3');
  await page.locator('.vsugangVal').fill('1');
  await page.locator('input[name="waitingCourseYN"][value="no"]').check();
  await page.locator('input[name="waitingEntryYN"][value="no"]').check();
  await page.locator('.settingSection .settingButton').click();
  await page.locator('#incident-options').click();
  await page.locator('[data-capacity-toggle]').check();
  await page.locator('#scenario-settings button[value="save"]').click();
  await page.locator('.basic-mode-tile').click({position:{x:60,y:60}});
  await expect(page).toHaveURL(/\/html\/practice\.html$/);
  await page.waitForLoadState('load');
  await page.waitForTimeout(10250);
  await page.locator('.sugang').click();
  await expect(page).toHaveURL(/\/html\/selectZone\.html$/);
  await page.locator('button.search').click();
  await expect(page.locator('.table')).toBeVisible();
  const closedCell=page.locator('#subject2 td').nth(1);
  await expect(closedCell).toBeEmpty();
  await expect(closedCell).toHaveAttribute('aria-label','가상 정원 마감');
  await expect(page.locator('#subject1 button.register')).toBeVisible();
  await expect(page.locator('.course-capacity-hint,.course-capacity-label')).toHaveCount(0);
  await expect(page.locator('button.register')).toHaveCount(2);
  await page.locator('input[name="course-mode"][value="MAJOR"]').check();
  await expect(page.locator('.table')).toBeHidden();
  await page.locator('button.search').click();
  expect(dialogs.at(-1)).toBe('학과를 선택해주세요.');
  await expect(page.locator('.table')).toBeHidden();
  await page.locator('select[aria-label="학과선택"]').selectOption('SEOUL');
  await page.locator('button.search').click();
  // 원본 관심강좌 행은 숨긴 채 보존하므로 표시 중인 합성 대체과목만 집계한다.
  await expect(page.locator('[data-synthetic-alternative="true"] button.register')).toHaveCount(6);
  await page.locator('[data-synthetic-alternative="true"] button.register').first().click();
  await expect(page).toHaveURL(/\/html\/result\.html$/);
  await expect(page.locator('.result p span')).toContainText('초');
});

test('1920x1080 달력은 날짜행이 접히지 않고 모든 날짜가 보인다',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('/html/academic-calendar.html');
  const rows=page.locator('#calendar-view [role="row"][aria-label^="주 "]');
  const count=await rows.count();
  expect(count).toBeGreaterThanOrEqual(4);
  expect(count).toBeLessThanOrEqual(6);
  for(let index=0;index<count;index++){
    const row=rows.nth(index);
    await expect(row).toBeVisible();
    const rect=await row.boundingBox();
    expect(rect,'달력 주차 행이 접히면 안 됨').not.toBeNull();
    expect(rect.height).toBeGreaterThan(55);
    expect(rect.y+rect.height).toBeLessThanOrEqual(1079);
  }
  await expect(page.locator('#calendar-view [role="cell"][data-date]').first()).toBeVisible();
  const scrollHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
  expect(scrollHeight).toBeLessThanOrEqual(1081);
  await expect(page.locator('#calendar-status')).toHaveCount(0);
  await page.screenshot({path:'e2e-artifacts/calendar-restored-1920x1080.png',fullPage:false});
});

test('공식 상담 부서명이 원문 링크이고 상태 설명 문구는 표시하지 않는다',async({page})=>{
  await page.goto('/html/academic-support.html');
  const headingLink=page.locator('#support-results h3 a');
  await expect(headingLink).toHaveText('서울 학사종합지원센터');
  await expect(headingLink).toHaveAttribute('href','https://haksa.hufs.ac.kr/haksa/index.do');
  await expect(page.locator('#support-results a[href^="tel:"]')).toHaveText('02-2173-2130');
  await expect(page.locator('#support-status')).toHaveCount(0);
  await expect(page.locator('#support-results')).not.toContainText('원문 재확인');
  await page.locator('#support-campus').selectOption('GLOBAL');
  await page.locator('#support-topic').selectOption('SEASONAL');
  await expect(headingLink).toHaveText('글로벌 학사종합지원센터 · 계절학기');
  await expect(page.locator('#support-results a[href^="tel:"]')).toHaveText('031-330-4086');
});
test('상단 바로 달력과 학교 문의처를 열 수 있다',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  const paths=['/index.html','/html/academic-timeline.html','/html/catalog.html',
    '/html/academic-calendar.html',
    '/html/academic-support.html','/html/planner.html','/html/forecast.html',
    '/html/vsugang.html','/html/developer.html','/html/result.html'];
  const links=[
    {name:'학사 달력',end:'/academic-calendar.html'},
    {name:'학교 문의처',end:'/academic-support.html'}
  ];
  for(const path of paths){
    await page.goto(path);
    await expect(page.locator('.hanmo-tools')).toHaveCount(0);
    const bar=page.locator('.hanmo-topbar');
    const rect=await bar.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.height,'상단 바 한 줄: '+path).toBeLessThanOrEqual(86);
    for(const link of links){
      const entry=bar.getByRole('link',{name:link.name});
      await expect(entry).toBeVisible();
      const href=await entry.getAttribute('href');
      expect(href.endsWith(link.end),'상단 링크: '+path+' '+link.name).toBe(true);
      const tag=await entry.evaluate(element=>element.parentElement?.tagName);
      expect(['NAV','DIV']).toContain(tag);
    }
  }
});

test('학사 달력·학교 문의처·미연결 강의 전망이 안전하게 작동한다',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('.hanmo-tools')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'학사 달력'})).toBeVisible();
  const runtimeErrors=[];
  const failedResources=[];
  page.on('pageerror',error=>runtimeErrors.push(error.message));
  page.on('response',response=>{
    if(response.status()>=400)failedResources.push(response.status()+' '+response.url());
  });
  await page.getByRole('link',{name:'학사 달력'}).click();
  await expect(page).toHaveURL(/academic-calendar\.html$/);
  await page.waitForTimeout(450);

  expect(runtimeErrors).toEqual([]);
  expect(failedResources).toEqual([]);
  await expect(page.locator('#calendar-view [role="heading"][aria-level="2"]')).toBeVisible();
  const days=await page.locator('#calendar-view [role="cell"][data-date]').count();
  expect(days).toBeGreaterThanOrEqual(28);
  expect(days).toBeLessThanOrEqual(42);
  await expect(page.locator('#calendar-status')).toHaveCount(0);
  await page.screenshot({path:'e2e-artifacts/academic-calendar-month.png',fullPage:false});
  await page.goto('/html/academic-support.html');
  await page.locator('#support-campus').selectOption('GLOBAL');
  await page.locator('#support-topic').selectOption('SEASONAL');
  await expect(page.locator('#support-results')).toContainText('031-330-4086');
  await page.goto('/html/catalog.html');
  await expect(page.locator('#catalog-campus')).toBeDisabled();
  await expect(page.locator('#catalog-target-term')).toBeDisabled();
  await page.goto('/html/forecast.html');
  await expect(page).toHaveURL(/\/html\/catalog\.html$/);
});
