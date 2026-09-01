<template>
  <section class="board-wrap">
    <div ref="boardEl" class="board" role="grid" aria-label="舒尔特方格数字棋盘" :style="{ '--n': state.size }"></div>
    <div class="progress"><i :style="{ width: progressWidth }"></i></div>
  </section>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { state, saveGuestRecords } from '../state.js';
import { api } from '../api.js';
import { shuffled, fmt, ratingFor } from '../gameLogic.js';
import { ensureAudio, sndTick, sndWrong, sndDone, sndVoid } from '../sound.js';

const boardEl = ref(null);
const progressWidth = ref('0%');
let rafId = null;

function cancelTick() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
function tickLoop() {
  if (!state.playing) return;
  state.timerText = fmt((performance.now() - state.startTime) / 1000);
  rafId = requestAnimationFrame(tickLoop);
}

function newGame() {
  const total = state.size * state.size;
  state.nextNum = 1;
  state.mistakes = 0;
  state.startTime = null;
  state.playing = true;
  state.showResult = false;
  state.toast = false;
  state.result = null;
  cancelTick();
  state.timerText = '0.00';
  progressWidth.value = '0%';

  const nums = shuffled(total);
  boardEl.value.innerHTML = '';
  const frag = document.createDocumentFragment();
  nums.forEach((num, i) => {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.textContent = num;
    cell.setAttribute('aria-label', '数字 ' + num);
    cell.style.setProperty('--i', i);
    cell.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      onCell(num, cell);
    });
    frag.appendChild(cell);
  });
  boardEl.value.appendChild(frag);
}

function onCell(num, cell) {
  if (!state.playing) return;
  if (!state.startTime) { ensureAudio(); state.startTime = performance.now(); tickLoop(); }
  if (cell.classList.contains('done')) return;
  const total = state.size * state.size;
  if (num === state.nextNum) {
    cell.classList.add('done');
    sndTick(state.nextNum / total);
    state.nextNum++;
    progressWidth.value = ((state.nextNum - 1) / total * 100) + '%';
    if (state.nextNum > total) {
      cell.classList.add('final-glow');
      finish();
    }
  } else {
    state.mistakes++;
    cell.classList.remove('wrong');
    void cell.offsetWidth;
    cell.classList.add('wrong');
    sndWrong();
    setTimeout(() => cell.classList.remove('wrong'), 120);
  }
}

function finish() {
  state.playing = false;
  cancelTick();
  const t = (performance.now() - state.startTime) / 1000;
  state.timerText = fmt(t);
  const total = state.size * state.size;
  const best = state.records[String(state.size)] ?? null;
  const isRecord = best === null || t < best;
  if (isRecord) {
    state.records[String(state.size)] = t;
    if (state.token) {
      api('/record', { json: { size: state.size, time: Math.round(t * 100) / 100 } })
        .then((res) => { if (res.ok) state.records[String(state.size)] = res.best; });
    } else {
      saveGuestRecords(state.records); // 游客成绩存本机，刷新不丢
    }
  }
  const secPerCell = t / total;
  state.result = {
    time: t,
    best: isRecord ? t : best,
    mistakes: state.mistakes,
    perCell: secPerCell,
    isRecord,
    rating: ratingFor(secPerCell),
  };
  setTimeout(() => { state.showResult = true; sndDone(); }, 480);
}

function voidRound() {
  state.playing = false;
  cancelTick();
  state.toast = true;
  sndVoid();
}

defineExpose({ restart: newGame, voidRound });
watch(() => state.size, () => newGame());
onUnmounted(cancelTick);
</script>

<style scoped>
.board-wrap{
  margin-top: 30px;
  width: min(88vw, 500px, max(280px, calc(100dvh - 400px)));
  animation: fadeUp .8s .28s cubic-bezier(.2,.7,.2,1) both;
}
.board{
  display: grid;
  grid-template-columns: repeat(var(--n, 5), 1fr);
  gap: 1px;
  background: var(--line);
  border: 1.5px solid var(--vermilion);
  box-shadow: var(--glow), 3px 4px 0 rgba(14,138,153,.18);
  backdrop-filter: blur(10px) saturate(1.05);
  -webkit-backdrop-filter: blur(10px) saturate(1.05);
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
}
.progress{
  margin-top: 14px;
  height: 3px;
  background: rgba(23, 42, 68, .12);
  border-radius: 4px;
  overflow: hidden;
}
.progress i{
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(to right, #7fd3e0 0%, var(--vermilion) 100%);
  box-shadow: 0 0 8px rgba(17,167,184,.35);
  transition: width .3s cubic-bezier(.2,.7,.2,1);
}
</style>

<!-- 格子由 document.createElement 动态创建，无 scoped 属性，样式须全局生效 -->
<style>
.cell{
  position: relative;
  display: grid;
  place-items: center;
  background: rgba(248,252,255,.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-family: var(--num-font);
  font-size: calc(min(88vw, 500px) / var(--n, 5) * .38);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: var(--ink);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
  animation: cellIn .5s cubic-bezier(.2,.7,.3,1.2) both;
  animation-delay: calc(var(--i, 0) * 16ms);
  transition: background .15s ease, transform .03s ease, color .18s ease, box-shadow .15s ease;
}
.cell:hover{ background: rgba(220,235,255,.7); }
.cell:active{ transform: scale(.94); }
.cell:focus-visible{ outline: 2px solid var(--vermilion); outline-offset: -3px; }
@keyframes cellIn{
  from{ opacity: 0; transform: scale(.5); }
  to{ opacity: 1; transform: scale(1); }
}
.cell.done{
  color: rgba(23, 42, 68, .18);
  cursor: default;
  background: rgba(232,242,255,.5);
  animation: donePop .26s cubic-bezier(.2,.6,.35,1);
}
@keyframes donePop{
  0%{ transform: scale(1); }
  30%{ transform: scale(1.10); }
  100%{ transform: scale(1); }
}
.cell.done::after{
  content:"";
  position: absolute;
  inset: 10%;
  border: 2.5px solid rgba(14,138,153,.78);
  border-radius: 50%;
  animation: stampIn .2s cubic-bezier(.2,.7,.3,1.4) both;
}
@keyframes stampIn{
  from{ opacity: 0; transform: scale(1.8) rotate(-12deg); }
  to{ opacity: 1; transform: scale(1) rotate(-6deg); }
}
.cell.final-glow{ animation: finalGlow .6s ease both; }
@keyframes finalGlow{
  0%{ box-shadow: inset 0 0 0 0 rgba(14,138,153,0); transform: scale(1); }
  30%{ box-shadow: inset 0 0 0 100vmax rgba(14,138,153,.22); transform: scale(1.12); }
  60%{ transform: scale(.98); }
  100%{ box-shadow: inset 0 0 0 0 rgba(14,138,153,0); transform: scale(1); }
}
.cell.wrong{
  animation: wrongShake .12s ease;
  background: rgba(214,69,65,.20) !important;
  color: #b8362f !important;
  box-shadow: inset 0 0 0 2px rgba(214,69,65,.55);
}
@keyframes wrongShake{
  0%, 100%{ transform: translateX(0); }
  12%{ transform: translateX(-7px); }
  28%{ transform: translateX(7px); }
  45%{ transform: translateX(-5px); }
  62%{ transform: translateX(4px); }
  80%{ transform: translateX(-2px); }
}
</style>
