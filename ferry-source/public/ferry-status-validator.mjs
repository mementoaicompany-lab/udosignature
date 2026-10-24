/* Pure validation: no network, DOM, storage, or timetable assumptions. */
export const ADMIN_UID = 'hXwWxpeGD5Ykm0icb1qVXUuwBE53';
export const FUTURE_TOLERANCE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const STATUSES = new Set(['normal', 'cancel', 'shortened']);
const FIELDS = new Set(['status', 'date', 'serviceDayStart', 'memo', 'lastDeparture', 'updatedAt', 'updatedByUID']);
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function koreanDate(epoch) {
  return new Date(epoch + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function koreanDayStart(epoch) {
  return Math.floor((epoch + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
}

/** A caller must supply a successful live-read result, never a cached default. */
export function validateFerryRecord(record, epoch = Date.now(), expectedUID = ADMIN_UID) {
  const reject = reason => ({ confirmed: false, status: 'unconfirmed', reason, record: null });
  if (!Number.isSafeInteger(epoch) || epoch < 0 || !Number.isFinite(new Date(epoch + KST_OFFSET_MS).getTime())) return reject('clock');
  if (record == null) return reject('missing');
  if (typeof record !== 'object' || Array.isArray(record)) return reject('invalid');
  if (Object.keys(record).some(key => !FIELDS.has(key))) return reject('invalid');
  if (!expectedUID || record.updatedByUID !== expectedUID) return reject('author');
  if (!STATUSES.has(record.status)) return reject('invalid');
  if (!Number.isSafeInteger(record.serviceDayStart) || record.serviceDayStart < 0 ||
      !Number.isFinite(new Date(record.serviceDayStart + KST_OFFSET_MS).getTime()) ||
      record.serviceDayStart !== koreanDayStart(record.serviceDayStart) ||
      record.date !== koreanDate(record.serviceDayStart)) return reject('date');
  if (typeof record.memo !== 'string' || record.memo.length > 500) return reject('invalid');
  if (!Number.isSafeInteger(record.updatedAt) || record.updatedAt < record.serviceDayStart ||
      record.updatedAt >= record.serviceDayStart + DAY_MS) return reject('timestamp');
  if (record.updatedAt > epoch + FUTURE_TOLERANCE_MS) return reject('future');
  if (record.status === 'shortened') {
    if (typeof record.lastDeparture !== 'string' || !TIME.test(record.lastDeparture)) return reject('invalid');
  } else if (record.lastDeparture != null) {
    return reject('invalid');
  }
  if (record.serviceDayStart < koreanDayStart(epoch)) return reject('expired');
  if (record.serviceDayStart > koreanDayStart(epoch)) return reject('date');
  return {
    confirmed: true,
    status: record.status,
    reason: null,
    expiresAt: record.serviceDayStart + DAY_MS,
    record: {
      status: record.status, date: record.date, serviceDayStart: record.serviceDayStart,
      updatedAt: record.updatedAt, updatedByUID: record.updatedByUID, memo: record.memo,
      lastDeparture: record.status === 'shortened' ? record.lastDeparture : null
    }
  };
}
