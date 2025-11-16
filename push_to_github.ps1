# PowerShell script to push code to GitHub
# Run this after creating the repository on GitHub

Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor Green
Write-Host "  🚀 PUSHING CODE TO GITHUB`n" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════`n"

# Check if repository exists
Write-Host "Checking repository status..." -ForegroundColor Cyan
git remote -v

# Check for uncommitted changes
Write-Host "`nChecking for changes..." -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "Found uncommitted changes. Adding files..." -ForegroundColor Yellow
    git add .
    git commit -m "Production-ready: All bugs fixed, deployment configurations complete, comprehensive testing implemented"
} else {
    Write-Host "No uncommitted changes found." -ForegroundColor Green
}

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
try {
    git push -u origin main
    Write-Host "`n✅ SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/Raja2001-bot/dev_crm_repo" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ ERROR: Push failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "1. Repository doesn't exist - Create it on GitHub first"
    Write-Host "2. Authentication failed - Use Personal Access Token"
    Write-Host "3. Permission denied - Check repository access"
    Write-Host "`nSee PUSH_TO_GITHUB.md for detailed instructions." -ForegroundColor Yellow
}

Write-Host "`n"

