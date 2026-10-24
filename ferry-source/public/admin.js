import { ADMIN_UID, koreanDate, validateFerryRecord } from './ferry-status-validator.mjs';
import { isAllowedAdmin, saveFerryOverride, adminErrorText } from './admin-core.mjs';

const config = {
  apiKey: 'AIzaSyCIr2DZGFPbv1Sw-XZOTfBa73cqyvfQuXM',
  authDomain: 'coconara-52bc4.firebaseapp.com',
  databaseURL: 'https://coconara-52bc4-default-rtdb.firebaseio.com',
  projectId: 'coconara-52bc4',
  storageBucket: 'coconara-52bc4.firebasestorage.app',
  messagingSenderId: '461448808298',
  appId: '1:461448808298:web:a03dd3d84eda0ac9dc4713'
};
const $ = id => document.getElementById(id);
const firebase = window.firebase;
let auth, database, ferryRef, authReady = false, persistenceReady = false, connected = false;
let timeReady = false, offset = 0, signingIn = false, signingOut = false, saving = false;
let reading = false, dirty = false, currentRecord = null, hasRead = false;
const now = () => Date.now() + (timeReady ? offset : 0);
const allowed = () => isAllowedAdmin(auth, authReady);
const message = (text, kind = '') => { $('admin-message').textContent = text; $('admin-message').dataset.kind = kind; };
const stateNames = { normal: '정상 안내', cancel: '결항 안내', shortened: '단축 운항 안내' };

function reflect() {
  $('admin-date').textContent = koreanDate(now()) + ' · 한국시간';
  $('admin-connection').textContent = connected && timeReady ? '서버 연결됨' : '서버 연결 확인 중';
  $('admin-editor').hidden = !allowed();
  $('admin-login').hidden = allowed();
  $('admin-login').disabled = !persistenceReady || signingIn || signingOut;
  $('admin-email-option').hidden = allowed();
  $('admin-email-login').disabled = !persistenceReady || signingIn || signingOut;
  $('admin-logout').hidden = !allowed();
  $('admin-logout').disabled = saving || signingOut;
  $('admin-fields').disabled = !allowed() || saving;
  $('admin-save').disabled = !allowed() || !connected || !timeReady || saving;
  $('admin-save').textContent = saving ? '서버에 저장 중…' : '오늘 안내 저장';
  $('admin-read').disabled = !allowed() || reading || saving;
  const user = allowed() ? auth.currentUser : null;
  $('admin-account').textContent = user ? (user.email || '관리자') + ' · 인증됨' : '등록된 관리자 계정으로 로그인하세요.';
  const status = $('admin-status').value;
  $('admin-last-wrap').hidden = status !== 'shortened';
  $('admin-last').required = status === 'shortened';
  $('admin-count').textContent = $('admin-memo').value.length + ' / 500';
  if (hasRead) {
    const record = validateFerryRecord(currentRecord, now());
    $('admin-current').textContent = record.confirmed
      ? '현재 등록: ' + stateNames[record.status] + ' · 오늘 자정까지 적용'
      : ['missing', 'expired'].includes(record.reason)
        ? '현재 등록: 오늘 특이사항 없음 · 정상운항 기본 안내'
        : '현재 저장된 기록을 검증하지 못했습니다.';
  } else $('admin-current').textContent = '등록 안내를 불러오고 있습니다.';
}

function fillDraft() {
  if (dirty) return;
  const result = validateFerryRecord(currentRecord, now());
  $('admin-status').value = result.confirmed ? result.status : 'normal';
  $('admin-memo').value = result.confirmed ? result.record.memo : '';
  $('admin-last').value = result.confirmed ? result.record.lastDeparture || '' : '';
}

async function readCurrent() {
  if (!allowed() || !ferryRef || !connected || reading || saving) return false;
  reading = true; reflect();
  try {
    const snapshot = await ferryRef.get();
    if (!allowed()) return false;
    currentRecord = snapshot.val(); hasRead = true;
    fillDraft();
    return true;
  } catch (_) {
    hasRead = false;
    message('저장된 안내를 불러오지 못했습니다. 연결을 확인하고 다시 불러와 주세요.', 'error');
    return false;
  } finally { reading = false; reflect(); }
}

async function login() {
  if (!auth || !persistenceReady || signingIn) return;
  signingIn = true; message('Google 로그인 창에서 관리자 계정을 선택해 주세요.'); reflect();
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await auth.signInWithPopup(provider);
    if (credential.user.uid !== ADMIN_UID) {
      await auth.signOut();
      message('이 Google 계정에는 관리자 권한이 없습니다. 기존 관리자 계정과 같은 UID로 연결된 계정으로 로그인해 주세요.', 'error');
    }
  } catch (error) { message(adminErrorText(error), 'error'); }
  finally { signingIn = false; reflect(); }
}

