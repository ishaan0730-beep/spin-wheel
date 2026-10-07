$src = "C:\Users\ishaa\.gemini\antigravity-ide\scratch\spin-wheel-app"
$dest1 = "C:\Users\ishaa\Desktop\spin-wheel-files.zip"
$dest2 = "C:\Users\ishaa\OneDrive\Desktop\spin-wheel-files.zip"
$dest3 = "C:\Users\ishaa\Downloads\spin-wheel-files.zip"
$folderDest = "C:\Users\ishaa\Downloads\spin-wheel-files"

$files = Get-ChildItem -Path $src -Exclude ".git", "spin-wheel-files.zip", "test_*", "create_zip.ps1", "copy_zip.ps1"
Compress-Archive -Path $files.FullName -DestinationPath $dest3 -Force
Copy-Item -Path $dest3 -Destination $dest1 -Force -ErrorAction SilentlyContinue
Copy-Item -Path $dest3 -Destination $dest2 -Force -ErrorAction SilentlyContinue
Copy-Item -Path $dest3 -Destination (Join-Path $src "spin-wheel-files.zip") -Force

# Also sync all uncompressed files to Downloads folder
New-Item -ItemType Directory -Force -Path $folderDest | Out-Null
Copy-Item -Path (Join-Path $src "*") -Destination $folderDest -Recurse -Force -Exclude "spin-wheel-files.zip", "create_zip.ps1"

Write-Host "Updated ZIP and uncompressed files in Downloads successfully!"
