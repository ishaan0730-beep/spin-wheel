$desktop = [Environment]::GetFolderPath('Desktop')
$target = 'C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app\start_server.bat'
$shortcutPath = Join-Path $desktop 'Lucky Hourly Spin.lnk'

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = 'C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app'
$shortcut.Description = 'Start Lucky Hourly Spin Server & Open App'
$shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $shortcutPath" -ForegroundColor Green
