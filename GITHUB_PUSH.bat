@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title GitHub — העלאה (double-game)
cd /d "%~dp0"

set "REPO_NAME=double-game"
set "GHUSER="

echo.
echo  ========================================
echo   העלאת Double Game ל-GitHub
echo   Repository: %REPO_NAME%
echo   Vercel:     double game
echo  ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] Git לא מותקן. הורד מ: https://git-scm.com
    pause
    exit /b 1
)

echo בחר אופן העלאה:
echo.
echo   [1] אוטומטי — דורש gh מותקן ומחובר ^(הרץ קודם GITHUB_CONNECT.bat^)
echo   [2] ידני — כבר יצרתי ריפו double-game ב-GitHub
echo   [0] יציאה
echo.
set /p "MODE=בחירה (1/2/0): "

if "%MODE%"=="0" exit /b 0
if not "%MODE%"=="1" if not "%MODE%"=="2" (
    echo בחירה לא תקינה.
    pause
    exit /b 1
)

REM --- Git init if needed ---
if not exist ".git\" (
    echo מאתחל Git...
    git init
    git add -A
    git commit -m "Initial commit: Double Game (Couple Spin)"
)
git branch -M main 2>nul

REM --- Uncommitted changes ---
git diff --quiet 2>nul
git diff --cached --quiet 2>nul
if errorlevel 1 (
    echo שומר שינויים...
    git add -A
    git commit -m "Update project files"
)

if "%MODE%"=="1" goto AUTO
if "%MODE%"=="2" goto MANUAL

:AUTO
where gh >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] gh לא מותקן. השתמש באפשרות 2 ^(ידני^) או התקן: https://cli.github.com
    pause
    exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
    echo [שגיאה] לא מחובר ל-GitHub.
    echo הרץ קודם: GITHUB_CONNECT.bat
    echo.
    pause
    exit /b 1
)

for /f "usebackq delims=" %%u in (`gh api user -q .login 2^>nul`) do set "GHUSER=%%u"
if "!GHUSER!"=="" (
    echo [שגיאה] לא הצלחתי לקרוא שם משתמש מ-GitHub.
    pause
    exit /b 1
)

echo משתמש GitHub: !GHUSER!

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo יוצר ריפו %REPO_NAME%...
    gh repo view "!GHUSER!/%REPO_NAME%" >nul 2>&1
    if errorlevel 1 (
        gh repo create %REPO_NAME% --public --source=. --remote=origin --description "Double Game - ספין זוגי"
        if errorlevel 1 (
            echo [שגיאה] יצירת הריפו נכשלה.
            pause
            exit /b 1
        )
    ) else (
        git remote add origin "https://github.com/!GHUSER!/%REPO_NAME%.git"
    )
) else (
    echo remote origin כבר קיים — ממשיך...
)

goto PUSH

:MANUAL
echo.
echo --- חיבור ידני ---
echo.
echo לפני שממשיכים:
echo   1. היכנס ל: https://github.com/new
echo   2. שם הריפו: %REPO_NAME%
echo   3. Public, בלי README / .gitignore
echo   4. Create repository
echo.
set /p "GHUSER=הקלד את שם המשתמש שלך ב-GitHub: "
if "!GHUSER!"=="" (
    echo [שגיאה] חובה להזין שם משתמש.
    pause
    exit /b 1
)

set "REMOTE_URL=https://github.com/!GHUSER!/%REPO_NAME%.git"
echo.
echo Remote: !REMOTE_URL!

git remote get-url origin >nul 2>&1
if not errorlevel 1 (
    git remote remove origin
)
git remote add origin "!REMOTE_URL!"

:PUSH
echo.
echo דוחף ל-GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo [שגיאה] הדחיפה נכשלה.
    echo.
    echo פתרונות:
    echo   - ודא שהריפו %REPO_NAME% קיים בחשבון שלך
    echo   - ודא שאתה מחובר ^(GitHub יבקש התחברות בדפדפן^)
    echo   - נסה: GITHUB_CONNECT.bat ואז הרץ שוב
    echo.
    pause
    exit /b 1
)

if "!GHUSER!"=="" (
    for /f "usebackq delims=" %%u in (`gh api user -q .login 2^>nul`) do set "GHUSER=%%u"
)

echo.
echo  ========================================
echo   הועלה בהצלחה!
echo  ========================================
if not "!GHUSER!"=="" (
    echo   https://github.com/!GHUSER!/%REPO_NAME%
) else (
    echo   https://github.com/YOUR-USER/%REPO_NAME%
)
echo.
echo   Vercel: Settings ^> Git ^> Connect ^> %REPO_NAME%
echo.
pause
exit /b 0
