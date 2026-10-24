import { validateFerryRecord, koreanDate } from './ferry-status-validator.mjs';

// Public, read-only RTDB REST endpoint from the existing Coconara site.
// No login SDK, access token, write request, or localStorage is needed here.
export const STATUS_URL = 'https://coconara-52bc4-default-rtdb.firebaseio.com/ferryStatus.json';
const SOURCE = '정보 입력: 코코나라 운영자 · 성산–우도 참고 안내 · 항구·방향별 확인 필요';
const LABELS = { normal: '운영자 확인 · 정상', cancel: '운영자 확인 · 결항', shortened: '운영자 확인 · 단축' };
const MESSAGES = {
  normal: '코코나라 운영자가 정상 운항으로 입력한 안내입니다. 다음 배와 막배의 실제 출항 시각은 항구에 확인해 주세요.',
  cancel: '코코나라 운영자가 결항으로 입력한 안내입니다. 출발 전에 이용할 항구와 방향의 운항 여부를 다시 확인해 주세요.',
  shortened: '코코나라 운영자가 단축 운항으로 입력한 안내입니다. 적용 항구와 방향, 실제 막배 시각을 항구에 다시 확인해 주세요.'
};

export function createFerryStatusController({
  document: doc = document,
  fetch: fetcher = globalThis.fetch.bind(globalThis),
  now = Date.now,
  setTimeout: later = globalThis.setTimeout.bind(globalThis),
  clearTimeout: cancelLater = globalThis.clearTimeout.bind(globalThis),
  setInterval: repeat = globalThis.setInterval.bind(globalThis),
  clearInterval: cancelRepeat = globalThis.clearInterval.bind(globalThis),
  timeoutMs = 8000
} = {}) {
  const elements = Object.fromEntries(['status', 'date', 'label', 'message', 'checked', 'source', 'refresh', 'last']
    .map(key => [key, doc.getElementById('service-' + key)]));
  if (!elements.status) return null;
  let raw = null, failure = 'loading', active = null, stopped = false, expiryTimer, interval;
  const put = (key, value) => { if (elements[key]) elements[key].textContent = value; };
  const clockText = epoch => new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(new Date(epoch));

  function render() {
    if (stopped) return;
    const epoch = now();
    const result = failure ? { confirmed: false, status: 'unconfirmed', reason: failure } : validateFerryRecord(raw, epoch);
    cancelLater(expiryTimer);
    const isDefault = !result.confirmed && ['missing', 'expired'].includes(result.reason);
    elements.status.dataset.state = isDefault ? 'default' : result.status;
    elements.status.dataset.confirmed = String(result.confirmed);
    put('date', koreanDate(epoch) + ' · 한국시간');
    put('source', SOURCE);
    put('last', '');
    if (elements.last) elements.last.hidden = true;
    if (result.confirmed) {
      const record = result.record;
      put('label', LABELS[result.status]);
      put('message', MESSAGES[result.status] + (record.memo.trim() ? '\n운영자 메모: ' + record.memo : ''));
      put('checked', '운영자 입력 ' + clockText(record.updatedAt) + ' · 한국시간 · 오늘 자정까지 적용');
      if (result.status === 'shortened' && elements.last) {
        put('last', '운영자 입력 막배 ' + record.lastDeparture + ' · 적용 항구·방향 재확인 필요');
        elements.last.hidden = false;
      }
      // An operator override expires exactly at Korea midnight.
      expiryTimer = later(render, Math.max(1, result.expiresAt - epoch));
    } else if (isDefault) {
      put('label', '정상운항 기본 안내');
      put('message', '평상시 시간표 기준입니다. 당일 운항 확정 정보는 선사에 확인하세요.');
      put('checked', '오늘 등록된 특이사항 없음 · 당일 운항을 확인했다는 뜻은 아닙니다.');
    } else {
      put('label', '운항 안내 연결 확인 필요');
      const message = result.reason === 'loading'
        ? '코코나라 운영자의 당일 입력 기록을 불러오고 있습니다. 탑승 전 항구에 확인해 주세요.'
        : ['network', 'timeout', 'http', 'parse'].includes(result.reason)
          ? '운항 안내를 불러오지 못했습니다. 다시 확인하거나 항구에 전화해 주세요.'
          : '저장된 운항 안내의 형식이나 날짜를 확인하지 못했습니다. 새로고침하거나 선사에 오늘의 운항 여부를 확인해 주세요.';
      put('message', message);
      put('checked', '연결 및 기록 확인 후 안내 · 당일 운항은 선사에 확인');
    }
    return result;
  }

  async function refresh() {
    if (stopped) return;
    if (active) return active.promise;
    render(); // A hidden tab must not keep yesterday's or expired status visible.
    const controller = new AbortController();
    const request = { controller, promise: null, timer: null };
    active = request;
    if (elements.refresh) {
      elements.refresh.disabled = true;
      elements.refresh.setAttribute('aria-busy', 'true');
      put('refresh', '확인 중…');
    }
    request.promise = (async () => {
      let errorReason = 'network';
      try {
        const deadline = new Promise((_, reject) => {
          request.timer = later(() => {
            errorReason = 'timeout';
            controller.abort();
            reject(new Error('Status request timed out'));
          }, timeoutMs);
        });
        const load = (async () => {
          const response = await fetcher(STATUS_URL, {
            method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', signal: controller.signal
          });
          if (!response.ok) { errorReason = 'http'; throw new Error('Status unavailable'); }
          try { return await response.json(); }
          catch (error) { errorReason = 'parse'; throw error; }
        })();
        const value = await Promise.race([load, deadline]);
        if (stopped || active !== request) return;
        raw = value;
        failure = '';
      } catch (_) {
        if (stopped || active !== request) return;
        raw = null;
        failure = errorReason;
      } finally {
        cancelLater(request.timer);
        if (!stopped && active === request) {
          active = null;
          if (elements.refresh) {
            elements.refresh.disabled = false;
            elements.refresh.setAttribute('aria-busy', 'false');
            put('refresh', '운항 안내 다시 확인');
          }
          render();
        }
      }
    })();
    return request.promise;
  }

  function onVisible() { if (!doc.hidden) { render(); void refresh(); } }
  function start() {
    render();
    elements.refresh?.addEventListener('click', refresh);
    doc.addEventListener('visibilitychange', onVisible);
    interval = repeat(() => { render(); if (!doc.hidden) void refresh(); }, 60000);
    void refresh();
  }
  function stop() {
    stopped = true;
    active?.controller.abort();
    cancelLater(active?.timer);
    cancelLater(expiryTimer);
    cancelRepeat(interval);
    elements.refresh?.removeEventListener('click', refresh);
    doc.removeEventListener('visibilitychange', onVisible);
  }
  return { start, stop, refresh, render };
}

if (typeof document !== 'undefined') {
  const start = () => createFerryStatusController()?.start();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
