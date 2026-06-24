@echo off
chcp 65001 >nul
title ספין זוגי - בניית הפצה
cd /d "%~dp0"

echo.
echo  ========================================
echo   ספין זוגי - בונה גרסת הפצה (dist)
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] Node.js לא מותקן. התקן מ: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo מתקין חבילות...
    call npm ci 2>nul
    if errorlevel 1 call npm install
)

call npm run deploy:build
if errorlevel 1 (
    echo.
    echo [שגיאה] הבנייה נכשלה.
    pause
    exit /b 1
)

echo.
echo  פותח את תיקיית dist...
start "" explorer "%~dp0dist"

pause
