<template>
  <section class="controls">
    <div class="sizes">
      <button
        v-for="n in [3, 4, 5, 6]"
        :key="n"
        class="size-btn"
        :class="{ active: state.size === n }"
        @click="state.size = n"
      >{{ n }}×{{ n }}</button>
    </div>
    <div class="actions">
      <span class="who">{{ state.user || '' }}</span>
      <button v-if="state.user" class="btn-ghost-mini" @click="logout">退出</button>
      <button class="btn-ghost-mini" @click="state.showLeaderboard = true">榜单</button>
      <button class="btn-ink" @click="emit('restart')">重新开始</button>
      <button class="btn-icon" :aria-label="state.muted ? '开启音效' : '关闭音效'" @click="toggleMute">
        <svg v-if="!state.muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>
      </button>
    </div>
  </section>
</template>

<script setup>
import { state, clearSession } from '../state.js';
import { api } from '../api.js';
import { toggleMute } from '../sound.js';

const emit = defineEmits(['restart']);

function logout() {
  api('/logout', { json: {} });
  clearSession();
  state.showAuth = false; // 主动退出保持游客游玩，不弹登录框（弹框仅用于令牌失效）
}
</script>

<style scoped>
.controls{
  margin-top: 30px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  animation: fadeUp .8s .12s cubic-bezier(.2,.7,.2,1) both;
}
.sizes{ display: flex; gap: 6px; }
.size-btn{
  font-family: var(--num-font);
  font-size: 14px;
  font-weight: 500;
  padding: 6px 11px;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all .22s ease;
}
.size-btn:hover{ border-color: var(--vermilion); color: var(--vermilion); }
.size-btn.active{
  background: var(--vermilion);
  border-color: var(--vermilion);
  color: #fff;
  box-shadow: var(--glow);
}
.actions{ display: flex; gap: 6px; align-items: center; }
.btn-ink{
  font-family: var(--serif-cn);
  font-size: 13px;
  letter-spacing: .12em;
  text-indent: .12em;
  padding: 8px 14px;
  background: rgba(248,252,255,.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--ink);
  border-radius: 999px;
  color: var(--ink);
  cursor: pointer;
  transition: all .22s ease;
}
.btn-ink:hover{
  background: var(--vermilion);
  border-color: var(--vermilion);
  color: #fff;
  box-shadow: var(--glow);
}
.btn-icon{
  width: 40px; height: 40px;
  display: grid; place-items: center;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all .22s ease;
}
.btn-icon:hover{ border-color: var(--ink); color: var(--ink); }
.btn-icon svg{ width: 18px; height: 18px; }
.who{
  font-size: 12px;
  letter-spacing: .15em;
  color: var(--ink-soft);
  align-self: center;
  max-width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.who::before{ content: "· "; color: var(--vermilion); }
.btn-ghost-mini{
  font-family: var(--serif-cn);
  font-size: 12px;
  letter-spacing: .15em;
  text-indent: .15em;
  padding: 6px 11px;
  background: rgba(248,252,255,.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all .22s ease;
}
.btn-ghost-mini:hover{ border-color: var(--vermilion); color: var(--vermilion); }
</style>
