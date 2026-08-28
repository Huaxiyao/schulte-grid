<template>
  <div class="toast" :class="{ show: state.toast }" role="status">
    <p class="t-main">中途切出 · 本局作废</p>
    <p class="t-sub">按 R 或空格重新开始</p>
  </div>
</template>

<script setup>
import { state } from '../state.js';
</script>

<style scoped>
.toast{
  position: fixed;
  left: 50%; bottom: 36px;
  transform: translateX(-50%) translateY(16px);
  z-index: 20;
  background: rgba(248,252,255,.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--vermilion);
  box-shadow: var(--glow), 3px 4px 0 rgba(14,138,153,.22);
  border-radius: 10px;
  padding: 13px 26px 12px;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s ease, transform .3s ease;
}
.toast.show{ opacity: 1; transform: translateX(-50%) translateY(0); }
.toast .t-main{
  font-size: 14px;
  letter-spacing: .3em;
  text-indent: .3em;
  color: var(--vermilion-deep);
}
.toast .t-sub{
  margin-top: 5px;
  font-size: 11px;
  letter-spacing: .2em;
  text-indent: .2em;
  color: var(--ink-faint);
}
</style>
