@echo off
echo ========================================
echo MySQL Database Setup for Zenith CRM
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file first.
    pause
    exit /b 1
)

echo Step 1: Checking MySQL connection...
echo.
python -c "import mysql.connector; print('MySQL connector available')" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing MySQL connector...
    pip install mysql-connector-python
)

echo.
echo Step 2: Creating database and running migrations...
echo.
python setup_mysql.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Setup failed!
    echo Please check:
    echo   1. MySQL server is running
    echo   2. DB_PASSWORD in .env file is correct
    echo   3. MySQL user has CREATE DATABASE privilege
    echo.
    pause
    exit /b 1
)

echo.
echo Step 3: Creating admin user...
echo.
echo You will be prompted to create a superuser.
echo Use these credentials:
echo   Username: admin
echo   Email: admin@zenith.com
echo   Password: admin123
echo.
python manage.py createsuperuser --noinput --username admin --email admin@zenith.com 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Creating admin user manually...
    python manage.py shell -c "from api.models import Agent; Agent.objects.filter(username='admin').exists() or Agent.objects.create_superuser('admin', 'admin@zenith.com', 'admin123', first_name='Admin', last_name='User', role='Admin')"
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause
