/*
 * #62 composite synthetic drill. Independent of legacy BASIC/TIME/SELECT handlers.
 * Does not read browser storage, use networks, or create real enrollment claims.
 */
(function (root, factory) {
  const engine = typeof module !== 'undefined' && module.exports
    ? require('./scenario-engine.js') : root.HanmoScenario;
  const api = factory(engine);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HanmoComposite = api;
})(typeof globalThis === 'object' ? globalThis : this, function (engine) {
  'use strict';
  const LAST_TERMINAL = new Set(['REPLACED','NO_VALID_ALTERNATIVE','UNRESOLVED']);
  const RECONNECT_TERMINAL = new Set(['CONFIRMED','NOT_APPLIED','UNKNOWN']);
  const VARIANTS = new Set(['VALID','CONFLICT','NONE']);
  const MODES = new Set(['BASIC','TIME','SELECT']);
  const CLOCK = '2026-11-19T10:00:00+09:00';

  function frozen(value) { return Object.freeze(value); }
  function validate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        input.schemaVersion !== 1 || input.scenarioId !== 'COMPOSITE') {
      throw new TypeError('Composite schemaVersion:1 scenarioId:COMPOSITE required');
    }
    if (!MODES.has(input.mode)) throw new TypeError('Unknown practice mode');
    if (!VARIANTS.has(input.variant)) throw new TypeError('Unknown alternative variant');
    if (!Number.isSafeInteger(input.seed) || input.seed < 0 || input.seed > 0xffffffff)
      throw new RangeError('Seed must be an unsigned 32-bit integer');
    if (typeof input.enabled !== 'boolean') throw new TypeError('Opt-in enabled flag required');
    return frozen({schemaVersion:1,scenarioId:'COMPOSITE',seed:input.seed,mode:input.mode,
      enabled:input.enabled,variant:input.variant});
  }
  function lastConfig(config) {
    return {schemaVersion:1,scenarioId:'LAST_COURSE_FAIL',seed:config.seed,mode:config.mode,
      enabled:config.enabled,virtualClockStart:CLOCK,
      syntheticCourseIds:['SYN-LAST','SYN-ALT-1'],
      alternatives:[{syntheticCourseId:'SYN-ALT-1',
        timeOk:config.variant!=='CONFLICT',
        creditOk:config.variant!=='NONE',
        prerequisiteOk:true,noDuplicate:true,areaOk:true}]};
  }
  function reconnectConfig(config) {
    return {schemaVersion:1,scenarioId:'RECONNECT_RECOVERY',seed:config.seed,
      mode:config.mode,enabled:true,virtualClockStart:CLOCK,
      syntheticCourseIds:['SYN-REQUEST'],alternatives:[]};
  }
  function createComposite(input) {
    const config=validate(input);
    const last=engine.createScenario(lastConfig(config));
    return frozen({config,phase:config.enabled?'LAST':'OFF',last,reconnect:null,
      cancellationMistakes:0,
      events:frozen([]),errors:frozen([])});
  }
  function state(session) {
    if(session.phase==='OFF')return 'OFF';
    if(session.phase==='LAST')return session.last.state;
    if(session.phase==='CANCEL_CHOICE')return 'CANCEL_CHOICE';
    if(session.phase==='READY_RECONNECT')return 'READY_RECONNECT';
    if(session.phase==='RECONNECT')return session.reconnect.state;
    return 'UNKNOWN';
  }
  function error(session,event,code) {
    return frozen({...session,errors:frozen([...session.errors,
      frozen({phase:session.phase,eventType:event.type,code})])});
  }
  function append(session,event,phase,next) {
    const count=session.events.length;
    if(count>=100)throw new RangeError('Too many synthetic actions');
    return frozen([...session.events,frozen({
      sequence:count+1,phase,type:event.type,
      state:next,elapsedVirtualMs:elapsed(session),
    })]);
  }
  function elapsed(session) {
    return session.last.elapsedVirtualMs+(session.reconnect?.elapsedVirtualMs??0);
  }
  function dispatch(session,event) {
    if(!session || !Object.isFrozen(session) || !session.config)throw new TypeError('Invalid composite session');
    if(!event || typeof event!=='object'||typeof event.type!=='string')throw new TypeError('Invalid composite action');
    if(session.phase==='OFF'||isTerminal(session))return session;
    if(session.phase==='LAST'){
      const previous=session.last;
      const next=engine.dispatch(previous,event);
      if(next===previous)return session;
      const changed=next.actions.length!==previous.actions.length;
      const nextPhase=LAST_TERMINAL.has(next.state)?'CANCEL_CHOICE':'LAST';
      const updated=frozen({...session,last:next,phase:nextPhase});
      if(!changed)return frozen({...updated,errors:frozen([...session.errors,
        frozen({phase:'LAST',eventType:event.type,code:next.errors.at(-1)?.code??'INVALID_TRANSITION'})])});
      return frozen({...updated,events:append(updated,event,'LAST',next.state)});
    }
    if(session.phase==='CANCEL_CHOICE'){
      if(event.type!=='KEEP_REGISTRATION'&&event.type!=='MISTAKEN_CANCEL')
        return error(session,event,'INVALID_TRANSITION');
      const updated=frozen({...session,phase:'READY_RECONNECT',
        cancellationMistakes:session.cancellationMistakes+(event.type==='MISTAKEN_CANCEL'?1:0)});
      return frozen({...updated,events:append(updated,event,'CANCELLATION','READY_RECONNECT')});
    }
    if(session.phase==='READY_RECONNECT'){
      if(event.type!=='CONTINUE_RECONNECT')return error(session,event,'INVALID_TRANSITION');
      const updated=frozen({...session,phase:'RECONNECT',reconnect:engine.createScenario(reconnectConfig(session.config))});
      return frozen({...updated,events:append(updated,event,'RECOVERY','ACTIVE')});
    }
    const previous=session.reconnect;
    const next=engine.dispatch(previous,event);
    if(next===previous)return session;
    const changed=next.actions.length!==previous.actions.length;
    const updated=frozen({...session,reconnect:next});
    if(!changed)return frozen({...updated,errors:frozen([...session.errors,
      frozen({phase:'RECONNECT',eventType:event.type,code:next.errors.at(-1)?.code??'INVALID_TRANSITION'})])});
    return frozen({...updated,events:append(updated,event,'RECONNECT',next.state)});
  }
  function isTerminal(session) {
    return session.phase==='RECONNECT'&&RECONNECT_TERMINAL.has(session.reconnect?.state);
  }
  function summary(session) {
    if(!session || !Object.isFrozen(session)||!session.config)throw new TypeError('Invalid composite session');
    return frozen({
      schemaVersion:1,scenarioId:'COMPOSITE',mode:session.config.mode,seed:session.config.seed,
      state:state(session),terminalState:isTerminal(session)?'COMPLETED':null,
      lastOutcome:LAST_TERMINAL.has(session.last.state)?session.last.state:null,
      reconnectOutcome:RECONNECT_TERMINAL.has(session.reconnect?.state)?session.reconnect.state:null,
      cancellationMistakes:session.cancellationMistakes,
      duplicateAttempts:session.reconnect?.duplicateAttempts??0,
      elapsedVirtualMs:elapsed(session),
      actions:session.events,errors:frozen([
        ...session.errors,
        ...session.last.errors.map(x=>frozen({...x,phase:'LAST'})),
        ...(session.reconnect?.errors.map(x=>frozen({...x,phase:'RECONNECT'}))??[]),
      ]),
      source:'SYNTHETIC',
    });
  }
  return frozen({createComposite,dispatch,summary,state,isTerminal});
});
