@echo off
echo ===================================================
echo 🔥 AGNIVA 2.0 - FIRE DETECTION ^& SAFETY SYSTEM 🔥
echo ===================================================
echo.
echo Launching local development servers...
echo.

:: Start Flask backend in a separate console window
echo * Starting Flask backend on http://localhost:5000...
start "Agniva Backend" cmd /k "cd fire_detection_system && set DEV_MODE=true && python server.py"

:: Start Vite React frontend in the current console window
echo * Starting React frontend on http://localhost:5173...
cd agniv-2.0\frontend
call npm run dev
