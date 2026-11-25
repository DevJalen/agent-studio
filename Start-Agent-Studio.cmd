@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0..\.tools\vite-plus\bin\vp.exe" (
  set "VP_HOME=%~dp0..\.tools\vite-plus"
  set "PATH=%~dp0..\.tools\vite-plus\bin;%PATH%"
)
where vp >nul 2>nul
if errorlevel 1 (
  echo Install Vite+ first. See docs/user/agent-studio.md.
  pause
  exit /b 1
)
echo.
echo Agent Studio
echo 1. Open Agent Studio in a browser
echo 2. Connect Claude Account 1
echo 3. Connect Claude Account 2
echo 4. Open Agent Studio desktop window
choice /C 1234 /N /M "Choose 1, 2, 3 or 4: "
if errorlevel 4 goto desktop
if errorlevel 3 goto claude2
if errorlevel 2 goto claude1
vp run studio
goto done
:claude1
vp run studio --login-claude-1
goto done
:claude2
vp run studio --login-claude-2
goto done
:desktop
vp run studio:desktop
:done
if errorlevel 1 pause
