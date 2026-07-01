@echo off
setlocal
cd /d "%~dp0"
echo Starting The Secret Place locally...
echo.
if not exist node_modules (
  echo Installing dependencies...
  call "C:\Program Files\nodejs\npm.cmd" install
  if errorlevel 1 exit /b %errorlevel%
)
call "C:\Program Files\nodejs\npm.cmd" run build:web
if errorlevel 1 exit /b %errorlevel%
echo.
echo Open http://127.0.0.1:4173 in your browser.
echo Press Ctrl+C to stop the local app.
call "C:\Program Files\nodejs\npm.cmd" run preview
