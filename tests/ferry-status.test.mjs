import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_UID, FUTURE_TOLERANCE_MS, koreanDate, koreanDayStart, validateFerryRecord }
  from '../docs/ferry-status-validator.mjs';
import { createFerryStatusController, STATUS_URL } from '../docs/ferry-status.js';

const NOW = Date.parse('2026-10-24T10:30:00+09:00');
const makeRecord = (overrides = {}) => ({ status: 'normal', date: koreanDate(NOW), serviceDayStart: koreanDayStart(NOW),
  memo: '', updatedAt: NOW - 60000, updatedByUID: ADMIN_UID, ...overrides });

test('Korea service day changes at UTC 15:00, regardless of host timezone', () => {
  const before = Date.parse('2026-10-24T14:59:59.999Z'), midnight = before + 1;
  assert.equal(koreanDate(before), '2026-10-24');
  assert.equal(koreanDate(midnight), '2026-10-25');
  assert.equal(koreanDayStart(midnight), midnight);
});

for (const status of ['normal', 'cancel', 'shortened']) {
  test(`${status}: valid today record stays active until Korea midnight`, () => {
    const record = makeRecord({ status, ...(status === 'shortened' ? { lastDeparture: '16:30' } : {}) });
    assert.equal(validateFerryRecord(record, NOW).confirmed, true);
    assert.equal(validateFerryRecord(record, NOW + 8 * 3600000).confirmed, true);
    assert.equal(validateFerryRecord(record, koreanDayStart(NOW) + 86400000).reason, 'expired');
  });
}

test('missing, scalar, array, extra fields, and unrecognized statuses fail closed', () => {
  for (const value of [null, undefined, 'normal', 1, [], {}, makeRecord({ unexpected: true }), makeRecord({ status: 'closed' })]) {
    assert.equal(validateFerryRecord(value, NOW).confirmed, false);
  }
});

test('only the configured operator UID can produce a confirmed record', () => {
  for (const updatedByUID of ['', null, undefined, 'someone-else']) {
    assert.equal(validateFerryRecord(makeRecord({ updatedByUID }), NOW).reason, 'author');
  }
  assert.equal(validateFerryRecord(makeRecord(), NOW, '').confirmed, false);
});

test('date string and exact Korea day start must both match', () => {
  for (const fields of [{ date: '2026-10-23' }, { date: '2026-10-24T00:00:00Z' },
    { serviceDayStart: koreanDayStart(NOW) + 1 }, { serviceDayStart: String(koreanDayStart(NOW)) }]) {
    assert.equal(validateFerryRecord(makeRecord(fields), NOW).reason, 'date');
  }
});

test('timestamps must be integer milliseconds within the stated Korea service day', () => {
  for (const updatedAt of ['1792790000000', null, Infinity, NOW + 0.5, koreanDayStart(NOW) - 1, koreanDayStart(NOW) + 86400000]) {
    assert.equal(validateFerryRecord(makeRecord({ updatedAt }), NOW).reason, 'timestamp');
  }
});

test('future clock tolerance is one minute, never five minutes', () => {
  assert.equal(validateFerryRecord(makeRecord({ updatedAt: NOW + FUTURE_TOLERANCE_MS }), NOW).confirmed, true);
  assert.equal(validateFerryRecord(makeRecord({ updatedAt: NOW + FUTURE_TOLERANCE_MS + 1 }), NOW).reason, 'future');
  assert.equal(validateFerryRecord(makeRecord({ updatedAt: NOW + 300000 }), NOW).confirmed, false);
});

test('midnight invalidates even a record entered just one minute earlier', () => {
  const stamp = Date.parse('2026-10-24T23:59:00+09:00');
  const record = makeRecord({ updatedAt: stamp });
  assert.equal(validateFerryRecord(record, stamp).confirmed, true);
  assert.equal(validateFerryRecord(record, stamp + 60000).reason, 'expired');
  assert.equal(validateFerryRecord(record, stamp).expiresAt, stamp + 60000);
});

