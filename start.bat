@echo off
echo ===================================================
echo 🔥 AGNIVA 2.0 - FIRE DETECTION ^& SAFETY SYSTEM 🔥
echo ===================================================
echo.

:: Verify Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Verify Node.js/npm installation
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed or not in PATH.
    pause
    exit /b 1
)

echo [1/3] Installing Python dependencies (local mode)...
pip install -r fire_detection_system/requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some python dependencies failed to install. Local detection may fall back to simulated mode.
)

echo.
echo [2/3] Installing Frontend dependencies...
cd agniv-2.0\frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo [3/3] Starting Agniva 2.0...
echo.
echo * Starting Flask backend on http://localhost:5000...
start "Agniva Backend" cmd /k "cd fire_detection_system && set DEV_MODE=true && python server.py"

echo * Starting React frontend on http://localhost:5173...
cd agniv-2.0\frontend
call npm run dev
