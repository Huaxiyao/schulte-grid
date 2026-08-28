import { state } from './state.js';
import { setItem } from './storage.js';

let actx = null;

export function ensureAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === 'suspended') actx.resume();
}

function tone(freq, dur, type, gain, delay) {
  if (state.muted || !actx) return;
  try {
    const t = actx.currentTime + (delay || 0);
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(actx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch (e) { /* 忽略音频错误 */ }
}

export function sndTick(progress) {
  const base = 520 + progress * 480;
  tone(base, 0.07, 'triangle', 0.09);
  tone(base * 2, 0.05, 'sine', 0.04, 0.012);
}
export function sndWrong() {
  tone(160, 0.12, 'sawtooth', 0.08);
  tone(110, 0.18, 'sawtooth', 0.08, 0.08);
}
export function sndDone() {
  tone(523.25, 0.16, 'sine', 0.07);
  tone(659.25, 0.16, 'sine', 0.07, 0.11);
  tone(783.99, 0.28, 'sine', 0.07, 0.22);
}
export function sndVoid() {
  tone(220, 0.12, 'sine', 0.05);
}
export function toggleMute() {
  state.muted = !state.muted;
  setItem('schulte-muted', state.muted ? '1' : '0');
  if (!state.muted) { ensureAudio(); tone(660, 0.08, 'sine', 0.06); }
}
