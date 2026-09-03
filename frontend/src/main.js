import { createApp } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import App from './App.vue';
import './style.css';

registerSW(); // 注册 Service Worker，离线缓存生效
createApp(App).mount('#app');
