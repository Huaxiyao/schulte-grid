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
  const data = await res.json().catch(() => null);
  // 非 JSON 响应（典型：后端没启动，Vite 代理回 500 错误页）要给出可定位的提示，
  // 不能落成空对象让弹框显示误导性的「操作失败，请重试」
  return data || { ok: false, error: '服务响应异常，请确认后端已启动' };
}
