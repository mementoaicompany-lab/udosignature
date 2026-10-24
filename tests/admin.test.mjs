import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ADMIN_UID, koreanDate, koreanDayStart } from '../docs/ferry-status-validator.mjs';
import { isAllowedAdmin, buildFerryPayload, saveFerryOverride, adminErrorText } from '../docs/admin-core.mjs';

const NOW = Date.parse('2026-10-24T12:00:00+09:00');
const TIMESTAMP = Object.freeze({ '.sv': 'timestamp' });
const context = overrides => ({ auth: { currentUser: { uid: ADMIN_UID } }, authReady: true, connected: true,
  timeReady: true, ref: { set: async () => {} }, values: { status: 'normal', memo: '' },
  epoch: NOW, serverTimestamp: TIMESTAMP, ...overrides });

test('admin UI authorization requires both a resolved Auth event and the exact UID', () => {
  assert.equal(isAllowedAdmin(null, true), false);
  assert.equal(isAllowedAdmin({ currentUser: { uid: ADMIN_UID } }, false), false);
  assert.equal(isAllowedAdmin({ currentUser: { uid: 'other' } }, true), false);
  assert.equal(isAllowedAdmin({ currentUser: { uid: ADMIN_UID } }, true), true);
});

for (const status of ['normal', 'cancel', 'shortened']) {
  test(`save ${status} uses the existing schema and a server timestamp`, async () => {
    let payload;
    const result = await saveFerryOverride(context({ values: { status, memo: '  안내  ', lastDeparture: '16:30' },
      ref: { set: async value => { payload = value; } } }));
    assert.equal(payload.date, koreanDate(NOW));
    assert.equal(payload.serviceDayStart, koreanDayStart(NOW));
    assert.equal(payload.memo, '안내');
    assert.equal(payload.updatedByUID, ADMIN_UID);
    assert.equal(payload.updatedAt, TIMESTAMP);
    assert.equal(payload.lastDeparture, status === 'shortened' ? '16:30' : undefined);
    assert.deepEqual(result, { date: '2026-10-24', status });
    assert.deepEqual(Object.keys(payload).sort(), ['status', 'date', 'serviceDayStart', 'memo', 'updatedAt', 'updatedByUID',
      ...(status === 'shortened' ? ['lastDeparture'] : [])].sort());
  });
}

test('unauthenticated, wrong UID, pending auth, offline, and missing server clock never call write', async () => {
  let calls = 0;
  const ref = { set: async () => { calls++; } };
  for (const overrides of [{ auth: null }, { auth: { currentUser: { uid: 'other' } } }, { authReady: false },
    { connected: false }, { timeReady: false }]) {
    await assert.rejects(() => saveFerryOverride(context({ ...overrides, ref })));
  }
  assert.equal(calls, 0);
});

test('invalid forms and client timestamps are rejected before writes', async () => {
  let calls = 0;
  const ref = { set: async () => { calls++; } };
  for (const values of [{ status: 'anything', memo: '' }, { status: 'shortened', memo: '', lastDeparture: '24:00' },
    { status: 'shortened', memo: '' }, { status: 'cancel', memo: 'x'.repeat(501) }]) {
    await assert.rejects(() => saveFerryOverride(context({ ref, values })), { code: 'admin/invalid' });
  }
  await assert.rejects(() => saveFerryOverride(context({ ref, serverTimestamp: NOW })), { code: 'admin/timestamp' });
  assert.equal(calls, 0);
});

test('a server-denied write rejects instead of returning a success result', async () => {
  const error = Object.assign(new Error('Permission denied'), { code: 'PERMISSION_DENIED' });
  await assert.rejects(() => saveFerryOverride(context({ ref: { set: async () => { throw error; } } })), error);
  assert.match(adminErrorText(error), /서버가 저장 권한을 거부/);
});

test('a pending SDK write cannot be reported as saved before server acknowledgement', async () => {
  let acknowledge, finished = false;
  const promise = saveFerryOverride(context({ ref: { set: () => new Promise(resolve => { acknowledge = resolve; }) } }))
    .then(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  acknowledge(); await promise;
  assert.equal(finished, true);
});

test('Korea midnight generates the new date and serviceDayStart', () => {
  const midnight = Date.parse('2026-10-25T00:00:00+09:00');
  const payload = buildFerryPayload({ status: 'cancel', memo: '' }, midnight, ADMIN_UID, TIMESTAMP);
  assert.equal(payload.date, '2026-10-25');
  assert.equal(payload.serviceDayStart, midnight);
});

test('Google setup and popup failures give specific actionable messages', () => {
  assert.match(adminErrorText({ code: 'auth/unauthorized-domain' }), /승인된 도메인/);
  assert.match(adminErrorText({ code: 'auth/operation-not-allowed' }), /Google 로그인 제공업체/);
  assert.match(adminErrorText({ code: 'auth/account-exists-with-different-credential' }), /기존 관리자 UID/);
  assert.match(adminErrorText({ code: 'auth/popup-blocked' }), /팝업 차단/);
  assert.match(adminErrorText({ code: 'auth/popup-closed-by-user' }), /취소/);
});

test('admin entry is noindex, hidden and disabled until actual authentication, and absent from sitemap', async () => {
  const html = await readFile(new URL('../docs/admin/index.html', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../docs/sitemap.xml', import.meta.url), 'utf8');
  assert.match(html, /name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(html, /id="admin-editor"[^>]*hidden/);
  assert.match(html, /id="admin-fields" disabled/);
  assert.match(html, /id="admin-save"[^>]*disabled/);
  assert.doesNotMatch(sitemap, /\/admin/);
});
