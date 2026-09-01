<template>
  <div class="overlay" :class="{ show: state.showResult }">
    <div class="result-card">
      <div class="stamp" :class="{ record: result && result.isRecord }">{{ result && result.isRecord ? '新纪录' : '完成' }}</div>
      <p class="result-label">本局用时</p>
      <div class="result-time"><span>{{ result ? fmt(result.time) : '0.00' }}</span><small>秒</small></div>
      <p class="result-rating">{{ result ? result.rating : '' }}</p>
      <div class="result-rows">
        <div class="item"><label>最佳</label><span>{{ result ? fmt(result.best) : '—' }}</span></div>
        <div class="item"><label>失误</label><span>{{ result ? result.mistakes : 0 }}</span></div>
        <div class="item"><label>每格</label><span>{{ result ? result.perCell.toFixed(2) + 's' : '—' }}</span></div>
      </div>
      <div class="result-actions">
        <button class="btn-main" @click="emit('again')">再来一局</button>
        <button class="btn-ghost" @click="emit('close')">收起</button>
      </div>
      <p v-if="!state.token" class="guest-hint">游客模式 · 登录以同步记录</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../state.js';
import { fmt } from '../gameLogic.js';

const emit = defineEmits(['again', 'close']);
const result = computed(() => state.result);
</script>

<style scoped>
.overlay{
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(42,37,32,.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  opacity: 0;
  pointer-events: none;
  transition: opacity .35s ease;
}
.overlay.show{ opacity: 1; pointer-events: auto; }
.result-card{
  position: relative;
  width: min(92vw, 400px);
  background: rgba(248,252,255,.95);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
  border: 1.5px solid var(--vermilion);
  box-shadow: var(--glow), 5px 7px 0 rgba(14,138,153,.2);
  border-radius: 10px;
  padding: 44px 36px 34px;
  text-align: center;
  transform: translateY(26px) scale(.96);
  transition: transform .45s cubic-bezier(.2,.7,.2,1.2);
}
.overlay.show .result-card{ transform: translateY(0) scale(1); }
.result-card::before{
  content:"";
  position: absolute;
  inset: 7px;
  border: 1px solid var(--line);
  border-radius: 6px;
  pointer-events: none;
}
.stamp{
  position: absolute;
  top: -30px; right: 20px;
  width: 70px; height: 70px;
  display: grid; place-items: center;
  border: 2.5px solid var(--vermilion);
  border-radius: 50%;
  color: var(--vermilion);
  font-size: 18px;
  font-weight: 900;
  letter-spacing: .1em;
  text-indent: .1em;
  background: rgba(248,252,255,.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transform: rotate(10deg);
  box-shadow: 2px 4px 0 rgba(14,138,153,.25), 0 8px 20px rgba(14,138,153,.22);
  animation: stampIn .45s .25s cubic-bezier(.2,.7,.3,1.5) both;
}
.stamp.record{
  border-color: #fff;
  background: linear-gradient(135deg, #0e8a99 0%, #17a9ba 100%);
  color: #fff;
  box-shadow: 2px 4px 0 rgba(14,138,153,.35), 0 8px 24px rgba(17,167,184,.45);
}
.result-label{
  font-size: 12px;
  letter-spacing: .5em;
  text-indent: .5em;
  color: var(--ink-faint);
}
.result-time{
  font-family: var(--num-font);
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  margin-top: 6px;
}
.result-time small{
  font-family: var(--serif-cn);
  font-size: 16px;
  font-weight: 400;
  color: var(--ink-soft);
  margin-left: 4px;
}
.result-rating{
  font-size: 15px;
  letter-spacing: .4em;
  text-indent: .4em;
  color: var(--vermilion);
  margin-top: 2px;
}
.result-rows{
  margin-top: 24px;
  border-top: 1px solid var(--line);
  padding-top: 18px;
  display: flex;
  justify-content: space-around;
}
.result-rows .item label{
  display: block;
  font-size: 11px;
  letter-spacing: .3em;
  text-indent: .3em;
  color: var(--ink-faint);
  margin-bottom: 5px;
}
.result-rows .item span{
  font-family: var(--num-font);
  font-size: 20px;
  font-weight: 500;
}
.result-actions{
  margin-top: 28px;
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn-main{
  font-family: var(--serif-cn);
  font-size: 14px;
  letter-spacing: .25em;
  text-indent: .25em;
  padding: 11px 28px;
  background: var(--vermilion);
  border: 1px solid var(--vermilion);
  color: #fff;
  cursor: pointer;
  border-radius: 999px;
  transition: all .22s ease;
  box-shadow: var(--glow);
}
.btn-main:hover{
  background: var(--vermilion-deep);
  border-color: var(--vermilion-deep);
  box-shadow: 0 0 32px rgba(17,167,184,.45);
}
.btn-ghost{
  font-family: var(--serif-cn);
  font-size: 14px;
  letter-spacing: .25em;
  text-indent: .25em;
  padding: 11px 24px;
  background: rgba(248,252,255,.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid var(--line);
  color: var(--ink-soft);
  cursor: pointer;
  border-radius: 999px;
  transition: all .22s ease;
}
.btn-ghost:hover{ border-color: var(--vermilion); color: var(--vermilion); }
.guest-hint{
  margin-top: 16px;
  font-size: 11px;
  letter-spacing: .18em;
  text-indent: .18em;
  color: var(--ink-faint);
}
</style>