test('shortened departure must be an explicit valid HH:MM, never inferred', () => {
  for (const lastDeparture of [null, '', '24:00', '16:60', '7:30', 1630, '<img src=x>']) {
    assert.equal(validateFerryRecord(makeRecord({ status: 'shortened', lastDeparture }), NOW).confirmed, false);
  }
  for (const status of ['normal', 'cancel']) {
    assert.equal(validateFerryRecord(makeRecord({ status, lastDeparture: '16:30' }), NOW).confirmed, false);
    assert.equal(validateFerryRecord(makeRecord({ status }), NOW).record.lastDeparture, null);
  }
});

test('memo is required, bounded, and preserved as text; output is a copy', () => {
  for (const memo of [null, undefined, 42, 'x'.repeat(501)]) {
    assert.equal(validateFerryRecord(makeRecord({ memo }), NOW).confirmed, false);
  }
  const input = makeRecord({ memo: '<img src=x onerror=alert(1)>' });
  const result = validateFerryRecord(input, NOW);
  assert.equal(result.record.memo, input.memo);
  input.status = 'cancel';
  assert.equal(result.record.status, 'normal');
});

function harness(fetcher, epoch = NOW) {
  let clock = epoch, id = 0;
  const timers = new Map(), intervals = new Map(), listeners = new Map();
  const elements = Object.fromEntries(['status', 'date', 'label', 'message', 'checked', 'source', 'refresh', 'last']
    .map(key => [key, { textContent: '', hidden: false, disabled: false, dataset: {},
      set innerHTML(_) { throw new Error('Unsafe HTML insertion'); },
      setAttribute() {}, addEventListener(name, handler) { listeners.set('button:' + name, handler); }, removeEventListener() {} }]));
  const doc = { hidden: false, getElementById: key => elements[key.replace('service-', '')],
    addEventListener: (name, handler) => listeners.set(name, handler), removeEventListener() {} };
  const controller = createFerryStatusController({ document: doc, fetch: fetcher, now: () => clock,
    setTimeout: (fn, ms) => { timers.set(++id, { fn, ms }); return id; }, clearTimeout: value => timers.delete(value),
    setInterval: fn => { intervals.set(++id, fn); return id; }, clearInterval: value => intervals.delete(value) });
  return { controller, elements, timers, intervals, listeners, doc, setNow: value => { clock = value; } };
}

test('successful client fetch uses only a credential-free GET and renders explicit provenance', async () => {
  let options;
  const h = harness(async (url, request) => {
    assert.equal(url, STATUS_URL); options = request;
    return { ok: true, json: async () => makeRecord() };
  });
  await h.controller.refresh();
  assert.equal(options.method, 'GET');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(h.elements.status.dataset.state, 'normal');
  assert.equal(h.elements.label.textContent, '운영자 확인 · 정상');
  assert.match(h.elements.source.textContent, /코코나라 운영자.*항구·방향별 확인 필요/);
  assert.equal(h.elements.last.hidden, true);
});

test('normal status never supplies a timetable-derived last or next departure', async () => {
  const h = harness(async () => ({ ok: true, json: async () => makeRecord() }));
  await h.controller.refresh();
  assert.equal(h.elements.last.textContent, '');
  assert.match(h.elements.message.textContent, /실제 출항 시각은 항구에 확인/);
});

test('shortened explicit time and hostile memo are written as plain text', async () => {
  const memo = '<img src=x onerror=alert(1)>';
  const h = harness(async () => ({ ok: true, json: async () => makeRecord({ status: 'shortened', lastDeparture: '16:30', memo }) }));
  await h.controller.refresh();
  assert.match(h.elements.message.textContent, /<img src=x onerror=alert\(1\)>/);
  assert.match(h.elements.last.textContent, /운영자 입력 막배 16:30.*적용 항구·방향 재확인/);
  assert.equal(h.elements.last.hidden, false);
});

