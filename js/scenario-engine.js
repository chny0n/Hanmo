/* Hanmo practice-only deterministic scenario engine. Does not touch original UI,
 * localStorage, real network requests, university account data, or school APIs.
 * v1 is deliberately unconnected to BASIC/TIME/SELECT until baseline QA (#71).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HanmoScenario = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const LAST = 'LAST_COURSE_FAIL';
  const RECONNECT = 'RECONNECT_RECOVERY';
  const OUTCOMES = ['CONFIRMED', 'NOT_APPLIED', 'UNKNOWN'];
  const TERMINAL = new Set(['REPLACED', 'NO_VALID_ALTERNATIVE', 'UNRESOLVED', ...OUTCOMES]);
  const MODES = new Set(['BASIC', 'TIME', 'SELECT']);
  const VALID_EVENTS = new Set([
    'CONFIRM_PREVIOUS', 'ATTEMPT_LAST', 'OPEN_ALTERNATIVES',
    'CHOOSE_ALTERNATIVE', 'DECLARE_NO_ALTERNATIVE', 'ABANDON',
    'SUBMIT', 'VIRTUAL_DROP', 'RECONNECT', 'QUEUE_FINISHED', 'VERIFY',
  ]);
  const CHECKS = ['timeOk', 'creditOk', 'prerequisiteOk', 'noDuplicate', 'areaOk'];

  function validId(value) {
    return typeof value === 'string' && /^SYN-[A-Za-z0-9_-]{1,64}$/.test(value);
  }

  function normalizeConfig(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new TypeError('Synthetic scenario configuration is required');
    }
    if (input.schemaVersion !== 1) throw new TypeError('Unsupported scenario schema');
    if (input.scenarioId !== LAST && input.scenarioId !== RECONNECT) {
      throw new TypeError('Unsupported scenario ID');
    }
    if (!MODES.has(input.mode)) throw new TypeError('Unknown original practice mode');
    if (!Number.isSafeInteger(input.seed) || input.seed < 0 || input.seed > 0xffffffff) {
      throw new TypeError('A valid 32-bit integer seed is required');
    }
    // No explicit opt-in means the scenario cannot interfere with legacy modes.
    const enabled = input.enabled ?? false;
    if (typeof enabled !== 'boolean') {
      throw new TypeError('Scenario enabled must be boolean');
    }
    if (typeof input.virtualClockStart !== 'string' ||
        !/^\d{4}-\d\d-\d\dT/.test(input.virtualClockStart) ||
        !/Z|[+-]\d\d:\d\d$/.test(input.virtualClockStart) ||
        !Number.isFinite(Date.parse(input.virtualClockStart))) {
      throw new TypeError('Valid ISO virtual clock with time zone is required');
    }
    const ids = input.syntheticCourseIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 40 ||
        ids.some(id => !validId(id)) || new Set(ids).size !== ids.length) {
      throw new TypeError('Only unique synthetic course IDs are allowed');
    }
    const alternatives = input.alternatives ?? [];
    if (!Array.isArray(alternatives) || alternatives.length > 40) {
      throw new TypeError('Alternatives must be a bounded array');
    }
    const seen = new Set();
    const parsed = alternatives.map(item => {
      if (!item || typeof item !== 'object' || !validId(item.syntheticCourseId) ||
          !ids.includes(item.syntheticCourseId) || seen.has(item.syntheticCourseId) ||
          (input.scenarioId === LAST && item.syntheticCourseId === ids[0])) {
        throw new TypeError('Alternative course must be an existing unique synthetic ID');
      }
      seen.add(item.syntheticCourseId);
      for (const check of CHECKS) if (typeof item[check] !== 'boolean') {
        throw new TypeError('Explicit synthetic alternative eligibility is required');
      }
      return Object.freeze({syntheticCourseId: item.syntheticCourseId,
        ...Object.fromEntries(CHECKS.map(check => [check, item[check]]))});
    });
    if (input.scenarioId === RECONNECT && parsed.length) {
      throw new TypeError('Reconnect scenario cannot import alternative courses');
    }
    return Object.freeze({
      schemaVersion: 1, scenarioId: input.scenarioId, seed: input.seed,
      mode: input.mode, enabled,
      virtualClockStart: input.virtualClockStart,
      syntheticCourseIds: Object.freeze([...ids]),
      alternatives: Object.freeze(parsed),
    });
  }

  function createScenario(config) {
    const safe = normalizeConfig(config);
    return Object.freeze({
      config: safe, state: !safe.enabled ? 'OFF' : safe.scenarioId === LAST ? 'READY' : 'ACTIVE',
      elapsedVirtualMs: 0, duplicateAttempts: 0,
      actions: Object.freeze([]), errors: Object.freeze([]),
    });
  }

  function eligible(alternative) {
    return CHECKS.every(check => alternative[check] === true);
  }

  function dispatch(session, event) {
    if (!session || !session.config || !Object.isFrozen(session.config)) {
      throw new TypeError('Use a session created by createScenario');
    }
    if (!event || typeof event !== 'object' || !VALID_EVENTS.has(event.type)) {
      throw new TypeError('Unknown practice scenario event');
    }
    if (event.elapsedVirtualMs !== undefined &&
        (!Number.isSafeInteger(event.elapsedVirtualMs) || event.elapsedVirtualMs < 0 ||
         event.elapsedVirtualMs > 3600000)) {
      throw new TypeError('Virtual elapsed milliseconds must be within one hour');
    }
    if (session.state === 'OFF' || TERMINAL.has(session.state)) return session;
    const {config,state} = session;
    let next = null;
    let error = null;
    let duplicateAttempts = session.duplicateAttempts;

    if (config.scenarioId === LAST) {
      if (state === 'READY' && event.type === 'CONFIRM_PREVIOUS') next = 'N_MINUS_1_CONFIRMED';
      else if (state === 'N_MINUS_1_CONFIRMED' && event.type === 'ATTEMPT_LAST') next = 'LAST_REJECTED';
      else if (state === 'LAST_REJECTED' && event.type === 'OPEN_ALTERNATIVES') next = 'SEARCH_ALTERNATIVE';
      else if (state === 'SEARCH_ALTERNATIVE' && event.type === 'CHOOSE_ALTERNATIVE') {
        const choice = config.alternatives.find(x => x.syntheticCourseId === event.syntheticCourseId);
        if (!choice || !eligible(choice)) error = 'ALTERNATIVE_INVALID';
        else next = 'REPLACED';
      } else if (state === 'SEARCH_ALTERNATIVE' && event.type === 'DECLARE_NO_ALTERNATIVE') {
        if (config.alternatives.some(eligible)) error = 'VALID_ALTERNATIVE_EXISTS';
        else next = 'NO_VALID_ALTERNATIVE';
      } else if (state === 'SEARCH_ALTERNATIVE' && event.type === 'ABANDON') next = 'UNRESOLVED';
    } else {
      if (state === 'ACTIVE' && event.type === 'SUBMIT') next = 'REQUEST_SENT';
      else if (state === 'REQUEST_SENT' && event.type === 'VIRTUAL_DROP') next = 'VIRTUAL_DROP';
      else if (state === 'VIRTUAL_DROP' && event.type === 'RECONNECT') next = 'RECONNECT_QUEUE';
      else if (state === 'RECONNECT_QUEUE' && event.type === 'QUEUE_FINISHED') next = 'RECONCILE';
      else if (state === 'RECONCILE' && event.type === 'VERIFY') next = OUTCOMES[config.seed % OUTCOMES.length];
      if (event.type === 'SUBMIT' && state !== 'ACTIVE') duplicateAttempts++;
    }
    if (next === null && error === null) error = 'INVALID_TRANSITION';
    const elapsed = event.elapsedVirtualMs ?? 0;
    const previous = session.elapsedVirtualMs;
    if (previous + elapsed > Number.MAX_SAFE_INTEGER) throw new RangeError('Virtual clock overflow');
    if (error) {
      return Object.freeze({...session, duplicateAttempts,
        errors: Object.freeze([...session.errors, Object.freeze({state, type: event.type, code: error})])});
    }
    return Object.freeze({...session, state: next, duplicateAttempts,
      elapsedVirtualMs: previous + elapsed,
      actions: Object.freeze([...session.actions,
        Object.freeze({type: event.type, state: next, elapsedVirtualMs: previous + elapsed,
          ...(event.type === 'CHOOSE_ALTERNATIVE' ? {syntheticCourseId: event.syntheticCourseId} : {})})])});
  }

  function summary(session) {
    if (!session || !session.config) throw new TypeError('Invalid scenario session');
    return Object.freeze({schemaVersion: 1, scenarioId: session.config.scenarioId,
      seed: session.config.seed, mode: session.config.mode,
      terminalState: TERMINAL.has(session.state) ? session.state : null,
      state: session.state, elapsedVirtualMs: session.elapsedVirtualMs,
      duplicateAttempts: session.duplicateAttempts,
      actions: session.actions, errors: session.errors, source: 'SYNTHETIC'});
  }
  return Object.freeze({createScenario, dispatch, summary});
});
