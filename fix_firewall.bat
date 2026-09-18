@echo off
title Allow Lucky Spin in Windows Firewall
echo =========================================================
echo   Adding Windows Firewall rule for Port 8080...
echo =========================================================
netsh advfirewall firewall delete rule name="LuckySpin8080" >nul 2>&1
netsh advfirewall firewall add rule name="LuckySpin8080" dir=in action=allow protocol=TCP localport=8080 profile=any
echo.
echo =========================================================
echo   SUCCESS! Windows Firewall has allowed Port 8080.
echo   Your mobile phone can now connect!
echo =========================================================
pause
