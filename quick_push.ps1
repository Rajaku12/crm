# Quick push script - Assumes repository already exists or will be created manually
$repoName = "Devreal_state"
$username = "Rajaku12"
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Push Code to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configure remote
Write-Host "Configuring remote..." -ForegroundColor Yellow
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote -and $existingRemote -ne $repoUrl) {
    git remote remove origin
}
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Remote already exists, continuing..." -ForegroundColor Yellow
}

# Ensure main branch
git branch -M main 2>$null

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "Repository: $repoUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "If repository doesn't exist, create it first at:" -ForegroundColor Yellow
Write-Host "https://github.com/new" -ForegroundColor White
Write-Host "Name: $repoName" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host "View at: https://github.com/$username/$repoName" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed. Possible reasons:" -ForegroundColor Red
    Write-Host "1. Repository doesn't exist - Create it at https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Authentication required - Use Personal Access Token" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create repository manually:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Repository name: $repoName" -ForegroundColor White
    Write-Host "3. Click 'Create repository'" -ForegroundColor White
    Write-Host "4. Then run this script again" -ForegroundColor White
}

