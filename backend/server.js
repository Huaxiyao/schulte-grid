import { createDb } from './db.js';
import { createApp } from './app.js';

const PORT = Number.parseInt(process.env.PORT || process.argv[2] || '3000', 10) || 3000;
const db = createDb();
const app = createApp(db);

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  舒尔特方格 · 账号存档服务已启动');
  console.log('  ───────────────────────────────');
  console.log(`  本机访问:  http://localhost:${PORT}`);
  console.log(`  局域网访问(手机/别的电脑): http://<本机IP>:${PORT}`);
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});

// Windows 上 Hyper-V/WSL 会动态保留端口段，bind 可能"成功"而 listen 阶段才异步报 EACCES，
// 且 listening 回调先于 error 事件触发——不接住的话会打出假启动横幅后无声退出
server.on('error', (err) => {
  console.error('');
  console.error(`  ✗ 端口 ${PORT} 监听失败（${err.code || err.message}）`);
  console.error('    常见原因：端口被系统/Hyper-V 保留，或已被其他程序占用。');
  console.error('    临时换端口：PORT=其他端口号 npm run dev（前端代理会自动跟随）');
  console.error('    永久解决（管理员执行后重启电脑）：');
  console.error('      netsh int ipv4 set dynamic tcp start=49152 num=16384');
  console.error('');
  process.exit(1);
});
