@echo off
setlocal

set "APP_NAME=Functional Batch Interface"
set "APP_URL=http://127.0.0.1:5000"
set "BACKEND_DIR=%~dp0functional-batch-web\backend"

title %APP_NAME%
echo Starting %APP_NAME%...
echo.

if not exist "%BACKEND_DIR%\server.js" (
  echo Could not find the backend folder:
  echo %BACKEND_DIR%
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not available in PATH.
  echo Install Node.js, then run this launcher again.
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm.cmd is not available in PATH.
  echo Reinstall Node.js, then run this launcher again.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $client = [Net.Sockets.TcpClient]::new(); $client.Connect('127.0.0.1', 27017); $client.Close(); exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo MongoDB is not reachable on 127.0.0.1:27017.
  echo.
  echo If MongoDB is installed as a Windows service, start it with:
  echo   net start MongoDB
  echo.
  echo Then run this launcher again.
  echo.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\node_modules" (
  echo Installing backend dependencies...
  pushd "%BACKEND_DIR%"
  call npm.cmd install
  if errorlevel 1 (
    popd
    echo.
    echo Dependency install failed.
    pause
    exit /b 1
  )
  popd
  echo.
)

echo Opening %APP_URL% ...
start "" "%APP_URL%"
echo.
echo Backend logs:
echo ----------------------------------------

cd /d "%BACKEND_DIR%"
call npm.cmd start

echo.
echo The backend stopped.
pause
