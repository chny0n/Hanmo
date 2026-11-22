/* 홈 상단 메뉴와 안내·버튼을 유지하면서 화면 높이에 따라 중앙 콘텐츠만 축소한다.
 * 광고는 별도 하단 공간을 확보해 버튼 위치가 움직이지 않도록 한다.
 */
(function(){
  'use strict';
  function mount(){
    const main=document.querySelector('body.hanmo-home > main');
    const content=main?.querySelector('.home-fit-content');
    const footer=main?.querySelector('.home-ad-footer');
    const advert=footer?.querySelector('.adfit');
    if(!main||!content)return;
    let frame=0;
    function fit(){
      frame=0;
      const computed=window.getComputedStyle(main);
      const px=value=>Number.parseFloat(value)||0;
      const availableW=Math.max(0,main.clientWidth-px(computed.paddingLeft)-px(computed.paddingRight));
      // 광고가 없어도 728×90 배너가 들어갈 공간을 고정해 배치 이동을 막는다.
      const footerBottom=footer?px(window.getComputedStyle(footer).bottom):0;
      const reserve=footer?Math.max(90,footer.clientHeight)+footerBottom+28:0;
      main.style.setProperty('--home-ad-reserve',reserve+'px');
      const availableH=Math.max(0,main.clientHeight-px(computed.paddingTop)-px(computed.paddingBottom)-reserve);
      const innerH=Math.max(1,content.scrollHeight);
      const innerW=Math.max(1,content.scrollWidth);
      const ratio=Math.min(1,availableH/innerH,availableW/innerW);
      const scale=Number.isFinite(ratio)&&ratio>0?ratio:0.01;
      content.style.setProperty('--home-fit-scale',String(Math.floor(scale*10000)/10000));
      // PC 확대 시 광고 자체만 비율에 맞추고 중앙 콘텐츠 크기는 흔들지 않는다.
      if(advert){
        const adScale=Math.min(1,availableW/728);
        advert.style.setProperty('--home-ad-scale',String(Math.floor(Math.max(0.01,adScale)*10000)/10000));
      }
    }
    function schedule(){
      if(!frame)frame=window.requestAnimationFrame(fit);
    }
    window.addEventListener('resize',schedule,{passive:true});
    if(typeof ResizeObserver==='function'){
      const observer=new ResizeObserver(schedule);
      observer.observe(main);
      observer.observe(content);
      if(footer)observer.observe(footer);
      const bar=document.querySelector('body.hanmo-home > .hanmo-topbar');
      if(bar)observer.observe(bar);
    }
    if(document.fonts?.ready)document.fonts.ready.then(schedule,schedule);
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
