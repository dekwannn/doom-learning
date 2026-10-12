@echo off
rem Lingo's voice server (Kokoro). First run: creates a Python environment and downloads the voice (~350 MB).
cd /d "%~dp0"
rem Keep pip's temporary files next to this script (the system drive may be full)
if not exist ".tmp" mkdir .tmp
set "TEMP=%~dp0.tmp"
set "TMP=%~dp0.tmp"
set PIP_NO_CACHE_DIR=1

if not exist ".venv\Scripts\python.exe" (
  echo Menyiapkan Python environment...
  python -m venv .venv || goto :error
  ".venv\Scripts\python.exe" -m pip install --quiet --upgrade pip
  ".venv\Scripts\python.exe" -m pip install --quiet -r requirements.txt || goto :error
)

if not exist "models" mkdir models
set RELEASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
if not exist "models\kokoro-v1.0.onnx" (
  echo Mengunduh model suara Kokoro ^(325 MB^)...
  curl -L --fail -o "models\kokoro-v1.0.onnx" "%RELEASE%/kokoro-v1.0.onnx" || goto :error
)
if not exist "models\voices-v1.0.bin" (
  echo Mengunduh daftar suara ^(28 MB^)...
  curl -L --fail -o "models\voices-v1.0.bin" "%RELEASE%/voices-v1.0.bin" || goto :error
)

".venv\Scripts\python.exe" server.py
goto :eof

:error
echo.
echo Gagal menyiapkan server suara Lingo. Lihat pesan di atas.
pause
