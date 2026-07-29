@echo off
setlocal
set "APP_DIR=%~dp0"
set "APP_URL=http://localhost:8775/"
set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"

REM Start the private app server only when the app is not already available.
"%POWERSHELL_EXE%" -NoProfile -Command "try { $page = Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($page.Content -match 'SHEAR-ATMOS') { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  if not exist "%NODE_EXE%" (
    echo SHEAR-ATMOS needs Node.js to start its private local app service.
    echo Install the current LTS version from https://nodejs.org/ and run this launcher again.
    pause
    exit /b 1
  )
  start "SHEAR-ATMOS Server" /min "%NODE_EXE%" "%APP_DIR%app-server.mjs"
)

REM Wait briefly for the server before opening the app window.
for /L %%I in (1,1,8) do (
  "%POWERSHELL_EXE%" -NoProfile -Command "try { $page = Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1; if ($page.Content -match 'SHEAR-ATMOS') { exit 0 } } catch {}; exit 1"
  if not errorlevel 1 goto :openApp
  timeout /t 1 /nobreak >nul
)

echo SHEAR-ATMOS could not start its local app service.
echo Close any old SHEAR-ATMOS server windows, then try again.
pause
exit /b 1

:openApp

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%EDGE%" (
  start "SHEAR-ATMOS" "%EDGE%" --app="%APP_URL%"
) else (
  start "SHEAR-ATMOS" "%APP_URL%"
)
