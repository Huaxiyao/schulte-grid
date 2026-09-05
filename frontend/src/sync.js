import { state, loadGuestRecords, removeGuestRecord } from './state.js';
import { api } from './api.js';

// 登录或会话恢复后，把本地游客期间更优的成绩同步到服务器。
// 与服务器记录对比（而非合并后的 state.records），服务器缺失的难度也会补齐。
export async function syncGuestRecords(serverRecords) {
  const guest = loadGuestRecords();
  if (!state.token || !serverRecords || Object.keys(guest).length === 0) return;
  for (const [size, time] of Object.entries(guest)) {
    const cur = serverRecords[size];
    if (cur === undefined || time < cur) {
      const res = await api('/record', { json: { size: Number(size), time } });
      if (res.ok) {
        state.records[size] = res.best;
        removeGuestRecord(size); // 已入云端，本地兜底条目不再需要
      }
    }
  }
}
