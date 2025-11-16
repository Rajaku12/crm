@echo off
echo Starting Zenith Estate CRM Server...
echo.
cd /d "%~dp0"
echo Running migrations...
python manage.py migrate --noinput
echo.
echo Starting server on http://127.0.0.1:8000
echo Press Ctrl+C to stop the server
echo.
python manage.py runserver 127.0.0.1:8000
pause
