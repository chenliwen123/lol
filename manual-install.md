# 手动安装指南

由于自动脚本可能遇到编码问题，请按以下步骤手动安装：

## 1. 清理环境

```bash
# 清理 npm 缓存
npm cache clean --force

# 重置 npm 配置
npm config set registry https://registry.npmjs.org/
npm config delete puppeteer_download_host
```

## 2. 设置环境变量

在命令行中设置以下环境变量：

```bash
set PUPPETEER_SKIP_DOWNLOAD=true
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## 3. 安装后端依赖

```bash
# 删除现有文件（如果存在）
rmdir /s /q node_modules
del package-lock.json

# 安装依赖
npm install --no-optional --legacy-peer-deps
```

## 4. 安装前端依赖

```bash
# 进入前端目录
cd client

# 删除现有文件（如果存在）
rmdir /s /q node_modules
del package-lock.json

# 安装依赖
npm install --no-optional --legacy-peer-deps

# 返回根目录
cd ..
```

## 5. 验证安装

```bash
# 检查后端依赖
npm list --depth=0

# 检查前端依赖
cd client
npm list --depth=0
cd ..
```

## 6. 启动项目

```bash
# 启动后端服务（开发模式）
npm run dev

# 在新的命令行窗口启动前端
npm run client

# 测试简单爬虫
npm run crawler-simple mock TestPlayer
```

## 常见问题解决

### 如果遇到权限问题：
- 以管理员身份运行命令提示符

### 如果遇到网络问题：
```bash
# 使用国内镜像（可选）
npm config set registry https://registry.npmmirror.com
```

### 如果 Puppeteer 仍然尝试下载：
```bash
# 在项目根目录创建 .npmrc 文件，内容如下：
puppeteer_skip_chromium_download=true
```

## 项目结构确认

安装完成后，您的项目结构应该是：

```
lol-stats-system/
├── server/                 # 后端代码
├── crawler/               # 爬虫代码
├── client/               # 前端代码
├── node_modules/         # 后端依赖
├── client/node_modules/  # 前端依赖
├── package.json
└── .env
```

## 下一步

安装完成后，您可以：

1. 启动后端服务查看 API
2. 启动前端应用查看界面
3. 使用简单爬虫生成测试数据
4. 根据需要配置 MongoDB 数据库
