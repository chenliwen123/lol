const OPGGCrawler = require('./crawler/opgg-crawler.js');

async function testOPGG() {
  const crawler = new OPGGCrawler();
  
  try {
    await crawler.init();
    console.log('🚀 开始测试OP.GG API...');
    
    // 测试1：尝试韩服知名玩家
    console.log('\n=== 测试1：韩服知名玩家 ===');
    try {
      const result1 = await crawler.crawlSummoner('Hide on bush', 'kr');
      console.log('✅ 韩服测试成功:', result1.summonerName);
    } catch (error) {
      console.log('❌ 韩服测试失败:', error.message);
    }
    
    // 测试2：尝试中国服务器（如果支持）
    console.log('\n=== 测试2：尝试中国服务器 ===');
    const cnRegions = ['cn1', 'cn', 'china', 'lol'];
    
    for (const region of cnRegions) {
      try {
        console.log(`尝试区域代码: ${region}`);
        const result2 = await crawler.crawlSummoner('love丶小文', region);
        console.log('✅ 中国服务器测试成功:', result2.summonerName);
        break;
      } catch (error) {
        console.log(`❌ 区域 ${region} 失败:`, error.message);
      }
    }
    
    // 测试3：直接测试API端点
    console.log('\n=== 测试3：直接测试API端点 ===');
    const axios = require('axios');
    
    const testUrls = [
      'https://www.op.gg/api/v1.0/internal/bypass/summoners/kr/Hide%20on%20bush',
      'https://op.gg/api/v1.0/internal/bypass/summoners/kr/Hide%20on%20bush',
      'https://www.op.gg/summoners/kr/Hide%20on%20bush',
      'https://op.gg/summoners/kr/Hide%20on%20bush'
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`测试URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/html, */*',
            'Referer': 'https://www.op.gg/'
          },
          timeout: 10000
        });
        
        console.log(`✅ URL可访问: ${url}`);
        console.log(`响应状态: ${response.status}`);
        console.log(`响应类型: ${typeof response.data}`);
        
        if (typeof response.data === 'object') {
          console.log('JSON响应示例:', JSON.stringify(response.data, null, 2).substring(0, 500));
        } else {
          console.log('HTML响应长度:', response.data.length);
        }
        break;
        
      } catch (error) {
        console.log(`❌ URL失败: ${url} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error);
  } finally {
    await crawler.close();
  }
}

// 运行测试
testOPGG().catch(console.error);
