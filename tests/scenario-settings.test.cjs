'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=require('../js/scenario-settings.js');

function node(attrs={}){
  return {checked:false,attrs,addEventListener(){},getAttribute(name){return this.attrs[name];}};
}

function harness({valid=true,storageDenied=false,stored=new Map()}={}){
  // SETTING 창의 열기·저장 이벤트를 문서 이벤트로 흉내 냅니다.
  const listeners={};
  const yes=node({'data-scenario-toggle':'RECONNECT'});
  const no=node({'data-scenario-off':'RECONNECT'});
  const navigation=[];
  const host={
    Date:{now:()=>100000000},
    sessionStorage:{
      getItem(key){if(storageDenied)throw Error('denied');return stored.get(key)??null;},
      setItem(key,value){if(storageDenied)throw Error('denied');stored.set(key,value);},
      removeItem(key){if(storageDenied)throw Error('denied');stored.delete(key);}
    },
    hasValidPracticeSettings(){return valid;},
    goPractice(mode){navigation.push(mode);}
  };
  const doc={
    addEventListener(name,handler){(listeners[name]??=[]).push(handler);},
    querySelector:query=>({
      '[data-scenario-toggle="RECONNECT"]':yes,
      '[data-scenario-off="RECONNECT"]':no
    })[query]??null
  };
  const app=ui.mount(doc,host);
  assert.ok(app);
  const fire=name=>{assert.ok(listeners[name]?.length,name);for(const handler of listeners[name])handler();};
  return {app,yes,no,stored,navigation,host,
    open:()=>fire('hanmo-settings-open'),save:()=>fire('hanmo-settings-saved')};
}

function choose(h,enabled){
  h.open();
  h.yes.checked=enabled;
  h.no.checked=!enabled;
  h.save();
}

test('404만 선택할 수 있으며 돌발상황은 기본 OFF이다',()=>{
  assert.deepEqual(ui.PRESETS,['RECONNECT']);
  assert.deepEqual(ui.selected(['LAST_VALID','RECONNECT']),['RECONNECT']);
  const h=harness();
  assert.deepEqual(h.app.getEnabled(),[]);
  assert.equal(h.no.checked,true);
  assert.equal(h.yes.checked,false);
  for(const mode of [1,2,3]){
    h.host.goPractice(mode);
    assert.equal(h.navigation.at(-1),mode);
    assert.equal(h.stored.size,0);
  }
});

test('돌발상황 설정은 SETTING 확인으로 저장되고 닫기로 취소된다',()=>{
  const h=harness();
  h.open();
  h.yes.checked=true;
  // 닫기는 저장 이벤트 없이 창만 닫으므로 다시 열면 저장된 값으로 돌아갑니다.
  assert.deepEqual(h.app.getEnabled(),[]);
  h.open();
  assert.equal(h.yes.checked,false);
  assert.equal(h.no.checked,true);
  choose(h,true);
  assert.deepEqual(h.app.getEnabled(),['RECONNECT']);
  assert.equal(h.stored.get(ui.SELECTION_KEY),'yes');
  h.open();
  assert.equal(h.yes.checked,true);
  choose(h,false);
  assert.deepEqual(h.app.getEnabled(),[]);
  assert.equal(h.stored.get(ui.SELECTION_KEY),'no');
});

test('BASIC에서 404를 활성화하면 원본 practice에 먼저 들어가고 타이머는 시작하지 않는다',()=>{
  const h=harness();
  choose(h,true);
  h.host.goPractice(1);
  assert.deepEqual(h.navigation,[1]);
  const entry=JSON.parse(h.stored.get(ui.TRANSITION_KEY));
  assert.deepEqual(entry,{version:3,phase:'armed',mode:1,at:100000000});
  assert.equal(typeof h.host.setTimeout,'undefined');
});