async function logout() {
  if (!auth || saving || signingOut) return;
  signingOut = true; reflect();
  try { await auth.signOut(); dirty = false; message('로그아웃했습니다.'); }
  catch (error) { message(adminErrorText(error), 'error'); }
  finally { signingOut = false; reflect(); }
}

async function loginEmail(event) {
  event.preventDefault();
  if (!auth || !persistenceReady || signingIn || !$('admin-email-form').reportValidity()) return;
  const email = $('admin-email').value.trim(), password = $('admin-password').value;
  signingIn = true; message('기존 관리자 계정을 확인하고 있습니다.'); reflect();
  try {
    const credential = await auth.signInWithEmailAndPassword(email, password);
    if (credential.user.uid !== ADMIN_UID) {
      await auth.signOut();
      message('이 계정에는 관리자 권한이 없습니다. 기존 등록된 관리자 계정으로 로그인해 주세요.', 'error');
    }
  } catch (error) { message(adminErrorText(error), 'error'); }
  finally { $('admin-password').value = ''; signingIn = false; reflect(); }
}

async function save(event) {
  event.preventDefault();
  if (saving) return;
  if (!allowed()) { message('관리자 로그인 후 저장할 수 있습니다.', 'error'); return; }
  if (!$('admin-form').reportValidity()) return;
  const values = { status: $('admin-status').value, memo: $('admin-memo').value, lastDeparture: $('admin-last').value };
  saving = true; reflect(); message('서버의 저장 완료 응답을 기다리고 있습니다.');
  const slow = setTimeout(() => message('아직 서버 응답을 기다리고 있습니다. 이 창을 유지해 주세요. 응답이 확인되어야 저장 완료로 안내합니다.'), 12000);
  try {
    const saved = await saveFerryOverride({ auth, authReady, connected, timeReady, ref: ferryRef, values,
      epoch: now(), serverTimestamp: firebase.database.ServerValue.TIMESTAMP });
    dirty = false;
    message(saved.date === koreanDate(now())
      ? '오늘 안내가 서버에 저장되었습니다. 새 사이트와 기존 안내 사이트에 같은 기록이 적용됩니다.'
      : '이전 날짜의 안내가 서버에 저장되었습니다. 자정이 지나 오늘 안내가 필요하면 다시 저장해 주세요.', 'success');
  } catch (error) { message('저장하지 못했습니다. ' + adminErrorText(error), 'error'); }
  finally { clearTimeout(slow); saving = false; reflect(); await readCurrent(); }
}

async function initialize() {
  $('admin-login').addEventListener('click', login);
  $('admin-email-form').addEventListener('submit', loginEmail);
  $('admin-logout').addEventListener('click', logout);
  $('admin-read').addEventListener('click', () => { void readCurrent(); });
  $('admin-form').addEventListener('submit', save);
  $('admin-form').addEventListener('input', () => { dirty = true; reflect(); });
  $('admin-status').addEventListener('change', () => { dirty = true; reflect(); });
  reflect();
  if (!firebase?.initializeApp || !firebase.auth || !firebase.database) {
    message('관리자 기능을 불러오지 못했습니다. 네트워크 연결 후 새로고침해 주세요.', 'error'); return;
  }
  try {
    const app = firebase.initializeApp(config, 'udo-ferry-admin');
    auth = app.auth(); database = app.database(); ferryRef = database.ref('ferryStatus');
    await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
    persistenceReady = true;
    auth.onAuthStateChanged(user => {
      authReady = true;
      if (user && user.uid !== ADMIN_UID) {
        message('이 계정에는 관리자 권한이 없습니다.', 'error');
        void auth.signOut().catch(error => message(adminErrorText(error), 'error'));
      } else if (user) {
        message('관리자 인증이 완료되었습니다. 특이사항이 있는 날 안내를 저장해 주세요.');
        void readCurrent();
      } else {
        hasRead = false; currentRecord = null; dirty = false;
        $('admin-memo').value = ''; $('admin-last').value = '';
      }
      reflect();
    }, error => { authReady = false; message(adminErrorText(error), 'error'); reflect(); });
    database.ref('.info/serverTimeOffset').on('value', snapshot => {
      const value = snapshot.val(); timeReady = Number.isFinite(value) && typeof value === 'number';
      if (timeReady) offset = value;
      reflect();
    }, () => { timeReady = false; reflect(); });
    database.ref('.info/connected').on('value', snapshot => {
      const wasConnected = connected; connected = snapshot.val() === true; reflect();
      if (connected && !wasConnected) void readCurrent();
    }, () => { connected = false; reflect(); });
    setInterval(reflect, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { reflect(); void readCurrent(); } });
  } catch (error) { persistenceReady = false; message(adminErrorText(error), 'error'); reflect(); }
}

void initialize();
