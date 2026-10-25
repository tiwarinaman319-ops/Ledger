@echo off
echo ===================================================
echo   Compiling and Launching Ledger Java HTTP Server  
echo ===================================================
javac Server.java
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed. Please ensure JDK 21+ is installed.
    pause
    exit /b %ERRORLEVEL%
)
echo Starting server on http://localhost:8080 ...
java Server
pause
