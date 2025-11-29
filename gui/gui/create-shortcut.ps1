# Create Desktop Shortcut for AI Renamer
# Run this script with: powershell -ExecutionPolicy Bypass -File create-shortcut.ps1

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\AI Renamer.lnk")
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/c cd /d `"$PSScriptRoot`" && npm start"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "AI File Renamer - Rename files using local AI"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "You can now launch AI Renamer from your desktop."

