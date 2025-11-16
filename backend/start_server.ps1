# PowerShell script to start Django server
Write-Host "Starting Zenith Estate CRM Server..." -ForegroundColor Green
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
python --version
Write-Host ""

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput
Write-Host ""

# Start server
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python manage.py runserver 0.0.0.0:8000

