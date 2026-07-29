@echo off
setlocal
set "SHEAR_APP_DIR=%~dp0"

REM Create a Desktop shortcut for the app-style launcher.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$shell = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $shortcut = $shell.CreateShortcut((Join-Path $desktop 'SHEAR-ATMOS V5.lnk')); $shortcut.TargetPath = Join-Path $env:SHEAR_APP_DIR 'Launch SHEAR-ATMOS.vbs'; $shortcut.WorkingDirectory = $env:SHEAR_APP_DIR; $shortcut.Description = 'SHEAR-ATMOS V5 storm environment dashboard'; $shortcut.Save()"

start "SHEAR-ATMOS" "%SHEAR_APP_DIR%Launch SHEAR-ATMOS.vbs"
echo.
echo SHEAR-ATMOS V5 has been added to your desktop and opened.
timeout /t 2 /nobreak >nul
