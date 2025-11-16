# Check Python Installation Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Python Installation Checker" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pythonFound = $false
$pipFound = $false

# Check for python
Write-Host "Checking for Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $pythonVersion -match "Python") {
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
        $pythonFound = $true
    }
} catch {
    Write-Host "❌ Python not found" -ForegroundColor Red
}

# Check for py launcher
if (-not $pythonFound) {
    Write-Host "Checking for Python launcher (py)..." -ForegroundColor Yellow
    try {
        $pyVersion = py --version 2>&1
        if ($LASTEXITCODE -eq 0 -or $pyVersion -match "Python") {
            Write-Host "✅ Python launcher found: $pyVersion" -ForegroundColor Green
            Write-Host "You can use 'py' instead of 'python'" -ForegroundColor Yellow
            $pythonFound = $true
        }
    } catch {
        Write-Host "❌ Python launcher not found" -ForegroundColor Red
    }
}

# Check for pip
Write-Host ""
Write-Host "Checking for pip..." -ForegroundColor Yellow
try {
    $pipVersion = pip --version 2>&1
    if ($LASTEXITCODE -eq 0 -or $pipVersion -match "pip") {
        Write-Host "✅ pip found: $pipVersion" -ForegroundColor Green
        $pipFound = $true
    }
} catch {
    Write-Host "❌ pip not found" -ForegroundColor Red
}

# Check for python3
if (-not $pythonFound) {
    Write-Host ""
    Write-Host "Checking for python3..." -ForegroundColor Yellow
    try {
        $python3Version = python3 --version 2>&1
        if ($LASTEXITCODE -eq 0 -or $python3Version -match "Python") {
            Write-Host "✅ python3 found: $python3Version" -ForegroundColor Green
            $pythonFound = $true
        }
    } catch {
        Write-Host "❌ python3 not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if (-not $pythonFound) {
    Write-Host ""
    Write-Host "❌ Python is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "2. Download Python 3.11 or later" -ForegroundColor White
    Write-Host "3. During installation, CHECK 'Add Python to PATH'" -ForegroundColor White
    Write-Host "4. Close and reopen PowerShell after installation" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Microsoft Store:" -ForegroundColor Yellow
    Write-Host "1. Open Microsoft Store" -ForegroundColor White
    Write-Host "2. Search for 'Python 3.11'" -ForegroundColor White
    Write-Host "3. Click Install" -ForegroundColor White
    Write-Host ""
    Write-Host "See INSTALL_PYTHON_WINDOWS.md for detailed instructions" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ Python is installed!" -ForegroundColor Green
    if (-not $pipFound) {
        Write-Host "⚠️  pip not found, but Python is installed" -ForegroundColor Yellow
        Write-Host "This might work anyway. Try running the setup script." -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "You can now run: .\run_local.ps1" -ForegroundColor Green
}

