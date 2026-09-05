# 舒尔特方格

注意力训练小游戏：按顺序点击方格中的数字，越快越好。Vue 3 前端 + Express 后端，支持账号注册、成绩记录与局域网排行榜。

## 启动

需要 Node.js 22.5+（使用了内置 `node:sqlite`）。

```bash
npm install        # 首次使用
npm run build      # 构建前端（首次或前端改动后）
npm start          # 启动服务，访问 http://localhost:3785
```

局域网内手机/其他电脑访问 `http://<本机IP>:3785`。

## 开发

```bash
npm run dev        # 同时启动 Vite(5175) 与 Express(3785)，热更新；开发访问 http://localhost:5175
npm test           # 运行前后端测试
```

## 数据

账号与成绩存于根目录 `schulte.db`（SQLite，运行时生成，已 gitignore），含 users / records / sessions 三张表。

## 素材

背景插画来自 [Pexels](https://www.pexels.com/photo/tranquil-misty-mountain-and-lake-landscape-38951780/)（Pexels License，可自由使用，无需署名）。
