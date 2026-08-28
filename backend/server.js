import { createDb } from './db.js';
import { createApp } from './app.js';

const PORT = parseInt(process.env.PORT || process.argv[2] || '3000', 10);
const db = createDb();
const app = createApp(db);

app.listen(PORT, () => {
  console.log('');
  console.log('  舒尔特方格 · 账号存档服务已启动');
  console.log('  ───────────────────────────────');
  console.log(`  本机访问:  http://localhost:${PORT}`);
  console.log(`  局域网访问(手机/别的电脑): http://<本机IP>:${PORT}`);
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});
