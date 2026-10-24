/* Firebase totals are isolated by brand. No identities, URLs, or IPs are stored by this code. */
(function (root) {
  'use strict';
  const DAY = 86400000, KST = 32400000;
  const BASE = 'https://coconara-52bc4-default-rtdb.firebaseio.com/brandVisitsV1/';
  const HOSTS = {
    signature: 'udosignature.com', coconara: 'coconara.udosignature.com',
    udo: 'udo.udosignature.com', dalkom: 'dalkom-aje.udosignature.com',
    peanut: 'udopeanut.udosignature.com', cafe: 'udocafe.udosignature.com'
  };
  function dayStart(now) { return Math.floor((now + KST) / DAY) * DAY - KST; }
  function valid(value) {
    return value && Number.isSafeInteger(value.total) && value.total >= 1 &&
      Number.isSafeInteger(value.today) && value.today >= 1 && value.today <= value.total &&
      Number.isSafeInteger(value.day) && dayStart(value.day) === value.day;
  }
  function next(value, day) {
    if (value !== null && !valid(value)) throw new Error('Invalid counter');
    if (value && value.day > day) throw new Error('Clock mismatch');
    const total = (value ? value.total : 0) + 1;
    if (!Number.isSafeInteger(total)) throw new Error('Counter limit');
    return {total, today: value && value.day === day ? value.today + 1 : 1, day};
  }
  function visible(value, day) {
    if (value === null) return {today: 0, total: 0};
    if (!valid(value) || value.day > day) throw new Error('Invalid counter');
    return {today: value.day === day ? value.today : 0, total: value.total};
  }
  function createClient(options) {
    const {site, host, storage, fetch: send, now = Date.now, lock} = options;
    if (!Object.hasOwn(HOSTS, site)) throw new Error('Unknown site');
    const endpoint = BASE + site + '.json', key = 'udosignature:visit:v1:' + site;
    let memoryDay = null;
    async function request(method, value, etag) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const headers = method === 'GET' ? {'X-Firebase-ETag': 'true'} :
          {'Content-Type': 'application/json', 'if-match': etag};
        return await send(endpoint, {method, headers, cache: 'no-store', credentials: 'omit',
          referrerPolicy: 'no-referrer', signal: controller.signal,
          ...(method === 'PUT' ? {body: JSON.stringify(value)} : {})});
      } finally { clearTimeout(timer); }
    }
    async function read() {
      const response = await request('GET');
      if (!response.ok) throw new Error('Counter unavailable');
      const value = await response.json();
      visible(value, dayStart(now()));
      return {value, etag: response.headers.get('etag')};
    }
    async function update() {
      let snapshot = await read();
      const day = dayStart(now());
      let writable = host === HOSTS[site] && options.allowCount !== false;
      if (writable) {
        try {
          if (memoryDay === day || storage.getItem(key) === String(day)) writable = false;
          else {
            // Persist before the request: a lost response must not count again on reload.
            storage.setItem(key, String(day));
            if (storage.getItem(key) !== String(day)) writable = false;
          }
        } catch (_) { writable = false; }
      }
      if (!writable) return visible(snapshot.value, day);
      memoryDay = day;
      for (let attempt = 0; attempt < 5; attempt++) {
        // The date may change while a tab waits for a lock or the network.
        if (dayStart(now()) !== day || !snapshot.etag) return visible(snapshot.value, dayStart(now()));
        const value = next(snapshot.value, day);
        let response;
        try { response = await request('PUT', value, snapshot.etag); }
        catch (_) {
          // Outcome is uncertain; read the real total and never blindly repeat a write.
          return visible((await read()).value, dayStart(now()));
        }
        if (response.status === 412) { snapshot = await read(); continue; }
        if (!response.ok) return visible((await read()).value, dayStart(now()));
        return visible(await response.json(), dayStart(now()));
      }
      return visible(snapshot.value, dayStart(now()));
    }
    return {refresh: () => lock ? lock(key, update) : update()};
  }
  const api = {dayStart, valid, next, visible, createClient, HOSTS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!root.document) return;
  const widget = root.document.querySelector('[data-visitor-site]');
  if (!widget) return;
  let storage;
  try { storage = root.localStorage; } catch (_) { storage = null; }
  const client = createClient({site: widget.dataset.visitorSite, host: root.location.hostname,
    storage, fetch: root.fetch.bind(root), allowCount: widget.dataset.visitorCount !== 'off' && root.navigator.doNotTrack !== '1',
    lock: root.navigator.locks ? (name, fn) => root.navigator.locks.request(name, fn) : null});
  let busy = false, lastRefresh = 0, lastDay = null;
  async function refresh(force) {
    if (busy || root.document.hidden) return;
    const now = Date.now(), day = dayStart(now);
    if (!force && day === lastDay && now - lastRefresh < 300000) return;
    busy = true;
    try {
      const count = await client.refresh();
      widget.querySelector('[data-visitor-today]').textContent = count.today.toLocaleString('ko-KR');
      widget.querySelector('[data-visitor-total]').textContent = count.total.toLocaleString('ko-KR');
      widget.dataset.state = 'ready';
      lastDay = dayStart(Date.now());
    } catch (_) {
      // A stale value is not presented as today's confirmed count.
      widget.querySelector('[data-visitor-today]').textContent = '—';
      widget.querySelector('[data-visitor-total]').textContent = '—';
      widget.dataset.state = 'unavailable';
    } finally { busy = false; lastRefresh = Date.now(); }
  }
  root.document.addEventListener('visibilitychange', () => refresh(false));
  root.addEventListener('pageshow', () => refresh(false));
  // Also update an already-open page across Korean midnight, without repeated writes.
  setInterval(() => refresh(false), 60000);
  refresh(true);
})(typeof window !== 'undefined' ? window : globalThis);
