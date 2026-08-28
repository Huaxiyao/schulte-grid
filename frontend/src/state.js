import { reactive } from 'vue';
import { getItem, setItem, removeItem } from './storage.js';

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
  token: getItem('schulte-token'),
  user: getItem('schulte-user'),
  records: {},
  showAuth: !getItem('schulte-token'),
});

export function saveAccount(token, username, records) {
  state.token = token;
  state.user = username;
  state.records = records || {};
  state.showAuth = false;
  state.authError = '';
  setItem('schulte-token', token);
  setItem('schulte-user', username);
}

export function clearSession() {
  state.token = null;
  state.user = null;
  state.records = {};
  state.showAuth = true;
  state.authError = '';
  removeItem('schulte-token');
  removeItem('schulte-user');
}
