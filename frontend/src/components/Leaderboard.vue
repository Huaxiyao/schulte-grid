<template>
  <div class="lb-overlay" :class="{ show: state.showLeaderboard }" @click.self="close">
    <div class="lb-card">
      <div class="lb-head">
        <h3>排行榜</h3>
        <button class="lb-close" aria-label="关闭排行榜" @click="close">×</button>
      </div>
      <div class="lb-tabs">
        <button
          v-for="n in [3, 4, 5, 6]"
          :key="n"
          :class="{ active: tab === n }"
          @click="switchTab(n)"
        >{{ n }}×{{ n }}</button>
      </div>
      <div class="lb-list">
        <div v-if="loading" class="lb-empty">载入中…</div>
        <div v-else-if="rows.length === 0" class="lb-empty">虚位以待<br><small>抢先完成一局即可上榜</small></div>
        <div
          v-for="(row, i) in rows"
          v-else
          :key="row.username"
          class="lb-row"
          :class="{ me: row.username === state.user }"
        >
          <span class="lb-rank" :class="'top' + (i + 1)">{{ i + 1 }}</span>
          <span class="lb-name">{{ row.username }}</span>
          <span class="lb-time">{{ fmt(row.best_time) }}<small>秒</small></span>
        </div>
      </div>
      <p class="lb-hint">各难度最快十人 · 越快越靠前</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { state } from '../state.js';
import { api } from '../api.js';
import { fmt } from '../gameLogic.js';

const tab = ref(state.size);
const rows = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  const res = await api('/leaderboard?size=' + tab.value);
  loading.value = false;
  if (res.ok) rows.value = res.list || [];
}
function switchTab(n) {
  tab.value = n;
  load();
}
function close() {
  state.showLeaderboard = false;
}
watch(() => state.showLeaderboard, (v) => {
  if (v) {
    tab.value = state.size;
    load();
  }
});
</script>

<style scoped>
.lb-overlay{
  position: fixed;
  inset: 0;
  z-index: 30;
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
.lb-overlay.show{ opacity: 1; pointer-events: auto; }
.lb-card{
  width: min(92vw, 420px);
  max-height: 84vh;
  display: flex;
  flex-direction: column;
  background: rgba(248,252,255,.95);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
  border: 1.5px solid var(--vermilion);
  box-shadow: var(--glow), 5px 7px 0 rgba(14,138,153,.2);
  border-radius: 10px;
  padding: 26px 26px 18px;
  transform: translateY(26px) scale(.96);
  transition: transform .45s cubic-bezier(.2,.7,.2,1.2);
}
.lb-overlay.show .lb-card{ transform: translateY(0) scale(1); }
.lb-head{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lb-head h3{
  font-size: 22px;
  font-weight: 900;
  letter-spacing: .3em;
  text-indent: .3em;
  color: var(--ink);
}
.lb-close{
  width: 32px; height: 32px;
  display: grid; place-items: center;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
  font-size: 18px;
  cursor: pointer;
  transition: all .2s ease;
}
.lb-close:hover{ border-color: var(--vermilion); color: var(--vermilion); }
.lb-tabs{
  margin-top: 18px;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.lb-tabs button{
  font-family: var(--num-font);
  font-size: 14px;
  font-weight: 500;
  padding: 5px 14px;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all .2s ease;
}
.lb-tabs button:hover{ border-color: var(--vermilion); color: var(--vermilion); }
.lb-tabs button.active{
  background: var(--vermilion);
  border-color: var(--vermilion);
  color: #fff;
  box-shadow: var(--glow);
}
.lb-list{
  margin-top: 16px;
  overflow-y: auto;
  min-height: 200px;
}
.lb-empty{
  height: 200px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  font-size: 14px;
  letter-spacing: .3em;
  text-indent: .3em;
  color: var(--ink-faint);
  text-align: center;
}
.lb-empty small{ font-size: 11px; letter-spacing: .15em; text-indent: .15em; }
.lb-row{
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  transition: background .15s ease;
}
.lb-row + .lb-row{ border-top: 1px dashed rgba(14,138,153,.18); }
.lb-row.me{ background: rgba(14,138,153,.10); }
.lb-rank{
  width: 28px; height: 28px;
  display: grid; place-items: center;
  font-family: var(--num-font);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-faint);
  border: 1px solid var(--line);
  border-radius: 50%;
  flex: none;
}
.lb-rank.top1{ color: #8a6d00; border-color: #d9a800; background: rgba(255,199,44,.22); }
.lb-rank.top2{ color: #5a6672; border-color: #9aa7b3; background: rgba(176,190,201,.25); }
.lb-rank.top3{ color: #7c4a1e; border-color: #c0803f; background: rgba(205,127,50,.20); }
.lb-name{
  flex: 1;
  font-size: 14px;
  letter-spacing: .08em;
  color: var(--ink);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lb-row.me .lb-name{ color: var(--vermilion); font-weight: 600; }
.lb-time{
  font-family: var(--num-font);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}
.lb-time small{
  font-family: var(--serif-cn);
  font-size: 11px;
  font-weight: 400;
  color: var(--ink-faint);
  margin-left: 2px;
}
.lb-hint{
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(14,138,153,.25);
  font-size: 11px;
  letter-spacing: .2em;
  text-indent: .2em;
  color: var(--ink-faint);
  text-align: center;
}
</style>
