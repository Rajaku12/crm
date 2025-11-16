@echo off
echo ========================================
echo  Zenith Estate CRM - Starting Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Zenith CRM - Backend" cmd /k "cd /d %~dp0backend && python manage.py runserver 127.0.0.1:8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server...
start "Zenith CRM - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:3000
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause

