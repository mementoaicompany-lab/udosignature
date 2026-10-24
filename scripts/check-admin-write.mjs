/* Deterministic mocks only: no Firebase initialization, login or network writes. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const path = new URL('../docs/admin-core.mjs', import.meta.url);
if (existsSync(path)) {
  const { saveFerryOverride } = await import(path);
  const { ADMIN_UID } = await import(new URL('../docs/ferry-status-validator.mjs', import.meta.url));
  const epoch = Date.parse('2026-10-24T12:00:00+09:00');
  const serverTimestamp = { '.sv': 'timestamp' };
  let writes = [];
  const context = extra => ({ auth: { currentUser: { uid: ADMIN_UID } }, authReady: true,
    connected: true, timeReady: true, ref: { set: async value => writes.push(value) },
    values: { status: 'normal', memo: '' }, epoch, serverTimestamp, ...extra });
  for (const extra of [{ auth: null }, { authReady: false }, { auth: { currentUser: { uid: 'wrong' } } },
    { connected: false }, { timeReady: false }, { serverTimestamp: epoch },
    { values: { status: 'invalid', memo: '' } }, { values: { status: 'cancel', memo: 'x'.repeat(501) } }]) {
    await assert.rejects(() => saveFerryOverride(context(extra)));
  }
  assert.equal(writes.length, 0, 'Unauthorized or invalid inputs wrote data');
  await saveFerryOverride(context());
  assert.equal(writes.length, 1);
  assert.deepEqual(Object.keys(writes[0]).sort(), ['date', 'memo', 'serviceDayStart', 'status', 'updatedAt', 'updatedByUID'].sort());
  assert.equal(writes[0].updatedByUID, ADMIN_UID);
  assert.equal(writes[0].updatedAt, serverTimestamp);
  let acknowledge, completed = false;
  const pending = saveFerryOverride(context({ ref: { set: () => new Promise(resolve => { acknowledge = resolve; }) } }))
    .then(() => { completed = true; });
  await Promise.resolve();
  assert.equal(completed, false, 'Save completed before server acknowledgement');
  acknowledge(); await pending;
  await assert.rejects(() => saveFerryOverride(context({ ref: { set: async () => { throw new Error('server-denied'); } } })));
  console.log('PASS: administrator write guards, exact payload, server timestamp and server acknowledgement');
} else {
  console.log('SKIP: no administrator module in this site');
}
