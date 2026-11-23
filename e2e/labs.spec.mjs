import {test,expect} from '@playwright/test';

test('홈에서 진단실과 전략 실험실로 이동할 수 있다',async({page})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('link',{name:'PC 진단'})).toHaveAttribute('href','./html/readiness.html');
  await expect(page.getByRole('link',{name:'전략 실험'})).toHaveAttribute('href','./html/strategy-lab.html');
  await page.getByRole('link',{name:'PC 진단'}).click();
  await expect(page.getByRole('heading',{name:'수강신청 PC 준비도 진단'})).toBeVisible();
});

test('PC 진단은 기본 상태에서 자동 측정·학교 서버 접근을 하지 않는다',async({page})=>{
  const schoolRequests=[];
  page.on('request',request=>{
    if(/(?:^|[.])hufs[.]ac[.]kr/i.test(new URL(request.url()).hostname))schoolRequests.push(request.url());
  });
  await page.goto('/html/readiness.html');
  await expect(page.locator('#readiness-network')).not.toBeChecked();
  await expect(page.locator('#readiness-result')).toBeHidden();
  await expect(page.locator('#readiness-cancel')).toBeHidden();
  await expect(page.getByRole('button',{name:'진단 시작'})).toBeEnabled();
  expect(schoolRequests).toEqual([]);
});

test('PC 진단은 프레임 측정 뒤 사용자 입력 10회를 집계한다',async({page})=>{
  await page.goto('/html/readiness.html');
  await page.locator('#readiness-start').click();
  await expect(page.locator('#readiness-key-panel')).toBeVisible({timeout:15000});
  await page.locator('#readiness-key-target').focus();
  for(let index=0;index<10;index++){
    await page.keyboard.press('Space');
    await page.waitForTimeout(55);
  }
  await expect(page.locator('#readiness-result')).toBeVisible({timeout:10000});
  await expect(page.locator('#readiness-frame-value')).toContainText('P95');
  await expect(page.locator('#readiness-key-value')).toContainText('P95');
  await expect(page.locator('#readiness-share')).toBeEnabled();
});

test('전략 실험은 Worker에서 세 전략·5개 조건을 계산한다',async({page})=>{
  await page.goto('/html/strategy-lab.html');
  await page.locator('select[name="trials"]').selectOption('100');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-result')).toBeVisible({timeout:30000});
  await expect(page.locator('#strategy-results tr')).toHaveCount(3);
  await expect(page.locator('#strategy-sensitivity li')).toHaveCount(5);
  await expect(page.locator('#strategy-share')).toBeEnabled();
  await expect(page.locator('#strategy-details')).toContainText('123456789');
});

test('전략 실험은 직접 입력 순서의 중복을 거부한다',async({page})=>{
  await page.goto('/html/strategy-lab.html');
  await page.getByRole('spinbutton',{name:'B 직접 선택 순서'}).fill('1');
  await page.locator('#strategy-run').click();
  await expect(page.locator('#strategy-status')).toContainText('중복');
  await expect(page.locator('#strategy-result')).toBeHidden();
});
