# 手动配置Chrome for Puppeteer

如果自动脚本失败，请按以下步骤手动配置：

## 步骤1：检查Chrome是否已安装

打开命令提示符，输入：
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

或者：
```cmd
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --version
```

如果显示版本号，说明Chrome已安装。

## 步骤2：如果Chrome未安装

1. 访问：https://www.google.com/chrome/
2. 下载并安装Chrome浏览器

## 步骤3：配置.env文件

在项目根目录的`.env`文件中添加以下内容：

**如果是64位Chrome：**
```
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

**如果是32位Chrome：**
```
PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## 步骤4：测试配置

创建一个测试文件`test-puppeteer.js`：
```javascript
const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true
    });
    console.log('✅ Puppeteer启动成功！');
    await browser.close();
  } catch (error) {
    console.log('❌ Puppeteer启动失败:', error.message);
  }
})();
```

运行测试：
```cmd
node test-puppeteer.js
```

## 步骤5：测试真实抓取

如果测试成功，尝试抓取真实数据：
```cmd
npm run crawler single "love丶小文" WT1
```

## 常见问题解决

### 问题1：找不到Chrome
- 确保Chrome已正确安装
- 检查路径是否正确
- 尝试使用Edge作为替代：
  ```
  PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
  ```

### 问题2：权限问题
- 以管理员身份运行命令提示符
- 确保Chrome可执行文件有执行权限

### 问题3：Puppeteer版本问题
- 确保使用的是兼容版本：
  ```cmd
  npm install puppeteer@19.11.1 --save
  ```

### 问题4：网络问题
- 如果真实抓取仍然失败，可以使用模拟数据：
  ```cmd
  npm run crawler-simple mock "love丶小文" WT1
  ```
