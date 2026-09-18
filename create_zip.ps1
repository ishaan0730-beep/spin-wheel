$src = "C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app"
$dest1 = "C:\Users\ishaa\Desktop\spin-wheel-files.zip"
$dest2 = "C:\Users\ishaa\OneDrive\Desktop\spin-wheel-files.zip"
$dest3 = "C:\Users\ishaa\Downloads\spin-wheel-files.zip"

$files = Get-ChildItem -Path $src -Exclude ".git", "spin-wheel-files.zip", "test_*", "create_zip.ps1", "copy_zip.ps1"
Compress-Archive -Path $files.FullName -DestinationPath $dest2 -Force
Copy-Item -Path $dest2 -Destination $dest1 -Force -ErrorAction SilentlyContinue
Copy-Item -Path $dest2 -Destination $dest3 -Force -ErrorAction SilentlyContinue
Copy-Item -Path $dest2 -Destination (Join-Path $src "spin-wheel-files.zip") -Force

Write-Host "Updated ZIP files without mobile triggers."
