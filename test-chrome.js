// 测试Chrome配置
require('dotenv').config();

console.log('=== Chrome配置测试 ===');
console.log('Chrome路径:', process.env.PUPPETEER_EXECUTABLE_PATH);

try {
  const puppeteer = require('puppeteer');
  console.log('✅ Puppeteer模块加载成功');
  
  (async () => {
    try {
      console.log('🚀 尝试启动Chrome...');
      
      const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('✅ Chrome启动成功！');
      
      const page = await browser.newPage();
      console.log('✅ 页面创建成功！');
      
      await page.goto('https://www.baidu.com');
      console.log('✅ 网页访问成功！');
      
      await browser.close();
      console.log('✅ 所有测试通过！可以进行真实数据抓取了。');
      
    } catch (error) {
      console.log('❌ Chrome启动失败:', error.message);
      console.log('请检查Chrome路径是否正确');
    }
  })();
  
} catch (error) {
  console.log('❌ Puppeteer模块加载失败:', error.message);
  console.log('请先安装Puppeteer: npm install puppeteer@19.11.1');
}
