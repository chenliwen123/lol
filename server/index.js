const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// 导入配置和中间件
const connectDB = require('./config/database');
const rateLimiters = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// 连接数据库
connectDB(); //

// 基础中间件
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 应用通用限流
app.use(rateLimiters.general);

// 健康检查路由
app.get('/', (req, res) => {
  res.json({
    message: '掌盟战绩数据系统 API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API 路由
app.use('/api/summoner', require('./routes/summoner'));
app.use('/api/matches', require('./routes/matches'));

// 爬虫控制路由
app.use('/api/crawler', require('./routes/crawler'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message:
      process.env.NODE_ENV === 'development' ? err.message : '请稍后重试',
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
