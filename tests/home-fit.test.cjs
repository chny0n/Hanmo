'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/home-fit.js'),'utf8');
function setup(height,width,contentHeight,contentWidth){
 const props={},mainProps={},adProps={};
 const content={scrollHeight:contentHeight,scrollWidth:contentWidth,style:{setProperty:(key,value)=>{props[key]=Number(value);}}};
 const advert={style:{setProperty:(key,value)=>{adProps[key]=Number(value);}}};
 const footer={clientHeight:90,querySelector:selector=>selector==='.adfit'?advert:null};
 const main={clientHeight:height,clientWidth:width,
  style:{setProperty:(key,value)=>{mainProps[key]=Number.parseFloat(value);}},
  querySelector:selector=>selector==='.home-fit-content'?content:selector==='.home-ad-footer'?footer:null};
 const bar={};
 const callbacks={};const queue=[];let frameId=0;
 const ctx={
  document:{readyState:'complete',querySelector:selector=>
    selector==='body.hanmo-home > main'?main:
    selector==='body.hanmo-home > .hanmo-topbar'?bar:null,fonts:{ready:Promise.resolve()}},
  window:{getComputedStyle:el=>el===footer?{bottom:'14px'}:{paddingTop:'10px',paddingBottom:'10px',paddingLeft:'12px',paddingRight:'12px'},
    requestAnimationFrame:fn=>{queue.push(fn);return ++frameId;},addEventListener:(event,fn)=>{callbacks[event]=fn;}},
  ResizeObserver:class{observe(){}}
 };
 vm.runInNewContext(source,ctx,{filename:'home-fit.js'});
 const flush=()=>{const cb=queue.shift();if(cb)cb();};
 flush();
 return {props,mainProps,adProps,callbacks,main,content,footer,flush};
}
test('short desktop viewport scales home only as necessary',()=>{
 const h=setup(420,960,700,700);
 assert.ok(h.props['--home-fit-scale']>0);
 assert.ok(h.props['--home-fit-scale']<1);
 assert.ok(h.props['--home-fit-scale']*700<=400);
});
test('normal viewport preserves original visual size',()=>{
 const h=setup(780,1300,520,700);
 assert.equal(h.props['--home-fit-scale'],1);
});
test('resizing always keeps the measured content within the main area',()=>{
 const h=setup(800,1100,600,700);
 h.main.clientHeight=360;
 h.callbacks.resize();h.flush();
 assert.ok(h.props['--home-fit-scale']<0.57);
});

test('advert stays at the bottom independently of centered content',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../css/home-fit.css'),'utf8');
 const centerStart=html.indexOf('<div class="home-fit-content">');
 const centerEnd=html.indexOf('</div>',centerStart);
 const adStart=html.indexOf("class='f-dirt-up home-ad-footer'");
 assert.ok(centerStart>=0&&centerEnd>centerStart&&adStart>centerEnd);
 assert.equal((html.match(/data-ad-unit = "DAN-b3RfXepcKF3cMeyf"/g)||[]).length,1);
 assert.ok(css.includes('position: absolute;'));
 assert.ok(css.includes('bottom: clamp(12px, 2vh, 20px)'));
 assert.ok(css.includes('top: calc((100% - var(--home-ad-reserve, 132px)) / 2)'));
});
test('banner lane is reserved even when advertisement has not loaded',()=>{
 const h=setup(720,1280,520,700);
 assert.equal(h.mainProps['--home-ad-reserve'],132);
 assert.equal(h.adProps['--home-ad-scale'],1);
 assert.ok(h.props['--home-fit-scale']*520<=720-20-132);
});
test('ad scales to narrow desktop view without overlapping centered buttons',()=>{
 const h=setup(360,640,540,700);
 assert.ok(h.adProps['--home-ad-scale']<1);
 assert.ok(h.props['--home-fit-scale']*540<=360-20-132);
 assert.ok(h.props['--home-fit-scale']>0);
});
