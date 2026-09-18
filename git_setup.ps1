$git = "C:\Users\ishaa\AppData\Local\Programs\Git\cmd\git.exe"

Remove-Item -Path "test_endpoints.ps1", "test_push.ps1", "install_git.ps1" -ErrorAction SilentlyContinue

& $git init
& $git config user.name "LuckySpinDeveloper"
& $git config user.email "developer@luckyspin.local"
& $git add -A
& $git commit -m "Initial commit: Lucky Hourly Spin - 10-Slot Real-Time Multi-Device Wheel"
& $git branch -M main
& $git log -n 1
& $git status
