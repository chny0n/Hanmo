'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const student=['planner','forecast','catalog','academic-timeline','academic-calendar','academic-support'];
test('삭제된 학사 FAQ·졸업 페이지와 학교 로고를 웹에 남기지 않는다',()=>{
 for(const p of ['html/academic-progress.html','html/academic-faq.html','css/academic-progress.css',
  'css/academic-faq.css','js/academic-faq.js','img/hufs_logo.png'])
  assert.equal(fs.existsSync(path.join(ROOT,p)),false,p);
 const source=JSON.parse(fs.readFileSync(path.join(ROOT,'data/academic-source-config.json'),'utf8'));
 assert.equal(source.mode,'disabled');
});
test('허용된 화면에 비공식 안내를 표시하고 금지된 메뉴 경로를 제거한다',()=>{
 const pages=['index.html',...student.map(s=>'html/'+s+'.html'),
  'html/vsugang.html','html/developer.html','html/result.html'];
 for(const p of pages){
  const html=fs.readFileSync(path.join(ROOT,p),'utf8');
  assert.ok(html.includes('본 서비스는 한국외국어대학교의 공식 서비스가 아니며'),p);
  assert.doesNotMatch(html,/academic-progress\.html|academic-faq\.html/);
  assert.doesNotMatch(html,/>HUFS 학업 도우미</);
 }
});
test('상단 메뉴는 달력·검색형 문의처로 이동한다',()=>{
 for(const p of ['index.html',...student.map(s=>'html/'+s+'.html'),'html/vsugang.html','html/developer.html','html/result.html']){
  const html=fs.readFileSync(path.join(ROOT,p),'utf8');
  const prefix=p==='index.html'?'./html/':'./';
  for(const name of ['academic-calendar','academic-support'])
   assert.ok(html.includes('href="'+prefix+name+'.html"'),p+' '+name);
 }
});

