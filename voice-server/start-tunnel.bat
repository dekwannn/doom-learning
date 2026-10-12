@echo off
rem Opens Lingo's voice server to the internet through ngrok, at your free static ngrok domain,
rem so phones and friends can hear Lingo's voice too. Run start.bat first (in its own window).
cd /d "%~dp0"

rem ngrok.exe: next to the repo in ..\..\tools\ngrok, or anywhere on PATH
set "NGROK=%~dp0..\..\tools\ngrok\ngrok.exe"
if not exist "%NGROK%" set "NGROK=ngrok"

rem Your static domain (from the ngrok dashboard → Domains), e.g. something.ngrok-free.app
if not exist "tunnel-domain.txt" (
  echo Tulis domain ngrok-mu di file voice-server\tunnel-domain.txt, misalnya: nama-kamu.ngrok-free.app
  pause
  goto :eof
)
set /p DOMAIN=<tunnel-domain.txt

rem The ngrok config (with your authtoken) lives here, not on the system drive
if not exist ".ngrok" mkdir .ngrok
"%NGROK%" http 8800 --url=https://%DOMAIN% --config "%~dp0.ngrok\ngrok.yml"
pause
