<template>
  <div class="page">
    <div class="side-mark">SCHULTE&nbsp;GRID&nbsp;·&nbsp;专注力训练</div>
    <main class="app">
      <header>
        <div class="title-block">
          <h1>舒尔特方格</h1>
          <span class="seal">专<br>注</span>
        </div>
        <p class="subtitle">目随序走 · 心随数定</p>
      </header>
      <ControlsBar @restart="restart" />
      <StatsBar />
      <SchulteBoard ref="boardRef" />
      <p class="tip">首次点击即刻起针 · 依序点按 1 至 N · 按 R 重开</p>
    </main>
    <ResultDialog @again="restart" @close="state.showResult = false" />
    <AuthDialog @entered="restart" />
    <AppToast />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { state } from './state.js';
import { api } from './api.js';
import { ensureAudio } from './sound.js';
import ControlsBar from './components/ControlsBar.vue';
import StatsBar from './components/StatsBar.vue';
import SchulteBoard from './components/SchulteBoard.vue';
import ResultDialog from './components/ResultDialog.vue';
import AuthDialog from './components/AuthDialog.vue';
import AppToast from './components/AppToast.vue';

const boardRef = ref(null);

function restart() {
  state.showResult = false;
  boardRef.value && boardRef.value.restart();
}
async function checkSession() {
  const res = await api('/records');
  if (res.ok) {
    state.records = res.records || {};
    restart();
  } else {
    // 401 时 api() 已 clearSession（showAuth=true），此处兜底网络失败等场景
    state.authError = res.error || '';
    state.showAuth = true;
  }
}
function onKeydown(e) {
  if (e.repeat) return;
  if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
    e.preventDefault();
    restart();
  }
}
function onVisibility() {
  if (document.hidden && boardRef.value && state.playing && state.startTime) {
    boardRef.value.voidRound();
  }
}
const prevent = (e) => e.preventDefault();

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('wheel', prevent, { passive: false });
  window.addEventListener('touchmove', prevent, { passive: false });
  document.onselectstart = () => false;
  document.addEventListener('pointerdown', ensureAudio, { once: true });
  if (state.token && state.user) checkSession();
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('wheel', prevent);
  window.removeEventListener('touchmove', prevent);
});
</script>

<style scoped>
header{
  text-align: center;
  animation: fadeUp .8s cubic-bezier(.2,.7,.2,1) both;
}
.title-block{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
h1{
  font-size: clamp(34px, 6vw, 46px);
  font-weight: 900;
  letter-spacing: .12em;
  line-height: 1;
}
.seal{
  display: grid;
  place-items: center;
  width: 46px; height: 46px;
  background: linear-gradient(135deg, #0e8a99 0%, #17a9ba 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: .05em;
  text-align: center;
  transform: rotate(-5deg);
  border-radius: 10px;
  box-shadow:
    inset 0 0 0 1.5px rgba(255,255,255,.35),
    inset 0 0 12px rgba(255,255,255,.15),
    1px 3px 0 rgba(14,138,153,.35),
    0 6px 18px rgba(14,138,153,.28);
  user-select: none;
}
.subtitle{
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: .45em;
  text-indent: .45em;
  color: var(--ink-soft);
}
.tip{
  margin-top: 20px;
  font-size: 12px;
  letter-spacing: .25em;
  text-indent: .25em;
  color: var(--ink-faint);
  text-align: center;
  animation: fadeUp .8s .36s cubic-bezier(.2,.7,.2,1) both;
}
</style>
