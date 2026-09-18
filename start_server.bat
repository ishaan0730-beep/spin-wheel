@echo off
title Lucky Hourly Spin - Universal Server
cd /d "%~dp0"

echo =======================================================
echo   Starting Lucky Hourly Spin Multi-Device Server...
echo =======================================================

:: Run native TCP server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
