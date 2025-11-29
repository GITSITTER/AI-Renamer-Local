@echo off
echo ========================================
echo   AI Renamer - Build Script
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Building Windows installer...
echo This may take a few minutes...
echo.

call npm run build:win

echo.
echo ========================================
echo Build complete!
echo.
echo Find your installer in: gui\dist\
echo ========================================
pause

