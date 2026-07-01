$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Starting The Secret Place locally..." -ForegroundColor Green

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  & "C:\Program Files\nodejs\npm.cmd" install
}

& "C:\Program Files\nodejs\npm.cmd" run build:web

Write-Host ""
Write-Host "Open http://127.0.0.1:4173 in your browser." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the local app."
& "C:\Program Files\nodejs\npm.cmd" run preview
