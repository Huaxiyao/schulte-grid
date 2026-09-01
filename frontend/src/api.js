import { state, clearSession } from './state.js';

export async function api(path, opts = {}) {
  const headers = {};
  if (state.token) headers['x-token'] = state.token;
  if (opts.json !== undefined) {
    opts.method = opts.method || 'POST';
    headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(opts.json);
  }
  let res;
  try {
    res = await fetch('/api' + path, { ...opts, headers });
  } catch {
    return { ok: false, error: '无法连接服务器，请先启动服务' };
  }
  if (res.status === 401 && state.token) clearSession();
  return res.json().catch(() => ({}));
}
