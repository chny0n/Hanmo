/* PC 전용 정책: 공개 페이지는 원래 URL에서 차단 안내를 표시하고 세션 페이지는 별도 안내로 이동합니다. */
(function enforcePcOnly() {
  'use strict';
  const device = window.navigator;
  const ua = String(device.userAgent || '');
  const ipadDesktopMode = /Macintosh/i.test(ua) &&
    device.platform === 'MacIntel' && Number(device.maxTouchPoints) > 1;
  const mobileAgent = /Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|BB10|PlayBook|webOS|Kindle|Silk|Opera Mini|Opera Mobi|Mobi|Tablet/i.test(ua);
  const blocked = device.userAgentData?.mobile === true || mobileAgent || ipadDesktopMode;
  window.HanmoPcOnly = Object.freeze({blocked});
  if (!blocked) return;

  const root = new URL('../', document.currentScript?.src || window.location.href);
  const route = new URL(window.location.href).pathname.split('/').pop();
  const sessionRoute = ['practice.html','selectZone.html','result.html','incident-404.html'].includes(route);
  document.documentElement.setAttribute('data-hanmo-pc-only', 'blocked');
  const style = document.createElement('style');
  // 실제 연습 세션의 타이머·저장값 변경을 방지하기 위해 비공개 세션 경로는 기존 차단 이동을 유지합니다.
  if(sessionRoute){
    style.textContent = 'html[data-hanmo-pc-only="blocked"] { visibility: hidden !important; }';
    document.head.appendChild(style);
    window.location.replace(new URL('html/pc-only.html', root).href);
    return;
  }

  // 공개 문서는 URL과 HTML을 유지하되 안내가 준비되기 전에 조작 화면이 드러나지 않게 합니다.
  style.textContent = `
    html[data-hanmo-pc-only="blocked"],html[data-hanmo-pc-only="blocked"] body {
      overflow:hidden!important;background:#000d18!important;
    }
    html[data-hanmo-pc-only="blocked"] body > :not(#hanmo-mobile-block) {
      visibility:hidden!important;pointer-events:none!important;
    }
    #hanmo-mobile-block {
      position:fixed!important;inset:0!important;z-index:2147483647!important;
      display:flex!important;flex-direction:column!important;align-items:center!important;
      width:100%!important;max-width:none!important;height:100vh!important;height:100dvh!important;
      box-sizing:border-box!important;overflow:auto!important;overscroll-behavior:contain;
      padding:20px 24px!important;margin:0!important;background:#000d18!important;
      color:#fff!important;visibility:visible!important;text-align:center;
      font:400 15px/1.7 "Noto Sans KR","Apple SD Gothic Neo",sans-serif!important;
      word-break:keep-all;overflow-wrap:anywhere;user-select:text!important;
    }
    #hanmo-mobile-block * {box-sizing:border-box}
    #hanmo-mobile-block .mbContent {width:min(100%,360px);margin:auto 0;padding:24px 0}
    #hanmo-mobile-block .mbLogo {display:flex;align-items:center;gap:14px;width:min(280px,100%);margin:0 auto 32px}
    #hanmo-mobile-block .mbLogo hr {flex:1 1 0;width:auto;min-width:0;margin:0;border:0;height:1px;background:#bdbdbd}
    #hanmo-mobile-block .mbLogo img {display:block;height:12px;width:auto;max-width:54px}
    #hanmo-mobile-block h1 {font:700 20px/1.5 inherit;font-size:20px;font-weight:700;line-height:1.5;margin:0 0 12px}
    #hanmo-mobile-block .mbDesc {color:#bfcbd4;margin:0 0 24px;font-size:15px;line-height:1.7}
    #hanmo-mobile-block .mbSite {display:inline-block;padding:10px 16px;border-radius:15px;background:#06111c;border:1px solid #aa8548;font-size:14px;color:#bfcbd4}
    #hanmo-mobile-block .mbSite b {color:#ffd27a;font-weight:700}
    #hanmo-mobile-block .mbPolicy {margin:16px 0 0;font-size:12px;color:#d9e5eb;max-width:560px;line-height:1.65}
    #hanmo-mobile-block:focus {outline:none}
  `;
  document.head.appendChild(style);
  function mount(){
    const block=document.createElement('section');
    block.id='hanmo-mobile-block';
    block.setAttribute('role','main');
    block.setAttribute('aria-labelledby','hanmo-mobile-block-title');
    block.tabIndex=-1;
    const content=document.createElement('div');
    content.className='mbContent';
    const logo=document.createElement('div');
    logo.className='mbLogo';
    logo.setAttribute('aria-hidden','true');
    const image=document.createElement('img');
    image.src=new URL('img/hanmo_white.svg',root).href;
    image.alt='';
    logo.append(document.createElement('hr'),image,document.createElement('hr'));
    const heading=document.createElement('h1');
    heading.id='hanmo-mobile-block-title';
    heading.textContent='현재 한모를 사용할 수 없는 환경이에요.';
    const desc=document.createElement('p');
    desc.className='mbDesc';
    desc.textContent='원활한 사용을 위해 PC 및 올바른 브라우저에서 접속해주세요.';
    const site=document.createElement('div');
    site.className='mbSite';
    const address=document.createElement('b');
    address.textContent=root.host+root.pathname;
    site.append('PC에서 ',address);
    content.append(logo,heading,desc,site);
    const policy=document.createElement('p');
    policy.className='mbPolicy';
    policy.textContent='본 서비스는 한국외국어대학교의 공식 서비스가 아니며, 정확한 정보는 학교 원문을 확인하시기 바랍니다.';
    block.append(content,policy);
    document.body.append(block);
    const disableBackground=()=>{
      for(const child of document.body.children){
        if(child===block||child.tagName==='SCRIPT'||child.tagName==='STYLE')continue;
        child.inert=true;
        child.setAttribute('aria-hidden','true');
      }
    };
    disableBackground();
    // 늦게 추가되는 채팅·팝업도 키보드와 보조 기술에서 배제합니다.
    new MutationObserver(disableBackground).observe(document.body,{childList:true});
    block.focus({preventScroll:true});
  }
  if(document.body)mount();
  else document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
