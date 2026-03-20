@echo off
title AI SHORTS EMPIRE — LAUNCHER
echo =========================================
echo 🔥 AI SHORTS EMPIRE: ONE-OF-ONE EDITION 🔥
echo =========================================
echo.
echo 1. Run Autonomous (All Targets)
echo 2. Run Interactive (Custom Niche)
echo.
set /p choice="Select Mode (1-2): "

if "%choice%"=="1" (
    echo [LAUNCH] Starting Autonomous Mode...
    npx tsx src/index.ts
)
if "%choice%"=="2" (
    echo [LAUNCH] Starting Interactive Mode...
    npx tsx src/index.ts --interactive
)

echo.
echo =========================================
echo Done! Press any key to exit.
pause > nul
