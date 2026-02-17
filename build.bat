@echo off
chcp 65001 >nul
setlocal

echo ╔═══════════════════════════════════════════════╗
echo ║    Percentage Lab Build Script                ║
echo ║    Zaen ALabden Moustafa                      ║
echo ╚═══════════════════════════════════════════════╝
echo.

set NODE_ENV=production

echo 📦 Installing dependencies...
call npm install

echo.
echo 🖥️ Building Windows application...
call npm run build:win

echo.
echo 📁 Creating distribution package...
if not exist "distribute" mkdir distribute
if exist "dist\win-unpacked" (
    xcopy "dist\win-unpacked" "distribute\Percentage-Lab-Windows" /E /I /Y
    ren "distribute\Percentage-Lab-Windows\math-percentage-lab.exe" "Percentage-Lab.exe"
)

echo ✅ Build complete!
echo 📂 Folder: Percentage-Lab-Windows
echo 🚀 Run Percentage-Lab.exe
echo.
pause