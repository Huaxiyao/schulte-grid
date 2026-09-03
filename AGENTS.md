# AGENTS.md — 舒尔特方格项目知识

## 项目概述

注意力训练小游戏（舒尔特方格）：按 1→N² 顺序点击数字方格，计时越快越好。支持游客模式、账号注册/登录、成绩云端存档、局域网排行榜，是可安装的 PWA。

- 前端：Vue 3（Composition API + `<script setup>`）+ Vite + vite-plugin-pwa
- 后端：Express 5 + Node 内置 `node:sqlite`（**要求 Node 22.5+**），纯 ESM（`"type": "module"`），无框架、无 ORM
- 明确不引入（见 specs YAGNI 章节）：TypeScript、Pinia、UI 组件库、CORS、公网部署

## 仓库结构

npm workspaces 单仓多包，依赖提升到根 `node_modules`：

```
├─ package.json          # workspaces + 根脚本（dev/build/start/test）
├─ frontend/             # Vue 3 + Vite（独立 npm 包）
│  ├─ vite.config.js     # PWA manifest/SW 配置；dev 端口 5175，代理 /api → 3000
│  ├─ public/            # 背景插画（bg-misty-lake.jpg，Pexels 自由授权素材，style.css 引用）、PWA 图标
│  └─ src/
│     ├─ App.vue         # 布局根：组装组件、全局键盘/visibilitychange 监听、会话恢复
│     ├─ state.js        # reactive 全局状态单例 + 游客记录持久化/合并
│     ├─ api.js          # fetch 封装：注入 x-token、错误归一、401 清会话
│     ├─ sync.js         # 登录后把本地更优的游客成绩上传到服务器
│     ├─ gameLogic.js    # shuffled（费雪-耶茨洗牌）、ratingFor 评分、fmt
│     ├─ sound.js        # Web Audio 振荡器音效（无需音频文件）
│     ├─ storage.js      # localStorage 包装，异常时退回内存对象
│     ├─ style.css       # 全局 CSS 变量、背景、keyframes
│     └─ components/     # ControlsBar / StatsBar / SchulteBoard / ResultDialog / AuthDialog / Leaderboard / AppToast
├─ backend/              # Express（独立 npm 包）
│  ├─ server.js          # 入口：createDb + createApp + listen
│  ├─ app.js             # 装配路由、静态托管 frontend/dist、404/错误中间件
│  ├─ db.js              # 建表（PRAGMA WAL）+ 旧库 expires_at 列迁移
│  ├─ auth.js            # scrypt 哈希、会话令牌、requireAuth 中间件
│  ├─ routes/            # authRoutes.js / recordRoutes.js（含排行榜）
│  └─ test/              # node:test + supertest，helpers.js 用 :memory: 库
├─ docs/superpowers/
│  ├─ specs/             # 设计文档（有约束力）
│  └─ plans/             # 实施计划，属历史记录，不修改
└─ schulte.db            # SQLite 数据（根目录，运行时生成，已 gitignore）
```

## 常用命令（在仓库根目录）

| 命令 | 作用 |
|---|---|
| `npm install` | 安装全部 workspace 依赖 |
| `npm run dev` | concurrently 同起 Vite(5175) + Express(3000，`node --watch`)，访问 http://localhost:5175 |
| `npm run build` | 构建前端到 `frontend/dist` |
| `npm start` | 生产：Express 托管 dist + API 同源，访问 :3000（先 build） |
| `npm test` | 先后端 `node --test` 再前端 `vitest run` |
| `npm run test --workspace backend` / `--workspace frontend` | 单独跑一端测试 |

注意：README 开发一节写的 Vite 端口 5173 已过时，实际固定 5175（strictPort），原因是本机 pm2 占用 5173/5174。

## Git 与远程

- 远程仓库：https://github.com/Huaxiyao/schulte-grid（公开），本地已配 `origin`，默认分支 `main`；更新线上代码只需 `git push`
- 大陆网络需代理：本机已配 `git config --global http.proxy http://127.0.0.1:7897`（Clash Verge）；gh CLI 走同端口（临时会话需 `export HTTPS_PROXY=http://127.0.0.1:7897`）
- GitHub 凭据走 gh CLI（`gh auth login`，Windows keyring），`gh auth setup-git` 已让 git 复用
- CI：`.github/workflows/test.yml`，push/PR 自动跑 `npm test`（Node 22/24 矩阵），改动后端/前端逻辑后留意远端运行结果
- 旧版单文件 HTML（schulte-grid.html 等）已从线上移除，存档于本地 tag `archive/legacy-single-html`，需要可推回

## 后端关键约定

### API 契约（前端依赖，勿随意改动）

- 响应统一 `{ ok: true, ...数据 }` / `{ ok: false, error: '中文提示' }`
- `POST /api/register` `{username,password}` → `{ok,token,username}`；用户名 2-16 位中文/字母/数字/下划线，密码 4-64 位；重名 409
- `POST /api/login`、`POST /api/logout`（logout 在鉴权中间件之前挂载，游客可调）
- `GET /api/records`（需鉴权）→ `{ok,records:{'5':秒}}`
- `POST /api/record` `{size,time}` → `{ok,best,isNewRecord}`（需鉴权）
- `GET /api/leaderboard?size=N`（**公开**，游客可看 Top10，按 best_time 升序）
- 鉴权靠请求头 `x-token`；无/坏/过期令牌 → 401「登录已失效，请重新登录」

