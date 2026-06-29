@echo off
chcp 936 >nul 2>&1
setlocal EnableDelayedExpansion

:: Gaokao PostgreSQL Initialization Script
:: Run once to create PostgreSQL data directory

set "SCRIPT_DIR=%~dp0"
set "PG_DIR=%SCRIPT_DIR%.postgres\pgsql"
set "INITDB=%PG_DIR%\bin\initdb.exe"
set "CREATEDB=%PG_DIR%\bin\createdb.exe"
set "PG_CTL=%PG_DIR%\bin\pg_ctl.exe"
set "PGDATA=C:\gaokao-pgdata"
set "PG_LOG=%SCRIPT_DIR%.postgres\pg.log"

echo ==========================================
echo   Gaokao APP - PostgreSQL Init Script
echo ==========================================
echo.

if not exist "%INITDB%" (
  echo [ERROR] initdb not found: %INITDB%
  echo Please download PostgreSQL 16 Windows binaries and extract to .postgres\pgsql
  pause
  exit /b 1
)

if exist "%PGDATA%" (
  echo [WARN] Data directory already exists: %PGDATA%
  set /p OVERWRITE="Delete and reinitialize? (y/N) "
  if /i "!OVERWRITE!"=="y" (
    echo Stopping existing PostgreSQL if running...
    if exist "%PG_CTL%" (
      "%PG_CTL%" -D "%PGDATA%" stop >nul 2>&1
    )
    echo Deleting existing data directory...
    rmdir /s /q "%PGDATA%"
    if exist "%PGDATA%" (
      echo [ERROR] Failed to delete data directory: %PGDATA%
      pause
      exit /b 1
    )
  ) else (
    echo Initialization cancelled.
    pause
    exit /b 0
  )
)

echo [1/3] Initializing PostgreSQL data directory with UTF8...

:: Try Chinese locale first to support Chinese data correctly.
"%INITDB%" -U gaokao -A trust --locale=Chinese_China.936 -E UTF8 -D "%PGDATA%"
if !errorlevel! neq 0 (
  echo [WARN] Chinese locale failed, falling back to --locale=C.
  if exist "%PGDATA%" rmdir /s /q "%PGDATA%"
  "%INITDB%" -U gaokao -A trust --locale=C -E UTF8 -D "%PGDATA%"
  if !errorlevel! neq 0 (
    echo [ERROR] initdb failed with fallback locale.
    pause
    exit /b 1
  )
)

echo [2/3] Starting PostgreSQL...
"%PG_CTL%" -D "%PGDATA%" -l "%PG_LOG%" start
if !errorlevel! neq 0 (
  echo [ERROR] Failed to start PostgreSQL. Check log: %PG_LOG%
  pause
  exit /b 1
)
timeout /t 2 /nobreak >nul

echo [3/3] Creating gaokao database...
"%CREATEDB%" -U gaokao gaokao
if !errorlevel! neq 0 (
  echo [ERROR] Failed to create database.
  pause
  exit /b 1
)

echo.
echo [OK] Initialization complete.
echo You can now run start-backend.bat to start the backend.
pause
endlocal
