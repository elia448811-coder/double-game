@echo off
chcp 65001 >nul
title העלאה ל-GitHub — project-3eank
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  העלאת ספין זוגי ל-GitHub               ║
echo  ║  Repository: project-3eank               ║
echo  ╚══════════════════════════════════════════╝
echo.

where gh >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] GitHub CLI ^(gh^) לא מותקן.
    echo הורד מ: https://cli.github.com
    pause
    exit /b 1
)

where git >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] Git לא מותקן.
    pause
    exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
    echo התחברות ל-GitHub — ייפתח דפדפן...
    echo העתק את הקוד שיופיע למטה ל: https://github.com/login/device
    echo.
    gh auth login -h github.com -p https -w
    if errorlevel 1 (
        echo [שגיאה] ההתחברות נכשלה.
        pause
        exit /b 1
    )
    echo.
)

if not exist ".git\" (
    git init
    git branch -M main
    git add -A
    git commit -m "Initial commit: Couple Spin app"
)

git branch -M main 2>nul

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo יוצר ריפו חדש ב-GitHub: project-3eank ...
    gh repo create project-3eank --public --source=. --remote=origin --description "Couple Spin - ספין זוגי"
    if errorlevel 1 (
        echo [שגיאה] יצירת הריפו נכשלה ^(אולי השם תפוס?^).
        pause
        exit /b 1
    )
)

echo.
echo דוחף קוד ל-GitHub...
git push -u origin main
if errorlevel 1 (
    echo [שגיאה] הדחיפה נכשלה.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║  הועלה בהצלחה!                           ║
echo  ╚══════════════════════════════════════════╝
echo.
for /f "delims=" %%u in ('gh api user -q .login') do set GHUSER=%%u
echo   https://github.com/%GHUSER%/project-3eank
echo.
echo  ב-Vercel: Settings ^> Git ^> Connect ^> project-3eank
echo.
pause
