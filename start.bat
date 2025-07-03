@echo off
echo 掌盟战绩系统启动脚本
echo.

:menu
echo 请选择要启动的服务:
echo 1. 启动后端服务 (开发模式)
echo 2. 启动前端应用
echo 3. 运行爬虫程序
echo 4. 同时启动后端和前端
echo 5. 退出
echo.

set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto crawler
if "%choice%"=="4" goto both
if "%choice%"=="5" goto exit
echo 无效选项，请重新选择
goto menu

:backend
echo 启动后端服务...
npm run dev
goto menu

:frontend
echo 启动前端应用...
npm run client
goto menu

:crawler
echo 运行爬虫程序...
set /p summoner=请输入召唤师名称 (默认: Faker): 
if "%summoner%"=="" set summoner=Faker
npm run crawler single %summoner%
goto menu

:both
echo 同时启动后端和前端...
echo 注意: 这将打开两个新的命令行窗口
start "后端服务" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "前端应用" cmd /k "npm run client"
echo 服务已启动，请查看新打开的窗口
goto menu

:exit
echo 再见！
pause
exit