for (const failure of ['network', 'http', 'parse', 'invalid-author', 'wrong-date']) {
  test(`client ${failure} clears a previous confirmed status`, async () => {
    let first = true;
    const h = harness(async () => {
      if (first) { first = false; return { ok: true, json: async () => makeRecord() }; }
      if (failure === 'network') throw new Error('Offline');
      if (failure === 'http') return { ok: false };
      if (failure === 'parse') return { ok: true, json: async () => { throw new Error('Malformed JSON'); } };
      return { ok: true, json: async () => makeRecord(failure === 'invalid-author'
        ? { updatedByUID: 'wrong-user' } : { date: '2026-10-23' }) };
    });
    await h.controller.refresh();
    assert.equal(h.elements.status.dataset.confirmed, 'true');
    await h.controller.refresh();
    assert.equal(h.elements.status.dataset.state, 'unconfirmed');
    assert.equal(h.elements.label.textContent, '운항 안내 연결 확인 필요');
    assert.equal(h.elements.last.hidden, true);
  });
}

test('an unresponsive fetch times out even when the network adapter ignores AbortSignal', async () => {
  const h = harness(() => new Promise(() => {}));
  const promise = h.controller.refresh();
  [...h.timers.values()].find(timer => timer.ms === 8000).fn();
  await promise;
  assert.equal(h.elements.status.dataset.state, 'unconfirmed');
  assert.equal(h.elements.refresh.disabled, false);
  assert.match(h.elements.message.textContent, /불러오지 못했습니다/);
});

test('midnight timer restores the default guidance without another network response', async () => {
  const epoch = koreanDayStart(NOW) + 86400000 - 2000;
  const record = makeRecord({ updatedAt: epoch });
  const h = harness(async () => ({ ok: true, json: async () => record }), epoch);
  await h.controller.refresh();
  const expiry = [...h.timers.values()].find(timer => timer.ms === 2000);
  assert.ok(expiry);
  h.setNow(epoch + 2000); expiry.fn();
  assert.equal(h.elements.status.dataset.state, 'default');
  assert.match(h.elements.message.textContent, /평상시 시간표 기준/);
});

test('midnight timer and visible-tab refresh reject yesterday before fetching', async () => {
  const stamp = Date.parse('2026-10-24T23:59:00+09:00');
  let reads = 0;
  const h = harness(async () => { reads++; return { ok: true, json: async () => makeRecord({ updatedAt: stamp }) }; }, stamp);
  h.controller.start(); await h.controller.refresh();
  assert.equal(h.elements.status.dataset.confirmed, 'true');
  h.setNow(stamp + 60000);
  h.listeners.get('visibilitychange')();
  assert.equal(h.elements.status.dataset.confirmed, 'false');
  await h.controller.refresh();
  assert.equal(reads, 2);
  assert.equal(h.elements.status.dataset.state, 'default');
  h.controller.stop();
});

test('60-second tick revalidates the service day even when the tab is hidden', async () => {
  const h = harness(async () => ({ ok: true, json: async () => makeRecord() }));
  h.controller.start(); await h.controller.refresh();
  h.doc.hidden = true;
  h.setNow(koreanDayStart(NOW) + 86400000);
  [...h.intervals.values()][0]();
  assert.equal(h.elements.status.dataset.state, 'default');
  h.controller.stop();
});

for (const absent of ['missing', 'expired']) {
  test(`successful read with ${absent} override uses explicitly unconfirmed default guidance`, async () => {
    const record = absent === 'missing' ? null : makeRecord({ date: '2026-10-23', serviceDayStart: koreanDayStart(NOW) - 86400000, updatedAt: NOW - 86400000 });
    const h = harness(async () => ({ ok: true, json: async () => record }));
    await h.controller.refresh();
    assert.equal(h.elements.status.dataset.state, 'default');
    assert.equal(h.elements.status.dataset.confirmed, 'false');
    assert.equal(h.elements.label.textContent, '정상운항 기본 안내');
    assert.equal(h.elements.message.textContent, '평상시 시간표 기준입니다. 당일 운항 확정 정보는 선사에 확인하세요.');
  });
}