test('public student pages live under html and never request pasted HTML or JSON',()=>{
 for(const name of student){
   const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
   assert.match(html,/class="hanmo-topbar"/);
   assert.match(html,/src="\.\.\/js\/pc-only\.js"/);
   assert.doesNotMatch(html,/<textarea\b|type=["']file["']/i);
   assert.doesNotMatch(html,/planner-sidebar|class="[^"]*sidebar/i);
 }
});
test('index contains only academic links and no duplicate simulation entry',()=>{
 const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 for(const name of student.filter(name=>name!=='forecast'))assert.ok(src.includes('./html/'+name+'.html'),name);
 assert.doesNotMatch(src,/<a[^>]+href="\.\/html\/vsugang\.html"/,'home must not link to legacy mock registration');
 assert.doesNotMatch(src,/scenario-settings|scenario-workshop|돌발상황 연습/,'no standalone incident link on home');
 assert.ok(!src.includes('scenario-workshop.html'), 'dead standalone page link');
 assert.ok(!src.includes('href="./degree-rescue/'), 'no academic UI link to old folder');
});
test('BASIC의 선택형 404만 남고 메뉴 안의 가상 실패/오류 UI는 제거한다',()=>{
 const html=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 assert.match(html,/id="scenario-settings"/);
 assert.equal((html.match(/data-scenario-toggle="/g)||[]).length,1);
 assert.equal((html.match(/data-scenario-off="/g)||[]).length,1);
 assert.ok(html.includes('name="incident-RECONNECT" value="no" data-scenario-off="RECONNECT" checked'));
 assert.doesNotMatch(html,/LAST_VALID|incident-practice|incident-404-refresh|incident-404-back/);
 assert.equal(fs.existsSync(path.join(ROOT,'html/scenario-workshop.html')),false);
 assert.equal(fs.existsSync(path.join(ROOT,'html/scenario-lab.html')),false);
 for(const page of student){
   const body=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
   assert.ok(!body.includes('vsugang.html#scenario-settings'),page);
 }
});


test('academic public assets are still under html; engine remains independently typechecked',()=>{
 const stage=fs.readFileSync(path.join(ROOT,'scripts/stage-static.mjs'),'utf8');
 assert.ok(stage.includes("join(dist,'data')"));
 assert.ok(!stage.includes("join(dist,'degree-rescue')"));
 assert.ok(stage.includes('student-forecast.js'));
});

test('academic package is flat: no nested source package remains',()=>{
 const root=path.join(ROOT,'degree-rescue');
 assert.equal(fs.existsSync(root),false);
 assert.ok(fs.existsSync(path.join(ROOT,'js','academic','core','forecast','offering.js')));
 assert.ok(fs.existsSync(path.join(ROOT,'package.json')));
});

test('new views preserve original Hanmo palette, watermark and shared layers',()=>{
 const shared=fs.readFileSync(path.join(ROOT,'css','student-ui.css'),'utf8');
 for(const name of ['hanmo-tokens.css','hanmo-components.css','hanmo-views.css'])
   assert.ok(shared.includes(name),'missing style module: '+name);
 const tokens=fs.readFileSync(path.join(ROOT,'css','hanmo-tokens.css'),'utf8');
 const views=fs.readFileSync(path.join(ROOT,'css','hanmo-views.css'),'utf8');
 assert.ok(tokens.includes('--hm-night:#000e18'));
 assert.ok(views.includes('background.svg'));
 for(const name of student){
   const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
   assert.match(html,/class="hanmo-schoolmark"/);
 }
 const originalMenu=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 assert.match(originalMenu,/class='titleContainer'/);
 assert.match(originalMenu,/id="scenario-settings"/);
 assert.match(originalMenu,/href="\.\.\/css\/vsugang-fit\.css"/);
});

test('모드 메뉴에서만 옵션을 켜고 실제 practice→selectZone 전환에서 404를 주입한다',()=>{
 const source=fs.readFileSync(path.join(ROOT,'js/scenario-settings.js'),'utf8');
 const router=fs.readFileSync(path.join(ROOT,'js/hanmoSys.js'),'utf8');
 const menu=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 const error=fs.readFileSync(path.join(ROOT,'html/incident-404.html'),'utf8');
 assert.match(menu,/<button id="incident-options"[^>]*aria-controls="scenario-settings"/);
 assert.match(menu,/<dialog id="scenario-settings"[^>]*>[\s\S]*data-scenario-toggle=/);
 assert.doesNotMatch(menu.match(/class='settingSection'[\s\S]*?<\/section>/)?.[0]??'',/data-scenario-toggle/);
 assert.match(source,/TRANSITION_KEY/);
 assert.match(router,/page==='practice\.html'&&entry\.phase==='armed'/);
 assert.match(router,/location\.assign\('\.\/incident-404\.html'\)/);
 assert.match(error,/src="\.\.\/js\/incident-404\.js"/);
 assert.doesNotMatch(error,/<button[^>]*onclick=|id="incident-404-refresh"/);
 assert.ok(!source.includes('fetch(')&&!router.includes('XMLHttpRequest('));
});


test('planner uses the shared top navigation instead of four duplicate feature cards',()=>{
 const body=fs.readFileSync(path.join(ROOT,'html/planner.html'),'utf8');
 assert.match(body,/<header class="hanmo-topbar">/);
 assert.match(body,/id="planner-profile"/);
 assert.doesNotMatch(body,/무엇을 준비하시나요\?|필요한 기능을 골라 들어가세요\./);
 assert.doesNotMatch(body,/<nav class="hanmo-card-grid"|aria-label="학업 기능 메뉴"/);
 assert.doesNotMatch(body,/class="hanmo-card" href="\.(?:\/academic-timeline|\/forecast|\/catalog|\/academic-progress)\.html"/);
});

test('home restores the original mock registration layout without the academic-entry promo block',()=>{
 const home=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 assert.match(home,/<nav class="hanmo-topbar"/);
 assert.match(home,/<a class="hanmo-brand" href="\.\/index\.html" aria-label="한모 홈으로 이동"/);
 assert.match(home,/<main>/);
 for(const tag of ["class='titleContainer'","class='notice blueBox'","class='mainNotice blueBox'",
   "class='buttonContainer'","class='headerNotice'","class='deviceCheck'"])
   assert.ok(home.includes(tag),'restore original page structure '+tag);
 for(const txt of ['수강신청 연습하기','새로고침','개발자 소개','NOTICE','이용 제한 시간'])
   assert.ok(home.includes(txt),'restore original content '+txt);
 for(const asset of ['./css/gnb.css','./css/index.css','./css/layout.css',
   './js/gnb.js','./js/index.js'])
   assert.ok(home.includes(asset),'restore original asset '+asset);
 assert.doesNotMatch(home,/academic-entry|학사 준비도 한모에서|수강신청 전부터 졸업 준비까지/);
 assert.doesNotMatch(home,/<a[^>]*>홈<\/a>/);
 assert.doesNotMatch(home,/<a[^>]*href="\.\/html\/vsugang\.html"[^>]*>/,'do not restore redundant topbar link');
 const bar=home.match(/<nav class="hanmo-topbar"[\s\S]*?<\/nav>/)?.[0];
 assert.ok(bar);
 const allowed=['./index.html','./html/academic-timeline.html',
   './html/catalog.html','./html/academic-calendar.html',
   './html/academic-support.html','./html/planner.html'];
 assert.deepEqual([...bar.matchAll(/<a[^>]+href="([^"]+)"/g)].map(x=>x[1]),allowed);
 assert.match(home,/onclick="location\.href='\.\/html\/vsugang\.html'"/);
 const homeScript=fs.readFileSync(path.join(ROOT,'js/index.js'),'utf8');
 assert.doesNotMatch(homeScript,/\$SUGANGBUTTON\.classList\.(?:add|remove)\(/,'practice entry must stay visible during restriction notice');
 assert.match(home,/onclick="location\.reload\(\)"/);
 for(const page of student){
   const html=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
   assert.match(html,/<a class="hanmo-brand" href="\.\.\/index\.html" aria-label="한모 홈으로 이동"/,page);
   assert.doesNotMatch(html,/<a href="\.\.\/index\.html">홈<\/a>/,page);
 }
 for(const page of ['vsugang','developer','result']){
   const html=fs.readFileSync(path.join(ROOT,'html',page+'.html'),'utf8');
   assert.match(html,/<a class="hanmo-brand" href="\.\.\/index\.html" aria-label="한모 홈으로 이동"/,page);
 }
});

test('home uses a viewport-fitted main below the topbar without hiding classic functions',()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(ROOT,'css/home-fit.css'),'utf8');
 const script=fs.readFileSync(path.join(ROOT,'js/home-fit.js'),'utf8');
 assert.match(html,/<body class="hanmo-home">/);
 assert.match(html,/<div class="home-fit-content">/);
 assert.match(html,/href="\.\/css\/home-fit\.css"/);
 assert.match(html,/src="\.\/js\/home-fit\.js" defer/);
 assert.match(css,/body\.hanmo-home\s*\{/);
 assert.match(css,/height:\s*100dvh/);
 assert.match(css,/body\.hanmo-home > main\s*\{/);
 assert.match(css,/flex:\s*1 1 auto/);
 assert.match(css,/overflow:\s*hidden/);
 assert.match(css,/--home-fit-scale/);
 assert.match(script,/content\.scrollHeight/);
 assert.match(script,/main\.clientHeight/);
 for(const item of ["class='notice blueBox'","class='mainNotice blueBox'",
   "class='buttonContainer'","수강신청 연습하기","새로고침","개발자 소개"])
  assert.ok(html.includes(item),'missing original homepage element '+item);
 assert.doesNotMatch(html,/academic-entry|학사 준비도 한모에서/);
});

test('vsugang menu fits under the navigation while settings and incident remain accessible',()=>{
 const html=fs.readFileSync(path.join(ROOT,'html/vsugang.html'),'utf8');
 const css=fs.readFileSync(path.join(ROOT,'css/vsugang-fit.css'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'js/vsugang-fit.js'),'utf8');
 for(const expected of ['<body class="hanmo-vsugang">','../css/vsugang-fit.css',
   '../js/vsugang-fit.js','BASIC MODE','TIME MODE','SELECT','SETTING'])
  assert.ok(html.includes(expected),'missing mode-menu contract '+expected);
 for(const expected of ['height:100dvh','--vsugang-fit-scale','--vsugang-topbar-bottom',
   'vsugang-compact-scroll','overflow-y:auto','#scenario-settings[open]'])
  assert.ok(css.includes(expected),'missing viewport protection '+expected);
 assert.ok(js.includes('landing.scrollHeight'));
 assert.ok(js.includes('main.clientHeight'));
 assert.equal((html.match(/data-scenario-off="/g)||[]).length,1);
});

test('every non-imitation topbar puts the editable self-declared student summary before rightmost 내정보',()=>{
 for(const page of ['index.html',...student.map(x=>'html/'+x+'.html'),
   'html/vsugang.html','html/developer.html','html/result.html']){
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const isHome=page==='index.html';
  const bar=html.match(/<(?:header|nav) class="hanmo-topbar"[\s\S]*?<\/(?:header|nav)>/)?.[0];
  assert.ok(bar,'missing shared bar: '+page);
  assert.ok(bar.includes('data-profile-summary'),'missing local profile summary: '+page);
  assert.ok(html.includes((isHome?'./js/':'../js/')+'student-profile-bar.js'),'missing profile controller: '+page);
  const links=[...bar.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const final=links.at(-1);
  assert.equal(final?.[1],isHome?'./html/planner.html':'./planner.html',page+' rightmost link');
  assert.equal(final?.[2],'내정보',page+' rightmost label');
  assert.ok(bar.indexOf('data-profile-summary')<bar.indexOf('class="hanmo-me-link"'),page+' profile precedes account link');
  assert.doesNotMatch(bar,/학업 플래너|>홈<\/a>|기본 모의신청/);
 }
});
test('academic pages have no repeated marketing introduction or rounded section wrappers',()=>{
 const flat=fs.readFileSync(path.join(ROOT,'css/hanmo-flat.css'),'utf8');
 const imported=fs.readFileSync(path.join(ROOT,'css/student-ui.css'),'utf8');
 assert.ok(imported.includes('hanmo-flat.css'));
 assert.match(flat,/body\.hanmo-ui \.hanmo-card/);
 assert.match(flat,/border-radius:0/);
 for(const name of student){
  const html=fs.readFileSync(path.join(ROOT,'html',name+'.html'),'utf8');
  assert.doesNotMatch(html,/class="hanmo-hero"|class="hanmo-eyebrow"/,name);
  assert.doesNotMatch(html,/한모는 학생이 만든 비공식 학업 보조 서비스입니다/,name);
  assert.ok(html.includes('class="hanmo-schoolmark"'),name);
 }
 const profile=fs.readFileSync(path.join(ROOT,'html/planner.html'),'utf8');
 for(const id of ['planner-profile','planner-secondary-kind','planner-cohort','planner-double'])
  assert.ok(profile.includes('id="'+id+'"'));
 assert.match(profile,/<title>내정보 \| 한모<\/title>/);
 assert.match(profile,/id="planner-cohort"[^>]*required/);
 assert.doesNotMatch(profile,/CAMPUS LIFE|ACADEMIC PLANNER|내 전공 공지를 찾고/);
 const blocker=fs.readFileSync(path.join(ROOT,'html/pc-only.html'),'utf8');
 assert.doesNotMatch(blocker,/border-radius:20px/);
 // 학생 UI 검사 과정에서도 원본 모의수강신청 파일을 변경하지 않는다.
 for(const name of ['practice.html','selectZone.html'])
  assert.ok(fs.existsSync(path.join(ROOT,'html',name)));
});

test('승인된 화면 정돈은 모드 타일 접근성과 제한된 시각 효과를 유지한다',()=>{
 const menu=fs.readFileSync(path.join(ROOT,'html','vsugang.html'),'utf8');
 for(const mode of [1,2,3]){
   assert.match(menu,new RegExp("onclick='goPractice\\("+mode+"\\)'[^>]*role='button' tabindex='0'"));
   assert.match(menu,new RegExp("onkeydown='[^']*goPractice\\("+mode+"\\)"));
 }
 assert.match(menu,/연습 전 과목 수를 설정해 주세요/);
 const modes=fs.readFileSync(path.join(ROOT,'css','vsugang-fit.css'),'utf8');
 assert.match(modes,/backdrop-filter:\s*blur\(7px\)/);
 assert.match(modes,/prefers-reduced-motion:\s*reduce/);
 const home=fs.readFileSync(path.join(ROOT,'css','home-fit.css'),'utf8');
 assert.match(home,/body\.hanmo-home \.button\.display/);
 const common=fs.readFileSync(path.join(ROOT,'css','hanmo-components.css'),'utf8');
 assert.match(common,/#planner-go-notices/);
 assert.match(common,/scroll-behavior:\s*smooth/);
});

test('홈·모드·학업·개발자 조작에만 느린 글로우를 적용한다',()=>{
 const mode=fs.readFileSync(path.join(ROOT,'css/vsugang-fit.css'),'utf8');
 const home=fs.readFileSync(path.join(ROOT,'css/home-fit.css'),'utf8');
 const common=fs.readFileSync(path.join(ROOT,'css/hanmo-components.css'),'utf8');
 for(const css of [mode,home,common]){
    assert.ok(css.includes('radial-gradient'));
    assert.ok(css.includes('transition: opacity 1.08s'));
    assert.ok(css.includes('prefers-reduced-motion'));
  }
 assert.ok(common.includes('--hm-glow-ease'));
 assert.ok(home.includes('body.hanmo-home .button::before'));
 assert.ok(common.includes('body.hanmo-ui :is(.hanmo-btn, .hanmo-practice-links a)::before'));
 assert.ok(common.includes('body.hanmo-flat-legacy .container > .button::before'));
 assert.ok(mode.includes('.grid > .basic-mode-tile'));
 assert.ok(common.includes('.hanmo-topbar .hanmo-nav-inline a::before'));
});

test('홈과 학업 제목 장식은 유지하고 practice·selectZone에서만 제거한다',()=>{
 const pages=['index.html','html/vsugang.html','html/developer.html','html/result.html',
  'html/academic-timeline.html','html/catalog.html','html/academic-calendar.html',
  'html/planner.html','html/forecast.html',
  'html/practice.html','html/selectZone.html','html/incident-404.html','html/pc-only.html'];
 const original=new Set(['index.html','html/vsugang.html','html/developer.html','html/result.html']);
 const sidebar=new Set(['html/incident-404.html']);
 const noDivider=new Set(['html/practice.html','html/selectZone.html']);
 for(const page of pages){
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const image=page==='index.html'?'./img/hanmo_white.svg':'../img/hanmo_white.svg';
  if(noDivider.has(page)){
   assert.doesNotMatch(html,/hanmo-title-divider/,page);
   assert.ok(html.includes('모의수강신청'),page);
  }else if(original.has(page)){
   assert.ok(html.includes('src="'+image+'"'),page);
   assert.equal((html.match(/<div class=['"]hanmo['"]>/g)||[]).length,1,page);
   assert.equal((html.match(/class="hanmo-title-divider(?:[ "])/g)||[]).length,0,page);
  }else{
   assert.ok(html.includes('src="'+image+'"'),page);
   assert.equal((html.match(/<div class="hanmo-title-divider(?: hanmo-title-divider--sidebar)?" aria-hidden="true">/g)||[]).length,1,page);
   assert.ok(html.includes('href="../css/hanmo-title-divider.css"'),page);
   assert.match(html,/class="hanmo-title-divider(?: hanmo-title-divider--sidebar)?" aria-hidden="true"><hr><span><img src="\.\.\/img\/hanmo_white\.svg" alt=""><\/span><hr><\/div>/);
   if(sidebar.has(page))assert.ok(html.includes('class="hanmo-title-divider hanmo-title-divider--sidebar"'),page);
  }
  // 푸터의 학교 비공식 고지는 제목 장식 추가와 무관하게 페이지 마지막에 남아야 합니다.
  assert.ok(html.lastIndexOf('hanmo-policy-footer')>html.indexOf('hanmo_white.svg'),page);
 }
 const css=fs.readFileSync(path.join(ROOT,'css/hanmo-title-divider.css'),'utf8');
 assert.match(css,/height: 10px;/);
 assert.match(css,/hanmo-title-divider--sidebar/);
 assert.match(css,/body\.hanmo-ui \.hanmo-main > \.hanmo-schoolmark/);
});


test('모든 상단 바 브랜드 옆의 불필요한 비공식 문구를 제거한다',()=>{
 const pages=['index.html','html/vsugang.html','html/developer.html','html/result.html',
  'html/academic-calendar.html','html/academic-timeline.html',
  'html/catalog.html','html/forecast.html','html/planner.html'];
 for(const page of pages){
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  const brand=html.match(/<a class="hanmo-brand"[^>]*>[\s\S]*?<\/a>/)?.[0];
  assert.ok(brand,page);
  assert.ok(brand.includes('한모</a>'),page);
  assert.doesNotMatch(brand,/비공식 연습·정보|<span\b/,page);
  assert.ok(html.includes('class="hanmo-policy-footer"'),page);
 }
});

test('강의검색과 학사공지에서 불필요한 제목만 삭제하고 검색·결과는 유지한다',()=>{
 const catalog=fs.readFileSync(path.join(ROOT,'html/catalog.html'),'utf8');
 assert.match(catalog,/<h2>강의 검색<\/h2>/);
 assert.doesNotMatch(catalog,/자료 확인 전/);
 for(const id of ['catalog-query','catalog-results','catalog-status'])assert.ok(catalog.includes('id="'+id+'"'));
 const notice=fs.readFileSync(path.join(ROOT,'html/academic-timeline.html'),'utf8');
 assert.doesNotMatch(notice,/<h2[^>]*>공지 (?:검색|목록)<\/h2>/);
 assert.doesNotMatch(notice,/notice-filter-title/);
 assert.match(notice,/<section class="hanmo-card hanmo-search-controls" aria-label="공개 공지 필터">/);
 for(const id of ['notice-filter','notice-query','notice-type','notice-list','notice-count','notice-retry']){
  assert.ok(notice.includes('id="'+id+'"'),id);
 }
 assert.ok(notice.includes('class="hanmo-policy-footer"'));
});


test('학사 공지·강의 검색의 메뉴명과 최상단 표제는 완전히 일치한다',()=>{
 for(const file of ['academic-timeline','catalog','academic-support']){
  const html=fs.readFileSync(path.join(ROOT,'html',file+'.html'),'utf8');
  const menu=html.match(/<a href="\.\/[^"]+" aria-current="page">([^<]+)<\/a>/);
  const h2=html.match(/class="hanmo-schoolmark"[^>]*>[\s\S]*?<h2>([^<]+)<\/h2>/);
  assert.ok(menu&&h2,file);
  assert.equal(menu[1],h2[1],file);
 }
 const catalog=fs.readFileSync(path.join(ROOT,'html/catalog.html'),'utf8');
 assert.ok(catalog.includes('비공식 가공 자료 검색'));
 assert.ok(catalog.includes('id="catalog-query"'));
 assert.ok(catalog.includes('disabled'));
 assert.ok(catalog.includes('본 서비스는 한국외국어대학교의 공식 서비스가 아니며'));
});

test('학사 페이지 제목 구분선과 첫 구성요소 사이의 여백은 공통 CSS로 통일된다',()=>{
 const css=fs.readFileSync(path.join(ROOT,'css/hanmo-title-divider.css'),'utf8');
 assert.match(css,/body\.hanmo-ui \.hanmo-main > \.hanmo-schoolmark\s*\{\s*margin:\s*12px 0 16px/);
 assert.match(css,/body\.hanmo-ui \.hanmo-main > #notice-context:empty\s*\{\s*display:\s*none/);
 for(const file of ['academic-timeline','catalog','academic-support','academic-calendar','planner']){
  const html=fs.readFileSync(path.join(ROOT,'html',file+'.html'),'utf8');
  assert.ok(html.includes('href="../css/hanmo-title-divider.css"'),file);
  assert.ok(html.includes('class="hanmo-title-divider"'),file);
 }
});

test('학교 문의처는 검색어 추천만 제공하고 미검증 연락처 자료를 다시 추가하지 않는다',()=>{
 for(const file of ['html/academic-support.html','js/academic-support.js','css/academic-support.css']){
  assert.equal(fs.existsSync(path.join(ROOT,file)),true,file);
 }
 for(const removed of ['docs/academic-support-center-brief.md',
  'docs/references/hufs-support-contacts-2026-11-23.md']){
  assert.equal(fs.existsSync(path.join(ROOT,removed)),false,removed);
 }
 const html=fs.readFileSync(path.join(ROOT,'html/academic-support.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'js/academic-support.js'),'utf8');
 const site=fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
 assert.match(site,/html\/academic-support\.html/);
 for(const id of ['support-query','support-suggestions','support-search-form','support-result-link']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.doesNotMatch(html,/<select\b|(?:tel|mailto):/);
 assert.doesNotMatch(html,/문의 주제로 검색하기|확인되지 않은 연락처 대신 검색어를 추천합니다/);
 assert.match(html,/class="hanmo-card hanmo-support-search" aria-label="문의 검색과 추천 검색어"/);
 assert.doesNotMatch(js,/02-2173|031-330|@hufs\.ac\.kr|\bfetch\s*\(/);
 assert.match(js,/'한국외국어대학교 '\+value/);
 for(const p of ['index.html',...student.map(name=>'html/'+name+'.html'),
  'html/vsugang.html','html/developer.html','html/result.html']){
  assert.match(fs.readFileSync(path.join(ROOT,p),'utf8'),/academic-support\.html/,p);
 }
});

test('개발자 Contributor 네 명을 소속 정보의 임의 추측 없이 정렬한다',()=>{
 const html=fs.readFileSync(path.join(ROOT,'html/developer.html'),'utf8');
 const body=html.match(/<ul class="hanmo-contributor-list">([\s\S]*?)<\/ul>/)?.[1];
 assert.ok(body);
 const names=[...body.matchAll(/<li><strong>([^<]+)<\/strong>/g)].map(x=>x[1]);
 assert.deepEqual(names,['ZetBe','심민성','이의상','김채윤']);
 for(const affiliation of ['한국외국어대학교 컴퓨터전자시스템공학부',"한국외국어대학교 경제학전공 '24","한국외국어대학교 ELLT '23","한국외국어대학교 아랍어과 '23"]){
  assert.ok(body.includes(affiliation),affiliation);
 }
 assert.ok(html.includes('class="hanmo-policy-footer"'));
});

test('보라 원본을 투명 정사각형 안에 비율대로 넣은 favicon을 전체 화면에서 사용한다',()=>{
 const purple=fs.readFileSync(path.join(ROOT,'img/hanmo_purple.png'));
 const svg=fs.readFileSync(path.join(ROOT,'img/favicon-purple.svg'),'utf8');
 assert.equal(purple.toString('ascii',1,4),'PNG');
 assert.equal(purple.readUInt32BE(16),550);
 assert.equal(purple.readUInt32BE(20),218);
 assert.equal(purple.readUInt8(25),6);
 assert.match(svg,/viewBox="0 0 550 550"/);
 assert.match(svg,/x="0" y="166" width="550" height="218"/);
 assert.ok(svg.includes('data:image/png;base64,'+purple.toString('base64')));
 assert.doesNotMatch(svg,/<rect\b|<path\b/);
 for(const page of ['index.html',...student.map(name=>'html/'+name+'.html'),
  'html/practice.html','html/vsugang.html','html/developer.html','html/result.html',
  'html/selectZone.html','html/incident-404.html','html/pc-only.html']){
  const html=fs.readFileSync(path.join(ROOT,page),'utf8');
  assert.match(html,/favicon-purple\.svg/,page);
  assert.doesNotMatch(html,/rel="icon"[^>]*hanmo_color\\.png/,page);
 }
});
