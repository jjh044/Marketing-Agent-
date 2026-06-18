@echo off
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" node_modules\tsx\dist\cli.mjs src\dashboard.ts
