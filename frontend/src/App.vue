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
      <Transition name="tipswap" mode="out-in">
        <p v-if="state.toast" key="void" class="tip tip-void">中途切出 · 本局作废 · 按 R 或空格重开</p>
        <p v-else key="hint" class="tip">首次点击即刻起针 · 依序点按 1 至 N · 按 R 重开</p>
      </Transition>
    </main>
    <ResultDialog @again="restart" @close="state.showResult = false" />
    <AuthDialog @entered="restart" />
    <Leaderboard />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { state, mergeRecords, loadGuestRecords } from './state.js';
import { api } from './api.js';
import { syncGuestRecords } from './sync.js';
import { ensureAudio } from './sound.js';
import ControlsBar from './components/ControlsBar.vue';
import StatsBar from './components/StatsBar.vue';
import SchulteBoard from './components/SchulteBoard.vue';
import ResultDialog from './components/ResultDialog.vue';
import AuthDialog from './components/AuthDialog.vue';
import Leaderboard from './components/Leaderboard.vue';

const boardRef = ref(null);

function restart() {
  state.showResult = false;
  boardRef.value && boardRef.value.restart();
}
async function checkSession() {
  const res = await api('/records');
  if (res.ok) {
    state.records = mergeRecords(loadGuestRecords(), res.records);
    await syncGuestRecords(res.records);
    restart();
  }
}
function onKeydown(e) {
  if (e.repeat) return;
  const el = e.target;
  // 输入框内打字不触发快捷键（登录表单的用户名/密码不能被 r/空格 吞掉）
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
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
onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('visibilitychange', onVisibility);
  document.onselectstart = () => false;
  document.addEventListener('pointerdown', ensureAudio, { once: true });
  if (state.token && state.user) checkSession();
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('visibilitychange', onVisibility);
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
.tip-void{
  color: var(--vermilion-deep);
  font-weight: 600;
}
.tipswap-enter-active,
.tipswap-leave-active{
  transition: opacity .22s ease, transform .22s ease;
}
.tipswap-enter-from{ opacity: 0; transform: translateY(6px); }
.tipswap-leave-to{ opacity: 0; transform: translateY(-6px); }
</style>
