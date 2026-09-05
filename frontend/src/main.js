import { createApp } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import App from './App.vue';
// 字体本地自托管（@fontsource 切片文件），不依赖 Google Fonts——
// 外链字体表是渲染阻塞的，无代理环境会把页面白屏到超时
import '@fontsource/outfit/400.css';
import '@fontsource/outfit/500.css';
import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/noto-serif-sc/400.css';
import '@fontsource/noto-serif-sc/600.css';
import '@fontsource/noto-serif-sc/900.css';
import './style.css';

registerSW(); // 注册 Service Worker，离线缓存生效
createApp(App).mount('#app');
