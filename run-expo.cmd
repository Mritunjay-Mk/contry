@echo off
cd /d "%~dp0"
set EXPO_OFFLINE=1
set EXPO_HOME=%~dp0.expo-home
set EXPO_NO_TELEMETRY=1
set RCT_METRO_PORT=8081
if not exist "%EXPO_HOME%" mkdir "%EXPO_HOME%"
"C:\Users\pc24\AppData\Roaming\nvm\v20.20.2\node.exe" "node_modules\expo\bin\cli" start --localhost --max-workers 1 > expo-start.log 2>&1
