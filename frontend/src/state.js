import { reactive } from 'vue';
import { getItem, setItem, removeItem } from './storage.js';

const GUEST_KEY = 'schulte-guest-records';
const SIZES = ['3', '4', '5', '6'];

export function loadGuestRecords() {
  try {
    const raw = JSON.parse(getItem(GUEST_KEY) || '{}');
    const out = {};
    for (const k of SIZES) {
      const v = parseFloat(raw[k]);
      if (v > 0 && v < 3600) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveGuestRecords(records) {
  setItem(GUEST_KEY, JSON.stringify(records));
}

function mergeRecords(guest, server) {
  const merged = {};
  for (const k of new Set([...Object.keys(guest || {}), ...Object.keys(server || {})])) {
    const g = guest?.[k];
    const s = server?.[k];
    merged[k] = g === undefined ? s : (s === undefined ? g : Math.min(g, s));
  }
  return merged;
}

const token = getItem('schulte-token');

export const state = reactive({
  size: 5,
  nextNum: 1,
  mistakes: 0,
  startTime: null,
  playing: false,
  timerText: '0.00',
  toast: false,
  showResult: false,
  showLeaderboard: false,
  result: null,
  authError: '',
  muted: getItem('schulte-muted') === '1',
  token,
  user: getItem('schulte-user'),
  records: token ? {} : loadGuestRecords(),
  showAuth: false,
});

export function saveAccount(token, username, records) {
  state.token = token;
  state.user = username;
  // 登录后云端记录与本地游客记录合并，各难度取最优
  state.records = mergeRecords(loadGuestRecords(), records);
  state.showAuth = false;
  state.authError = '';
  setItem('schulte-token', token);
  setItem('schulte-user', username);
}

export function clearSession() {
  state.token = null;
  state.user = null;
  state.records = loadGuestRecords();
  state.showAuth = true;
  state.authError = '';
  removeItem('schulte-token');
  removeItem('schulte-user');
}
