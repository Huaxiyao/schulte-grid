const mem = {};

export function getItem(key) {
  try { return localStorage.getItem(key); } catch { return mem[key] ?? null; }
}
export function setItem(key, value) {
  try { localStorage.setItem(key, value); } catch { mem[key] = value; }
}
export function removeItem(key) {
  try { localStorage.removeItem(key); } catch { delete mem[key]; }
}
