const LCUCrawler = require('./crawler/lcu-crawler.js');

async function testLCU() {
  const crawler = new LCUCrawler();
  
  try {
    console.log('🚀 开始测试LCU API...');
    
    // 初始化LCU连接
    await crawler.init();
    
    console.log('\n=== 测试1：获取当前召唤师信息 ===');
    try {
      const currentSummoner = await crawler.getCurrentSummoner();
      console.log('✅ 当前召唤师:', currentSummoner.displayName);
      console.log('召唤师等级:', currentSummoner.summonerLevel);
      console.log('召唤师ID:', currentSummoner.summonerId);
      
      // 抓取当前召唤师的完整数据
      console.log('\n=== 测试2：抓取当前召唤师完整数据 ===');
      const result = await crawler.crawlSummoner();
      console.log('✅ 数据抓取成功:', result.summonerName);
      
    } catch (error) {
      console.log('❌ 获取当前召唤师失败:', error.message);
    }
    
    // 测试查询指定召唤师
    console.log('\n=== 测试3：查询指定召唤师 ===');
    try {
      const result2 = await crawler.crawlSummoner('love丶小文');
      console.log('✅ 指定召唤师抓取成功:', result2.summonerName);
    } catch (error) {
      console.log('❌ 查询指定召唤师失败:', error.message);
    }
    
  } catch (error) {
    console.error('❌ LCU测试失败:', error.message);
    
    if (error.message.includes('LOL客户端未启动')) {
      console.log('\n💡 解决方案:');
      console.log('1. 启动英雄联盟客户端');
      console.log('2. 登录到游戏账号');
      console.log('3. 重新运行此测试');
    }
  } finally {
    await crawler.close();
  }
}

// 运行测试
testLCU().catch(console.error);
