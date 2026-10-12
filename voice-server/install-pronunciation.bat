@echo off
rem Turns on Lingo's pronunciation check (Whisper + phoneme model, ~1.5 GB of downloads). Run start.bat once first.
cd /d "%~dp0"
if not exist ".tmp" mkdir .tmp
set "TEMP=%~dp0.tmp"
set "TMP=%~dp0.tmp"
set PIP_NO_CACHE_DIR=1

if not exist ".venv\Scripts\python.exe" (
  echo Jalankan start.bat sekali dulu, lalu ulangi ini.
  pause
  goto :eof
)
echo Memasang fitur cek pengucapan ^(bisa beberapa menit^)...
".venv\Scripts\python.exe" -m pip install --quiet -r requirements-pronunciation.txt || goto :error
echo Selesai. Jalankan start.bat lagi; model cek pengucapan diunduh otomatis saat pertama kali.
pause
goto :eof

:error
echo.
echo Gagal memasang fitur cek pengucapan. Lihat pesan di atas.
pause
