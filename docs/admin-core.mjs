import { ADMIN_UID, koreanDate, koreanDayStart, validateFerryRecord } from './ferry-status-validator.mjs';

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }

export function isAllowedAdmin(auth, authReady) {
  return Boolean(authReady && auth?.currentUser?.uid === ADMIN_UID);
}

export function buildFerryPayload({ status, memo, lastDeparture }, epoch, uid, serverTimestamp) {
  if (uid !== ADMIN_UID) fail('admin/unauthorized', '관리자 권한이 없습니다.');
  const candidate = { status, date: koreanDate(epoch), serviceDayStart: koreanDayStart(epoch),
    memo: typeof memo === 'string' ? memo.trim() : memo, updatedAt: epoch, updatedByUID: uid };
  if (status === 'shortened') candidate.lastDeparture = lastDeparture;
  if (!validateFerryRecord(candidate, epoch).confirmed) fail('admin/invalid', '운항 상태, 막배 시간, 500자 이내 메모를 확인해 주세요.');
  if (!serverTimestamp || typeof serverTimestamp !== 'object' || serverTimestamp['.sv'] !== 'timestamp') {
    fail('admin/timestamp', '서버 시간 설정을 확인해야 합니다.');
  }
  return { ...candidate, updatedAt: serverTimestamp };
}

/** The SDK promise resolves only after the server acknowledges the write. */
export async function saveFerryOverride({ auth, authReady, connected, timeReady, ref, values, epoch, serverTimestamp }) {
  if (!isAllowedAdmin(auth, authReady)) fail('admin/unauthorized', '관리자 권한이 없습니다.');
  if (!connected || !timeReady) fail('admin/offline', '서버 연결과 시간을 확인한 후 다시 저장해 주세요.');
  if (!ref || typeof ref.set !== 'function') fail('admin/unavailable', '운항 관리 연결을 준비하지 못했습니다.');
  const payload = buildFerryPayload(values, epoch, auth.currentUser.uid, serverTimestamp);
  await ref.set(payload);
  return { date: payload.date, status: payload.status };
}

export function adminErrorText(error) {
  const code = String(error?.code || '').toLowerCase();
  if (code.startsWith('admin/')) return error.message;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '로그인이 취소되었습니다. 다시 시도할 수 있습니다.';
  if (code === 'auth/popup-blocked') return '브라우저의 팝업 차단을 해제한 뒤 Google 로그인을 다시 눌러 주세요.';
  if (code === 'auth/unauthorized-domain') return '이 도메인에서 로그인이 허용되지 않았습니다. Firebase Authentication의 승인된 도메인에 현재 사이트 주소를 추가해야 합니다.';
  if (code === 'auth/operation-not-allowed') return 'Firebase Authentication에서 Google 로그인 제공업체를 활성화해야 합니다.';
  if (code === 'auth/account-exists-with-different-credential') return '기존 관리자 계정과 Google 로그인의 연결이 필요합니다. 기존 관리자 UID를 유지한 채 계정 제공업체를 연결해야 합니다.';
  if (['auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) return '이메일 또는 비밀번호를 확인해 주세요.';
  if (code === 'permission_denied' || code === 'permission-denied') return '서버가 저장 권한을 거부했습니다. 관리자 UID와 Firebase 데이터베이스 규칙을 확인해 주세요.';
  if (code === 'auth/network-request-failed' || code === 'network_error') return '네트워크 연결을 확인하고 다시 시도해 주세요.';
  if (code === 'auth/too-many-requests') return '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.';
  return '요청을 완료하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
}
