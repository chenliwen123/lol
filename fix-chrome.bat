@echo off
setlocal enabledelayedexpansion
echo ========================================
echo Fixing Chrome for Puppeteer
echo ========================================
echo.

echo [Step 1] Checking Chrome installation...
echo.

REM Check if Chrome is in PATH
where chrome.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Chrome found in system PATH
    for /f "tokens=*" %%i in ('where chrome.exe') do set CHROME_PATH=%%i
    echo Chrome path: !CHROME_PATH!
    goto :configure
)

echo Chrome not found in PATH, checking common locations...

REM Check 64-bit Chrome
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
    echo ✅ Found Chrome (64-bit): !CHROME_PATH!
    goto :configure
)

REM Check 32-bit Chrome
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    echo ✅ Found Chrome (32-bit): !CHROME_PATH!
    goto :configure
)

REM Check Edge (as fallback)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    echo ✅ Found Microsoft Edge (fallback): !CHROME_PATH!
    goto :configure
)

echo ❌ Chrome not found in common locations
echo.
echo Please install Google Chrome:
echo 1. Visit: https://www.google.com/chrome/
echo 2. Download and install Chrome
echo 3. Run this script again
echo.
pause
exit /b 1

:configure
echo.
echo [Step 2] Configuring environment...
echo.

REM Backup existing .env if it exists
if exist .env (
    copy .env .env.backup >nul 2>&1
    echo Backed up existing .env file
)

REM Add Chrome path to .env
echo # Puppeteer Chrome configuration >> .env
echo PUPPETEER_EXECUTABLE_PATH=%CHROME_PATH% >> .env
echo PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true >> .env
echo ✅ Configuration added to .env file

echo.
echo [Step 3] Testing configuration...
echo.

REM Test if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    echo Please make sure Node.js is installed and in PATH
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo Testing Puppeteer...

REM Create a simple test file
echo const puppeteer = require('puppeteer'); > test-chrome.js
echo (async () => { >> test-chrome.js
echo   try { >> test-chrome.js
echo     const browser = await puppeteer.launch({ >> test-chrome.js
echo       executablePath: '%CHROME_PATH%', >> test-chrome.js
echo       headless: true >> test-chrome.js
echo     }); >> test-chrome.js
echo     console.log('✅ Puppeteer can launch Chrome successfully!'); >> test-chrome.js
echo     await browser.close(); >> test-chrome.js
echo   } catch (error) { >> test-chrome.js
echo     console.log('❌ Puppeteer failed:', error.message); >> test-chrome.js
echo   } >> test-chrome.js
echo })(); >> test-chrome.js

node test-chrome.js
del test-chrome.js >nul 2>&1

echo.
echo ========================================
echo Configuration completed!
echo ========================================
echo.
echo Chrome path: %CHROME_PATH%
echo.
echo You can now try real data crawling:
echo   npm run crawler single "love丶小文" WT1
echo.
pause
