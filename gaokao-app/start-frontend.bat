@echo off
chcp 936 >nul 2>&1
setlocal EnableDelayedExpansion

:: Gaokao Frontend Startup Script
:: Double-click to start frontend dev server

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_PORT=5173"

echo ==========================================
echo   Gaokao APP - Frontend Startup Script
echo ==========================================
echo.

netstat -ano | findstr ":%FRONTEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
  echo [WARN] Port %FRONTEND_PORT% is already in use.
  echo Frontend may already be running.
  pause
  exit /b 1
)

echo Starting frontend dev server...
echo Frontend will be available at http://localhost:%FRONTEND_PORT%
echo Press Ctrl+C to stop, or run stop-frontend.bat to clean up.
echo.
cd /d "%SCRIPT_DIR%"
call npm run dev

if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Frontend exited with code: %errorlevel%
  pause
)

endlocal
