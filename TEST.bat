@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   ספין זוגי - בדיקת מערכת מקיפה
echo ========================================
echo.
call npm run test:system
echo.
if %ERRORLEVEL% EQU 0 (
  echo הבדיקה הושלמה בהצלחה.
) else (
  echo הבדיקה נכשלה. ראה פירוט למעלה.
)
echo.
pause
