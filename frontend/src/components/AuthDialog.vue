<template>
  <div class="auth-overlay" :class="{ show: state.showAuth }">
    <div class="auth-card">
      <h2>舒尔特方格</h2>
      <p class="auth-desc">登入练功 · 记录随账号存档</p>
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="setMode('login')">登录</button>
        <button :class="{ active: mode === 'register' }" @click="setMode('register')">注册</button>
      </div>
      <input class="auth-input" v-model="username" placeholder="用户名" maxlength="16" autocomplete="username">
      <div class="pass-wrap">
        <input class="auth-input" v-model="password" :type="showPass ? 'text' : 'password'"
               :placeholder="mode === 'login' ? '密码' : '密码（至少 4 位）'"
               maxlength="64" autocomplete="current-password" @keydown.enter="submit">
        <button class="pass-eye" :aria-label="showPass ? '隐藏密码' : '显示密码'" @click="showPass = !showPass">
          <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      </div>
      <p class="auth-error" :class="{ shake: shake }">{{ state.authError }}</p>
      <button class="auth-submit" :disabled="busy" @click="submit">{{ mode === 'login' ? '登　录' : '注　册' }}</button>
      <p class="auth-hint">数据保存在本机 schulte.db</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, saveAccount } from '../state.js';
import { api } from '../api.js';

const emit = defineEmits(['entered']);

const mode = ref('login');
const username = ref('');
const password = ref('');
const showPass = ref(false);
const shake = ref(false);
const busy = ref(false);

function setMode(m) {
  mode.value = m;
  state.authError = '';
}
function fail(msg) {
  state.authError = msg;
  shake.value = true;
  setTimeout(() => { shake.value = false; }, 320);
}
async function submit() {
  const name = username.value.replace(/^\s+|\s+$/g, '');
  if (name.length < 2) return fail('用户名至少 2 位');
  if (password.value.length < 4) return fail('密码至少 4 位');
  busy.value = true;
  state.authError = '';
  const res = await api(mode.value === 'login' ? '/login' : '/register', { json: { username: name, password: password.value } });
  busy.value = false;
  if (res.ok) {
    saveAccount(res.token, res.username, {});
    const rec = await api('/records');
    if (rec.ok) state.records = rec.records || {};
    username.value = '';
    password.value = '';
    setMode('login');
    emit('entered');
  } else {
    fail(res.error || '操作失败，请重试');
  }
}
</script>