test('TIME/SELECT, 미설정 및 저장소 오류는 가상 404를 주입하지 않는다',()=>{
  const h=harness();choose(h,true);
  h.host.goPractice(2);
  assert.equal(h.stored.get(ui.SELECTION_KEY),'yes');
  assert.equal(h.stored.has(ui.TRANSITION_KEY),false);
  h.host.goPractice(3);
  assert.equal(h.stored.has(ui.TRANSITION_KEY),false);
  const bad=harness({valid:false});choose(bad,true);bad.host.goPractice(1);
  assert.equal(bad.stored.has(ui.TRANSITION_KEY),false);
  const denied=harness({storageDenied:true});choose(denied,true);
  assert.doesNotThrow(()=>denied.host.goPractice(1));
  assert.deepEqual(denied.navigation,[1]);
});

test('같은 탭에서 메뉴로 돌아오거나 새로고침해도 예/아니오 선택이 유지된다',()=>{
  const stored=new Map();
  const first=harness({stored});
  assert.equal(first.no.checked,true);
  choose(first,true);
  assert.equal(stored.get(ui.SELECTION_KEY),'yes');

  // 페이지를 떠났다가 동일한 탭의 메뉴에 다시 들어옵니다.
  const again=harness({stored});
  assert.deepEqual(again.app.getEnabled(),['RECONNECT']);
  assert.equal(again.yes.checked,true);
  again.open();
  again.yes.checked=false;
  again.no.checked=true;
  // 닫기로 나가면 저장 이벤트가 없어 기존 선택이 유지됩니다.
  assert.equal(stored.get(ui.SELECTION_KEY),'yes');

  choose(again,false);
  const reloaded=harness({stored});
  assert.deepEqual(reloaded.app.getEnabled(),[]);
  assert.equal(reloaded.no.checked,true);
  assert.equal(stored.get(ui.SELECTION_KEY),'no');
});

test('저장된 예를 복원한 뒤 다시 BASIC에 들어가면 404 토큰을 한 번만 등록한다',()=>{
  const stored=new Map([[ui.SELECTION_KEY,'yes']]);
  const h=harness({stored});
  assert.deepEqual(h.app.getEnabled(),['RECONNECT']);
  h.host.goPractice(1);
  assert.equal(JSON.parse(stored.get(ui.TRANSITION_KEY)).phase,'armed');
  h.host.goPractice(3);
  assert.equal(stored.get(ui.SELECTION_KEY),'yes');
  assert.equal(stored.has(ui.TRANSITION_KEY),false);
});

test('새 탭·변조된 저장값·저장소 접근 거부는 기본 OFF로 안전하게 시작한다',()=>{
  const fresh=harness();
  assert.deepEqual(fresh.app.getEnabled(),[]);
  const malformed=harness({stored:new Map([[ui.SELECTION_KEY,'unexpected']])});
  assert.deepEqual(malformed.app.getEnabled(),[]);
  const denied=harness({storageDenied:true});
  assert.deepEqual(denied.app.getEnabled(),[]);
  assert.doesNotThrow(()=>choose(denied,true));
  assert.doesNotThrow(()=>denied.host.goPractice(1));
  assert.equal(denied.navigation.at(-1),1);
});

test('LAST_VALID·메뉴 내부 404·가짜 시간제 지연 구현을 배포하지 않는다',()=>{
  const root=path.join(__dirname,'..');
  const page=fs.readFileSync(path.join(root,'html/vsugang.html'),'utf8');
  const src=fs.readFileSync(path.join(root,'js/scenario-settings.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'css/vsugang-fit.css'),'utf8');
  for(const content of [page,src,css])
    assert.doesNotMatch(content,/LAST_VALID|incident-practice|incident-404-refresh|incident-404-back|6001|delayMs/);
  assert.match(page,/name="incident-RECONNECT" value="no" data-scenario-off="RECONNECT" checked/);
  assert.equal((page.match(/data-scenario-toggle=/g)||[]).length,1);
});
