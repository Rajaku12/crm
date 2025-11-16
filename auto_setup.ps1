# Auto setup script - Opens GitHub to create repo, then pushes code
$repoName = "Devreal_state"
$username = "Rajaku12"
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " GitHub Repository Auto-Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Open GitHub to create repository
Write-Host "Step 1: Opening GitHub to create repository..." -ForegroundColor Green
Write-Host "Repository will be created at: https://github.com/new" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please:" -ForegroundColor Yellow
Write-Host "1. Repository name: $repoName" -ForegroundColor White
Write-Host "2. Description: Real Estate CRM System" -ForegroundColor White
Write-Host "3. Choose Public or Private" -ForegroundColor White
Write-Host "4. DO NOT check any boxes (README, .gitignore, license)" -ForegroundColor White
Write-Host "5. Click 'Create repository'" -ForegroundColor White
Write-Host ""

# Open browser
Start-Process "https://github.com/new"

Write-Host "Waiting 30 seconds for you to create the repository..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Step 2: Configure and push
Write-Host ""
Write-Host "Step 2: Configuring git and pushing code..." -ForegroundColor Green

# Remove old remote if different
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote -and $existingRemote -ne $repoUrl) {
    git remote remove origin
}

# Add remote
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote set-url origin $repoUrl
}

# Ensure main branch
git branch -M main 2>$null

# Push
Write-Host "Pushing code..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code is now on GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/$username/$repoName" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. This might be because:" -ForegroundColor Red
    Write-Host "1. Repository not created yet - wait a moment and try again" -ForegroundColor Yellow
    Write-Host "2. Authentication needed - you'll be prompted for credentials" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "If prompted for credentials:" -ForegroundColor Cyan
    Write-Host "  Username: $username" -ForegroundColor White
    Write-Host "  Password: Use a Personal Access Token (not your password)" -ForegroundColor White
    Write-Host "  Get token: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run manually:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
}

