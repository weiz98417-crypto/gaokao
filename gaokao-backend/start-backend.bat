@echo off
chcp 936 >nul 2>&1
setlocal EnableDelayedExpansion

:: Gaokao Backend Startup Script
:: Double-click to start PostgreSQL and backend service

set "SCRIPT_DIR=%~dp0"
set "PG_DIR=%SCRIPT_DIR%.postgres\pgsql"
set "PG_CTL=%PG_DIR%\bin\pg_ctl.exe"
set "PGDATA=C:\gaokao-pgdata"
set "PG_LOG=%SCRIPT_DIR%.postgres\pg.log"
set "BACKEND_PORT=3000"
set "PG_PORT=5432"

echo ==========================================
echo   Gaokao APP - Backend Startup Script
echo ==========================================
echo.

if not exist "%PG_CTL%" (
  echo [ERROR] PostgreSQL ctl not found: %PG_CTL%
  echo Please run init-postgres.bat first.
  pause
  exit /b 1
)

if not exist "%PGDATA%" (
  echo [ERROR] PostgreSQL data dir not found: %PGDATA%
  echo Please run init-postgres.bat first.
  pause
  exit /b 1
)

netstat -ano | findstr ":%BACKEND_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
  echo [WARN] Port %BACKEND_PORT% is already in use.
  echo Please stop the existing backend or run stop-backend.bat first.
  pause
  exit /b 1
)

echo [1/3] Checking PostgreSQL status...

:: Check if another PostgreSQL instance is already listening on port 5432.
netstat -ano | findstr ":%PG_PORT%" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
  "%PG_CTL%" -D "%PGDATA%" status >nul 2>&1
  if !errorlevel! equ 0 (
    echo PostgreSQL is already running with this data directory.
  ) else (
    echo [WARN] Port %PG_PORT% is already in use by another PostgreSQL instance.
    echo Please stop the other PostgreSQL or change PGPORT in start-backend.bat.
    pause
    exit /b 1
  )
) else (
  "%PG_CTL%" -D "%PGDATA%" status >nul 2>&1
  if !errorlevel! equ 0 (
    echo PostgreSQL is already running.
  ) else (
    echo [2/3] Starting PostgreSQL...
    "%PG_CTL%" -D "%PGDATA%" -l "%PG_LOG%" start
    if !errorlevel! neq 0 (
      echo [ERROR] Failed to start PostgreSQL. Check log: %PG_LOG%
      pause
      exit /b 1
    )
    echo Waiting for PostgreSQL ready...
    timeout /t 2 /nobreak >nul
  )
)

echo [3/3] Starting backend service (USE_DATABASE=true)...
echo Backend will listen on http://localhost:%BACKEND_PORT%
echo Press Ctrl+C to stop.
echo.
cd /d "%SCRIPT_DIR%"
call npm run dev

if %errorlevel% neq 0 (
  echo.
  echo [ERROR] Backend exited with code: %errorlevel%
  pause
)

endlocal
