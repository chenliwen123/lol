const express = require('express');
const router = express.Router();
const ZhangMengCrawler = require('../../crawler');
const rateLimiters = require('../middleware/rateLimiter');
const { validateSummonerNameBody } = require('../middleware/validator');

// 应用爬虫专用限流
router.use(rateLimiters.crawler);

// 爬虫实例管理
let crawlerInstance = null;

// 初始化爬虫
async function initCrawler() {
  if (!crawlerInstance) {
    crawlerInstance = new ZhangMengCrawler();
    await crawlerInstance.init();
  }
  return crawlerInstance;
}

// 测试路由 - 生成模拟数据
router.post('/test', async (req, res) => {
  try {
    const { summonerName = 'TestPlayer', region = 'HN1' } = req.body;

    console.log(`🧪 生成测试数据: ${summonerName} (${region})`);

    // 生成模拟召唤师数据
    const mockData = {
      summonerName: summonerName,
      summonerId: `${region}_${summonerName}_${Date.now()}`,
      summonerLevel: Math.floor(Math.random() * 200) + 30,
      region: region,
      rankInfo: {
        soloRank: {
          tier: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'][Math.floor(Math.random() * 6)],
          rank: ['IV', 'III', 'II', 'I'][Math.floor(Math.random() * 4)],
          leaguePoints: Math.floor(Math.random() * 100),
          wins: Math.floor(Math.random() * 100) + 20,
          losses: Math.floor(Math.random() * 80) + 10
        }
      },
      dataSource: 'mock',
      lastUpdated: new Date()
    };

    // 计算胜率
    const totalGames = mockData.rankInfo.soloRank.wins + mockData.rankInfo.soloRank.losses;
    mockData.rankInfo.soloRank.winRate = Math.round((mockData.rankInfo.soloRank.wins / totalGames) * 100);

    res.json({
      success: true,
      message: '测试数据生成成功',
      data: mockData
    });
  } catch (error) {
    console.error('生成测试数据失败:', error);
    res.status(500).json({
      success: false,
      error: '生成测试数据失败',
      message: error.message
    });
  }
});

// 手动触发抓取单个召唤师
router.post('/summoner', validateSummonerNameBody, async (req, res) => {
  try {
    const { summonerName, region = 'HN1' } = req.body;

    console.log(`🔍 API触发抓取召唤师: ${summonerName} (${region})`);
    console.log('请求数据:', req.body);

    const crawler = await initCrawler();
    const result = await crawler.crawlSummonerByHttp(summonerName, region);

    res.json({
      success: true,
      message: '召唤师数据抓取成功',
      data: result
    });
  } catch (error) {
    console.error('API抓取召唤师失败:', error);
    res.status(500).json({
      success: false,
      error: '抓取召唤师数据失败',
      message: error.message
    });
  }
});

// 批量抓取召唤师
router.post('/summoners/batch', async (req, res) => {
  try {
    const { summonerNames, region = 'HN1' } = req.body;
    
    if (!Array.isArray(summonerNames) || summonerNames.length === 0) {
      return res.status(400).json({
        success: false,
        error: '召唤师名称列表不能为空'
      });
    }
    
    if (summonerNames.length > 10) {
      return res.status(400).json({
        success: false,
        error: '批量抓取最多支持10个召唤师'
      });
    }
    
    console.log(`🔍 API触发批量抓取: ${summonerNames.join(', ')} (${region})`);
    
    const crawler = await initCrawler();
    const results = [];
    
    for (const name of summonerNames) {
      try {
        const result = await crawler.crawlSummonerByHttp(name, region);
        results.push({
          summonerName: name,
          success: true,
          data: result
        });
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        results.push({
          summonerName: name,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `批量抓取完成，成功 ${successCount}/${summonerNames.length} 个`,
      data: results
    });
  } catch (error) {
    console.error('API批量抓取失败:', error);
    res.status(500).json({
      success: false,
      error: '批量抓取失败',
      message: error.message
    });
  }
});

// 获取爬虫状态
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      crawlerInitialized: !!crawlerInstance,
      status: crawlerInstance ? 'ready' : 'not_initialized',
      timestamp: new Date().toISOString()
    }
  });
});

// 停止爬虫
router.post('/stop', async (req, res) => {
  try {
    if (crawlerInstance) {
      await crawlerInstance.close();
      crawlerInstance = null;
      
      res.json({
        success: true,
        message: '爬虫已停止'
      });
    } else {
      res.json({
        success: true,
        message: '爬虫未运行'
      });
    }
  } catch (error) {
    console.error('停止爬虫失败:', error);
    res.status(500).json({
      success: false,
      error: '停止爬虫失败',
      message: error.message
    });
  }
});

// 重启爬虫
router.post('/restart', async (req, res) => {
  try {
    // 先停止现有爬虫
    if (crawlerInstance) {
      await crawlerInstance.close();
      crawlerInstance = null;
    }
    
    // 重新初始化
    await initCrawler();
    
    res.json({
      success: true,
      message: '爬虫已重启'
    });
  } catch (error) {
    console.error('重启爬虫失败:', error);
    res.status(500).json({
      success: false,
      error: '重启爬虫失败',
      message: error.message
    });
  }
});

// 优雅关闭处理
process.on('SIGINT', async () => {
  if (crawlerInstance) {
    console.log('🔒 正在关闭爬虫...');
    await crawlerInstance.close();
  }
});

process.on('SIGTERM', async () => {
  if (crawlerInstance) {
    console.log('🔒 正在关闭爬虫...');
    await crawlerInstance.close();
  }
});

module.exports = router;
