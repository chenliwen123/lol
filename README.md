# 掌盟战绩数据系统

一个完整的英雄联盟战绩数据抓取、存储和展示系统。

## 系统架构

```
掌盟战绩页面
    ↓（爬虫、API抓取）
Node.js后端
    ↓（存储）
MongoDB
    ↓
前端页面（React）
```

## 项目结构

```
lol-stats-system/
├── server/                 # 后端 API 服务
│   ├── index.js           # 服务器入口
│   ├── models/            # MongoDB 数据模型
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件
│   └── config/            # 配置文件
├── crawler/               # 数据爬虫
│   ├── index.js          # 爬虫入口
│   ├── scrapers/         # 各种爬虫脚本
│   └── utils/            # 工具函数
├── client/               # React 前端应用
└── docs/                 # 文档
```

## 快速开始

### 1. 安装依赖
```bash
npm run install-all
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并配置相关参数

### 3. 启动 MongoDB
确保 MongoDB 服务正在运行

### 4. 启动后端服务
```bash
npm run dev
```

### 5. 启动前端应用
```bash
npm run client
```

### 6. 运行数据爬虫
```bash
npm run crawler
```

## 功能特性

- 🕷️ 自动抓取掌盟战绩数据
- 💾 MongoDB 数据存储
- 🌐 RESTful API 接口
- ⚛️ React 前端展示
- 📊 战绩数据可视化

## 技术栈

- **后端**: Node.js + Express + MongoDB
- **前端**: React + Axios
- **爬虫**: Puppeteer + Cheerio
- **数据库**: MongoDB + Mongoose

## API 文档

### 获取玩家战绩
```
GET /api/matches/:summonerId
```

### 获取玩家信息
```
GET /api/summoner/:summonerId
```

更多 API 文档请查看 `/docs/api.md`

## 开发说明

1. 请遵循项目的代码规范
2. 提交前请确保所有测试通过
3. 新增功能请添加相应的文档

## 许可证

MIT License
