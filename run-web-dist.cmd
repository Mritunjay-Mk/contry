@echo off
cd /d "%~dp0"
"C:\Users\pc24\AppData\Roaming\nvm\v20.20.2\node.exe" "serve-dist.js" > web-dist.log 2>&1
