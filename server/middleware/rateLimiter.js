const rateLimit = require('express-rate-limit');

// 创建限流中间件
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 时间窗口
    max, // 最大请求数
    message: {
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true, // 返回 rate limit 信息在 `RateLimit-*` headers
    legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  });
};

// 不同类型的限流器
const limiters = {
  // 通用API限流
  general: createRateLimiter(15 * 60 * 1000, 100), // 15分钟100次
  
  // 搜索API限流（更严格）
  search: createRateLimiter(1 * 60 * 1000, 10), // 1分钟10次
  
  // 数据写入限流
  write: createRateLimiter(5 * 60 * 1000, 20), // 5分钟20次
  
  // 爬虫API限流
  crawler: createRateLimiter(10 * 60 * 1000, 5) // 10分钟5次
};

module.exports = limiters;
