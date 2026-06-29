@echo off
chcp 936 >nul 2>&1
setlocal EnableDelayedExpansion

:: Gaokao Frontend Stop Script
:: Stops the frontend dev server on port 5173

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_PORT=5173"

echo ==========================================
echo   Gaokao APP - Frontend Stop Script
echo ==========================================
echo.

set "FRONTEND_RUNNING=0"
netstat -ano | findstr ":%FRONTEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 set "FRONTEND_RUNNING=1"

if %FRONTEND_RUNNING% equ 1 (
  echo Stopping frontend node process on port %FRONTEND_PORT%...
  :: Sentinel 0 is not a real user PID and prevents empty-set issues.
  set "KILLED_PIDS=0"
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT%" ^| findstr "LISTENING"') do (
    set "SKIP=0"
    for %%p in (!KILLED_PIDS!) do if "%%p"=="%%a" set "SKIP=1"
    if !SKIP! equ 0 (
      taskkill /PID %%a /F >nul 2>&1
      set "TASKKILL_RESULT=!errorlevel!"
      if !TASKKILL_RESULT! equ 0 (
        echo Frontend stopped (PID %%a^).
      ) else (
        echo [WARN] Failed to stop frontend (PID %%a^): taskkill returned !TASKKILL_RESULT!.
      )
      set "KILLED_PIDS=!KILLED_PIDS! %%a"
    )
  )
) else (
  echo Frontend is not running.
)

echo.
echo Done.
pause
endlocal
