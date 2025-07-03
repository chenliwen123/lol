@echo off
echo Simple Install Script
echo.

echo Step 1: Check Node.js
node --version
if %errorlevel% neq 0 (
    echo Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Step 2: Set environment variables
set PUPPETEER_SKIP_DOWNLOAD=true
set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
echo Environment variables set.

echo Step 3: Install backend dependencies
npm install --no-optional
if %errorlevel% neq 0 (
    echo Backend installation failed. Trying with force...
    npm install --force
)

echo Step 4: Check if client directory exists
if not exist client (
    echo Client directory not found. Creating basic structure...
    mkdir client
    echo {"name": "client", "version": "1.0.0"} > client\package.json
)

echo Step 5: Install frontend dependencies
cd client
npm install --no-optional
cd ..

echo.
echo Installation completed!
echo.
echo To start the backend: npm run dev
echo To start the frontend: npm run client
echo.
pause