<style scoped>
.auth-overlay{
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    radial-gradient(620px 420px at 50% 32%, rgba(23,169,186,.22) 0%, transparent 62%),
    radial-gradient(480px 320px at 78% 86%, rgba(246,181,197,.12) 0%, transparent 60%),
    rgba(15, 35, 50, 0.26);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  opacity: 0;
  pointer-events: none;
  transition: opacity .35s ease;
}
.auth-overlay.show{ opacity: 1; pointer-events: auto; }
.auth-card{
  position: relative;
  width: min(92vw, 380px);
  background: rgba(247, 252, 255, 0.92);
  backdrop-filter: blur(18px) saturate(1.15);
  -webkit-backdrop-filter: blur(18px) saturate(1.15);
  border: 1px solid rgba(14,138,153,.55);
  border-radius: 18px;
  box-shadow:
    var(--glow),
    0 2px 6px rgba(14,138,153,.10),
    0 20px 50px -12px rgba(10, 60, 90, 0.45);
  padding: 40px 34px 28px;
  text-align: center;
  transform: translateY(24px) scale(.96);
  transition: transform .45s cubic-bezier(.2,.7,.2,1.2);
  overflow: hidden;
}
.auth-overlay.show .auth-card{ transform: translateY(0) scale(1); }
.auth-card::before{
  content:"";
  position: absolute;
  top: 0; left: 12%;
  width: 76%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.95), transparent);
}
.auth-card::after{
  content:"";
  position: absolute;
  left: 12px; top: 12px;
  width: 22px; height: 22px;
  border-left: 1.5px solid rgba(14,138,153,.5);
  border-top: 1.5px solid rgba(14,138,153,.5);
  border-top-left-radius: 8px;
}
.auth-card h2{
  font-size: 30px;
  font-weight: 900;
  letter-spacing: .18em;
  text-indent: .18em;
}
.auth-desc{
  margin-top: 10px;
  font-size: 12px;
  letter-spacing: .22em;
  text-indent: .22em;
  color: var(--ink-faint);
}
.auth-tabs{
  position: relative;
  margin-top: 26px;
  display: flex;
  padding: 4px;
  background: rgba(222, 236, 244, 0.8);
  border-radius: 999px;
}
.auth-tabs button{
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 10px 0;
  font-family: var(--serif-cn);
  font-size: 14px;
  letter-spacing: .3em;
  text-indent: .3em;
  background: transparent;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  transition: color .25s ease;
}
.auth-tabs button.active{ color: #fff; }
.auth-tabs button.active::before{
  content:"";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(135deg, #0e8a99 0%, #17a9ba 100%);
  border-radius: 999px;
  box-shadow: 0 4px 12px rgba(14,138,153,.4);
}
.auth-input{
  display: block;
  width: 100%;
  margin-top: 16px;
  padding: 13px 16px;
  font-family: var(--serif-cn);
  font-size: 15px;
  color: var(--ink);
  background: rgba(240, 248, 252, 0.75);
  border: 1px solid var(--line);
  border-radius: 12px;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.auth-input:hover{ background: rgba(240, 248, 252, 0.95); }
.auth-input:focus{
  background: #fff;
  border-color: var(--vermilion);
  box-shadow: 0 0 0 3px rgba(14,138,153,.16);
}
.auth-input::placeholder{ color: var(--ink-faint); letter-spacing: .05em; }
.pass-wrap{ position: relative; }
.pass-wrap .auth-input{ padding-right: 48px; }
.pass-eye{
  position: absolute;
  right: 6px; top: 50%;
  transform: translateY(-50%);
  width: 36px; height: 36px;
  display: grid; place-items: center;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--ink-faint);
  cursor: pointer;
  transition: color .2s ease, background .2s ease;
}
.pass-eye:hover{ color: var(--vermilion); background: rgba(14,138,153,.08); }
.pass-eye svg{ width: 19px; height: 19px; }
.auth-error{
  min-height: 22px;
  margin-top: 10px;
  font-size: 12px;
  letter-spacing: .05em;
  color: #d64541;
}
.auth-error.shake{ animation: authShake .32s ease; }
@keyframes authShake{
  0%, 100%{ transform: translateX(0); }
  25%{ transform: translateX(-6px); }
  50%{ transform: translateX(5px); }
  75%{ transform: translateX(-3px); }
}
.auth-submit{
  width: 100%;
  margin-top: 8px;
  padding: 13px 0;
  font-family: var(--serif-cn);
  font-size: 15px;
  letter-spacing: .5em;
  text-indent: .5em;
  background: linear-gradient(135deg, #0e8a99 0%, #17a9ba 100%);
  border: none;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(14,138,153,.35), inset 0 1px 0 rgba(255,255,255,.25);
  transition: transform .12s ease, box-shadow .25s ease, filter .2s ease;
}
.auth-submit:hover{
  filter: brightness(1.08);
  box-shadow: 0 10px 28px rgba(17,167,184,.5), inset 0 1px 0 rgba(255,255,255,.25);
}
.auth-submit:active{ transform: scale(.97); }
.auth-submit:disabled{ opacity: .6; cursor: default; filter: none; }
.auth-hint{
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed rgba(14,138,153,.25);
  font-size: 11px;
  line-height: 1.7;
  letter-spacing: .12em;
  color: var(--ink-faint);
}
</style>
