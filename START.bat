@echo off
chcp 65001 >nul
title ספין זוגי — הפעלה מקומית
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════╗
echo  ║     ספין זוגי — הפעלה מקומית     ║
echo  ╚══════════════════════════════════╝
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] Node.js לא מותקן.
    echo הורד והתקן מ: https://nodejs.org  ^(גרסה 20 ומעלה^)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo Node: %%v
echo.

if not exist "node_modules\" (
    echo מתקין חבילות ^(פעם ראשונה — עלול לקחת דקה^)...
    call npm install
    if errorlevel 1 (
        echo.
        echo [שגיאה] npm install נכשל.
        pause
        exit /b 1
    )
    echo.
)

echo מפעיל את האפליקציה...
echo.
echo   כתובת:  http://localhost:5173
echo   לעצירה: סגור חלון זה או Ctrl+C
echo.

call npm run dev -- --open --host

echo.
pause
