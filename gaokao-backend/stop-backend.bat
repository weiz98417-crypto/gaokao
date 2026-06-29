@echo off
chcp 936 >nul 2>&1
setlocal EnableDelayedExpansion

:: Gaokao Backend Stop Script
:: Stops the backend node process and local PostgreSQL

set "SCRIPT_DIR=%~dp0"
set "PG_DIR=%SCRIPT_DIR%.postgres\pgsql"
set "PG_CTL=%PG_DIR%\bin\pg_ctl.exe"
set "PGDATA=C:\gaokao-pgdata"
set "BACKEND_PORT=3000"

echo ==========================================
echo   Gaokao APP - Backend Stop Script
echo ==========================================
echo.

set "BACKEND_RUNNING=0"
netstat -ano | findstr ":%BACKEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 set "BACKEND_RUNNING=1"

if %BACKEND_RUNNING% equ 1 (
  echo [1/2] Stopping backend node process on port %BACKEND_PORT%...
  :: Sentinel 0 is not a real user PID and prevents empty-set issues.
  set "KILLED_PIDS=0"
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT%" ^| findstr "LISTENING"') do (
    set "SKIP=0"
    for %%p in (!KILLED_PIDS!) do if "%%p"=="%%a" set "SKIP=1"
    if !SKIP! equ 0 (
      taskkill /PID %%a /F >nul 2>&1
      set "TASKKILL_RESULT=!errorlevel!"
      if !TASKKILL_RESULT! equ 0 (
        echo Backend stopped (PID %%a^).
      ) else (
        echo [WARN] Failed to stop backend (PID %%a^): taskkill returned !TASKKILL_RESULT!.
      )
      set "KILLED_PIDS=!KILLED_PIDS! %%a"
    )
  )
) else (
  echo [1/2] Backend is not running on port %BACKEND_PORT%.
)

if exist "%PG_CTL%" (
  echo [2/2] Stopping PostgreSQL...
  "%PG_CTL%" -D "%PGDATA%" stop >nul 2>&1
  set "PGCTL_RESULT=!errorlevel!"
  if !PGCTL_RESULT! equ 0 (
    echo PostgreSQL stopped.
  ) else (
    echo [WARN] Failed to stop PostgreSQL: pg_ctl stop returned !PGCTL_RESULT!.
    echo PostgreSQL may not be running or already stopped.
  )
) else (
  echo [2/2] PostgreSQL ctl not found, skipping.
)

echo.
echo Done.
pause
endlocal
