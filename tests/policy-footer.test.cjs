'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=['index.html','html/readiness.html','html/reaction-test.html','html/strategy-lab.html',
 'html/academic-timeline.html','html/catalog.html','html/developer.html',
 'html/forecast.html','html/incident-404.html','html/pc-only.html',
 'html/planner.html','html/practice.html','html/result.html',
 'html/selectZone.html','html/vsugang.html'];
const sentence='본 서비스는 한국외국어대학교의 공식 서비스가 아니며, 정확한 정보는 학교 원문을 확인하시기 바랍니다.';
test('모든 HTML은 비공식 고지를 굵게 한 번만, 마지막 콘텐츠에 표시한다',()=>{
 for(const page of pages){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const footer=html.match(/<footer class="hanmo-policy-footer" aria-label="비공식 서비스 안내"><p><strong>([^<]+)<\/strong><\/p><\/footer>/g);
  assert.equal(footer?.length,1,page);
  assert.equal(html.split(sentence).length-1,1,page);
  assert.ok(footer[0].includes(sentence),page);
  assert.ok(html.indexOf(footer[0])>html.lastIndexOf('</main>'),page);
  assert.ok(html.indexOf(footer[0])>html.lastIndexOf('kakao_ad_area'),page);
  assert.ok(html.indexOf(footer[0])<html.lastIndexOf('</body>'),page);
  const css=page==='index.html'?'./css/hanmo-policy-footer.css':'../css/hanmo-policy-footer.css';
  assert.ok(html.includes('href="'+css+'"'),page);
  const script=page==='index.html'?'./js/hanmo-policy-footer.js':'../js/hanmo-policy-footer.js';
  assert.ok(html.includes('src="'+script+'" defer'),page);
  assert.doesNotMatch(html,/class=['"]headerNotice['"]/,page);
 }
});
test('홈 푸터는 광고 없이 중앙 콘텐츠와 독립된 행을 차지한다',()=>{
 const css=fs.readFileSync(path.join(root,'css/hanmo-policy-footer.css'),'utf8');
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const layout=fs.readFileSync(path.join(root,'css/home-fit.css'),'utf8');
 assert.ok(css.includes('body.hanmo-home > .hanmo-policy-footer'));
 assert.ok(css.includes('flex: 0 0 auto'));
 assert.match(layout,/body\.hanmo-home > main[\s\S]*?overflow: hidden;/);
 assert.match(layout,/body\.hanmo-home \.home-fit-content[\s\S]*?top: 50%;/);
 assert.doesNotMatch(home,/home-ad-footer|kakao_ad_area/);
 assert.ok(home.indexOf('footer class="hanmo-policy-footer"')>home.indexOf('</main>'));
 assert.doesNotMatch(home.match(/<div class='mainNotice blueBox'>[\s\S]*?<\/div>/)?.[0]||'',/본 서비스는/);
});
test('모의신청·달력·지원 기기에서 독립된 하단 표시를 보존한다',()=>{
 const css=fs.readFileSync(path.join(root,'css/hanmo-policy-footer.css'),'utf8');
 assert.ok(css.includes('body.hanmo-practice-layout > .half'));
 assert.ok(css.includes('body.hanmo-pc-only-layout > main'));
 assert.ok(css.includes('body.hanmo-ui > main'));
 assert.ok(css.includes('body.hanmo-policy-legacy > main'));
 assert.ok(css.includes('body.hanmo-synthetic-404.hanmo-practice-layout .half'));
});

test('모든 화면의 푸터는 연습 페이지와 동일한 공통 최소 높이와 세로 여백을 사용한다',()=>{
 const common=fs.readFileSync(path.join(root,'css/hanmo-policy-footer.css'),'utf8');
 const refined=fs.readFileSync(path.join(root,'css/hanmo-refined.css'),'utf8');
 const rule=common.match(/\.hanmo-policy-footer\s*\{([^}]+)\}/)?.[1];
 assert.ok(rule);
 assert.match(rule,/min-height:\s*48px/);
 assert.match(rule,/padding:\s*10px 24px 12px/);
 assert.doesNotMatch(refined,/\.hanmo-policy-footer\s*\{[^}]*(?:min-height|padding(?:-block)?|height)\s*:/);
});
