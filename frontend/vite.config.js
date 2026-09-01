import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '舒尔特方格',
        short_name: '舒尔特',
        description: '舒尔特方格专注力训练：多难度计时、成绩记录、排行榜',
        theme_color: '#0e8a99',
        background_color: '#f7fcff',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // 只缓存前端静态资源；/api 走网络
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5175,
    strictPort: true,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
