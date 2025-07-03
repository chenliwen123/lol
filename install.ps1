# 掌盟战绩系统依赖安装脚本

Write-Host "正在安装掌盟战绩系统依赖..." -ForegroundColor Green
Write-Host ""

# 检查 Node.js 环境
Write-Host "[1/3] 检查 Node.js 环境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green
    Write-Host "npm 版本: $npmVersion" -ForegroundColor Green
    Write-Host "Node.js 环境检查通过" -ForegroundColor Green
} catch {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""

# 安装后端依赖
Write-Host "[2/3] 安装后端依赖..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Host "后端依赖安装完成" -ForegroundColor Green
} catch {
    Write-Host "错误: 后端依赖安装失败" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""

# 安装前端依赖
Write-Host "[3/3] 安装前端依赖..." -ForegroundColor Yellow
try {
    Set-Location client
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Set-Location ..
    Write-Host "前端依赖安装完成" -ForegroundColor Green
} catch {
    Write-Host "错误: 前端依赖安装失败" -ForegroundColor Red
    Set-Location ..
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""
Write-Host "✅ 所有依赖安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "启动命令:" -ForegroundColor Yellow
Write-Host "  后端服务: npm run dev" -ForegroundColor Cyan
Write-Host "  前端应用: npm run client" -ForegroundColor Cyan
Write-Host "  爬虫程序: npm run crawler" -ForegroundColor Cyan
Write-Host ""
Read-Host "按任意键退出"
