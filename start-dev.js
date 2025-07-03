#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 启动LOL战绩统计系统开发环境...\n');

// 检查依赖是否安装
function checkDependencies() {
  const rootNodeModules = path.join(__dirname, 'node_modules');
  const clientNodeModules = path.join(__dirname, 'client', 'node_modules');

  if (!fs.existsSync(rootNodeModules)) {
    console.log('❌ 根目录依赖未安装，请先运行: npm install');
    process.exit(1);
  }

  if (!fs.existsSync(clientNodeModules)) {
    console.log('❌ 前端依赖未安装，请先运行: cd client && npm install');
    process.exit(1);
  }

  console.log('✅ 依赖检查通过');
}

// 启动后端服务器
function startBackend() {
  console.log('🔧 启动后端服务器...');

  const backend = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/lol-stats',
    },
  });

  backend.on('error', (err) => {
    console.error('❌ 后端启动失败:', err);
  });

  return backend;
}

// 启动前端开发服务器
function startFrontend() {
  console.log('🌐 启动前端开发服务器...');

  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '3000',
      BROWSER: 'none',
    },
    shell: true,
  });

  frontend.on('error', (err) => {
    console.error('❌ 前端启动失败:', err);
  });

  return frontend;
}

// 主函数
function main() {
  try {
    checkDependencies();

    const backend = startBackend();

    // 等待2秒后启动前端
    setTimeout(() => {
      const frontend = startFrontend();

      // 处理退出信号
      process.on('SIGINT', () => {
        console.log('\n🛑 正在关闭服务...');
        backend.kill('SIGINT');
        frontend.kill('SIGINT');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 正在关闭服务...');
        backend.kill('SIGTERM');
        frontend.kill('SIGTERM');
        process.exit(0);
      });
    }, 2000);

    console.log('\n📝 服务信息:');
    console.log('   🔧 后端API: http://localhost:5000');
    console.log('   🌐 前端界面: http://localhost:3000');
    console.log('   📊 API文档: http://localhost:5000/health');
    console.log('   按 Ctrl+C 停止服务\n');
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { startBackend, startFrontend };