### 路由挂载顺序（app.js，顺序即语义）

auth 路由 → leaderboard 路由 → `auth.requireAuth` → record 路由。新增公开接口必须挂在 requireAuth 之前。

### 安全与反作弊

- 密码：`crypto.scryptSync` + 随机 salt；校验用 `timingSafeEqual`
- 会话：48 hex 随机令牌，30 天过期；剩余 <15 天时访问自动滑动续期；过期会话仅在登录/注册时低频清理，**认证路径保持只读**（有测试锁定此行为，勿在 userOfToken 里加 DELETE）
- 成绩校验：size 限 [3,4,5,6]，time ∈ (0, 3600)，且有各难度人类极限下限 `MIN_TIME = {3:0.5, 4:0.8, 5:1.2, 6:1.8}` 秒
- 限速：内存 Map，每用户 10 次提交/分钟（超出 429；被拒请求不计入窗口）；进程重启即清空
- 请求体上限 100kb；错误中间件对 5xx 隐藏细节，统一 JSON，express 5 用 `app.use((req,res)=>...)` 做 catch-all 404

### 数据模型（db.js）

- `users(id, username UNIQUE, salt, hash, created_at)`
- `records(username, size, best_time, updated_at)`，主键 `(username,size)`，每人每难度只存最佳，upsert 时只在更快才写
- `sessions(token PK, username, created_at, expires_at)`；外键 ON DELETE CASCADE
- `createDb(file)` 支持 `SCHULTE_DB` 环境变量/参数覆盖路径（测试传 `:memory:`）

## 前端关键约定

### 状态与存储

- `state.js` 导出 reactive 单例 `state`（不引入 Pinia）：游戏状态 + token/user/records + 各弹层开关
- localStorage 键：`schulte-token`、`schulte-user`、`schulte-muted`、`schulte-guest-records`（经 `storage.js` 安全包装）
- 有 token 启动时 `records` 初始为空，由 App.vue `checkSession()` 从服务器拉取；游客模式 records 直接取本地

### 游客 ↔ 云同步闭环

1. 游客完赛 → 记录写本地 `schulte-guest-records`（load 时过滤非法值/范围）
2. 登录/会话恢复 → `mergeRecords(本地, 服务器)` 各难度取最小值
3. `syncGuestRecords(serverRecords)` → 仅当本地严格优于服务器（或服务器缺该难度）才逐个 POST /record；采纳服务器回包 `best`；必须传服务器原始记录做对比而非合并后的 state.records（有测试覆盖）

### 游戏实现（SchulteBoard.vue）

- **格子用原生 DOM 创建**（`document.createElement` + pointerdown 监听），不是 v-for；因此格子样式 `.cell` 必须放在**非 scoped** 的 `<style>` 块里（曾有 scoped 导致样式失效的 bug，见 commit 4f7dea8）
- 首次正确点击才起表；计时用 `performance.now()` + rAF 循环更新 `state.timerText`
- 只响应鼠标左键 / 触摸 pointerdown；错点抖动+计失误；页面 hidden 时 `voidRound()` 作废本局（App.vue 统一监听 visibilitychange）
- 完赛上报前 `Math.round(t*100)/100` 保留两位
- 通过 `defineExpose({ restart, voidRound })` 供 App.vue ref 调用；`watch(state.size)` 自动开新局

### 其他

- `api.js`：网络异常归一为 `{ok:false,error:'无法连接服务器…'}`；带 token 时收到 401 → `clearSession()`（游客 401 不弹登录框）
- 音效零素材：Web Audio 振荡器合成；`ensureAudio()` 需首次用户手势激活（App.vue pointerdown once）
- PWA：`registerType: 'autoUpdate'`；SW 只缓存静态资源，`navigateFallbackDenylist: [/^\/api\//]`，导航请求 NetworkFirst
- 前端测试与源码同目录（`src/*.test.js`），fetch mock 用 `vi.stubGlobal`；state 模块测试注意 `vi.resetModules()` + 动态 import

## 视觉 / 代码风格

- 青玉国风：主色 `--vermilion: #0e8a99`（变量名叫 vermilion 但实为青色，历史遗留，勿改）；CSS 变量全部在 `style.css :root`；衬线中文 Noto Serif SC + 数字 Outfit（Google Fonts）
- 组件样式一律 scoped + CSS 变量，动效缓动常用 `cubic-bezier(.2,.7,.2,1)`；数值显示用 `font-variant-numeric: tabular-nums`
- 界面文案、代码注释、错误提示全部中文；命名英文
- Git 提交：Conventional Commits + 中文描述（feat/fix/chore/docs/style），交互手感微调专用前缀 `feel:`

## 测试要求

改后端路由/鉴权/成绩逻辑或前端 state/sync/api/gameLogic 后，必须跑 `npm test` 并保持通过。测试覆盖较全（会话续期、限速、游客合并、云同步边界都有用例），新增行为应同步补测试。
