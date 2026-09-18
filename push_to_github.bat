@echo off
title Push Lucky Spin Wheel to GitHub
cd /d "%~dp0"

echo =======================================================
echo   Pushing Lucky Hourly Spin to GitHub...
echo   Repository: https://github.com/ishaan0730-beep/spin-wheel.git
echo =======================================================
echo.

set "GIT_PATH=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"

if exist "%GIT_PATH%" (
    set "GIT_CMD=%GIT_PATH%"
) else (
    set "GIT_CMD=git"
)

"%GIT_CMD%" remote remove origin 2>nul
"%GIT_CMD%" remote add origin https://github.com/ishaan0730-beep/spin-wheel.git
"%GIT_CMD%" branch -M main
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "Lucky Hourly Spin - 10-Slot Real-Time Multi-Device Wheel" 2>nul

echo Pushing main branch to GitHub...
"%GIT_CMD%" push -u --force origin main

echo.
echo =======================================================
if %ERRORLEVEL% EQU 0 (
    echo   SUCCESS! Your project is now live on GitHub!
    echo   URL: https://github.com/ishaan0730-beep/spin-wheel
) else (
    echo   If prompted, sign in with your GitHub account or Personal Access Token.
)
echo =======================================================
echo.
pause
