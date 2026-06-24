@echo off
chcp 65001 >nul
title ספין זוגי - הכנה להפצה
cd /d "%~dp0"

echo.
echo  ================================================
echo   ספין זוגי - הכנה להעלאה לאוויר
echo  ================================================
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

echo [1/2] בונה גרסת production...
call npm run deploy:build
if errorlevel 1 (
    echo [שגיאה] הבנייה נכשלה.
    pause
    exit /b 1
)

echo.
echo [2/2] מפעיל תצוגה מקומית של גרסת ההפצה...
echo        בדוק בדפדפן: http://localhost:4173
echo        לעצירה: Ctrl+C
echo.
start "" "http://localhost:4173/"
call npm run preview -- --host

pause
