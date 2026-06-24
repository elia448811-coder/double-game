@echo off
setlocal EnableExtensions
chcp 65001 >nul
title GitHub — התחברות (double-game)
cd /d "%~dp0"

echo.
echo  ========================================
echo   התחברות ל-GitHub
echo  ========================================
echo.

where gh >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] GitHub CLI ^(gh^) לא מותקן.
    echo.
    echo הורד והתקן מ: https://cli.github.com
    echo.
    echo --- חלופה: חיבור ידני ---
    echo 1. צור ריפו ריק: https://github.com/new
    echo    שם: double-game
    echo 2. הרץ: GITHUB_PUSH.bat ובחר "חיבור ידני"
    echo.
    pause
    exit /b 1
)

gh auth status 2>nul
if not errorlevel 1 (
    echo [OK] כבר מחובר ל-GitHub:
    gh auth status
    echo.
    echo להעלאת הקוד הרץ: GITHUB_PUSH.bat
    echo.
    pause
    exit /b 0
)

echo שלב 1: יופיע קוד חד-פעמי למטה
echo שלב 2: הדפדפן ייפתח — הדבק את הקוד
echo שלב 3: לחץ Authorize / אישור
echo.
echo אם הדפדפן לא נפתח, היכנס ידנית ל:
echo   https://github.com/login/device
echo.
pause

start "" "https://github.com/login/device"

echo.
echo מתחבר...
gh auth login -h github.com -p https -w
if errorlevel 1 (
    echo.
    echo [שגיאה] ההתחברות נכשלה.
    echo נסה שוב, או השתמש ב-GITHUB_PUSH.bat ^(חיבור ידני^).
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] התחברות הצליחה!
gh auth status
echo.
echo עכשיו הרץ: GITHUB_PUSH.bat
echo.
pause
exit /b 0
