<template>
  <section class="stats">
    <div class="stat timer">
      <label>用时</label>
      <div class="val"><span>{{ state.timerText }}</span><small>秒</small></div>
    </div>
    <div class="stat target">
      <label>目标</label>
      <div class="val">{{ state.nextNum }}</div>
    </div>
    <div class="stat">
      <label>最佳</label>
      <div class="val dim">{{ bestText }}</div>
    </div>
    <div class="stat">
      <label>失误</label>
      <div class="val">{{ state.mistakes }}</div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../state.js';
import { fmt } from '../gameLogic.js';

const bestText = computed(() => {
  const b = state.records[String(state.size)];
  return b !== undefined && b !== null ? fmt(b) : '—';
});
</script>

<style scoped>
.stats{
  margin-top: 26px;
  width: 100%;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  animation: fadeUp .8s .2s cubic-bezier(.2,.7,.2,1) both;
}
.stat{
  padding: 14px 6px 12px;
  text-align: center;
  position: relative;
}
.stat + .stat::before{
  content:"";
  position: absolute;
  left: 0; top: 22%;
  height: 56%;
  width: 1px;
  background: var(--line);
}
.stat label{
  display: block;
  font-size: 11px;
  letter-spacing: .35em;
  text-indent: .35em;
  color: var(--ink-faint);
  margin-bottom: 6px;
}
.stat .val{
  font-family: var(--num-font);
  font-size: 26px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.stat.timer .val{ font-size: 34px; font-weight: 700; }
.stat.timer .val small{
  font-family: var(--serif-cn);
  font-size: 12px;
  font-weight: 400;
  color: var(--ink-faint);
  margin-left: 3px;
  letter-spacing: .1em;
}
.stat .val.dim{ color: var(--ink-faint); font-weight: 400; }
.stat.target .val{
  color: var(--vermilion);
  font-weight: 700;
  animation: targetPulse 1.6s ease-in-out infinite;
}
@keyframes targetPulse{
  0%, 100%{ opacity: 1; }
  50%{ opacity: .45; }
}
</style>
