# PowerShell script to create GitHub repository and push code
# Usage: .\create_github_repo.ps1

$repoName = "Devreal_state"
$username = "Rajaku12"
$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Creating GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository Name: $repoName" -ForegroundColor Yellow
Write-Host "GitHub Username: $username" -ForegroundColor Yellow
Write-Host "Repository URL: $repoUrl" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create repository on GitHub
Write-Host "Step 1: Create repository on GitHub" -ForegroundColor Green
Write-Host "Please follow these steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: $repoName" -ForegroundColor White
Write-Host "3. Description: Real Estate CRM System with Full Integration Support" -ForegroundColor White
Write-Host "4. Choose Public or Private" -ForegroundColor White
Write-Host "5. DO NOT initialize with README, .gitignore, or license" -ForegroundColor White
Write-Host "6. Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "Press any key after you have created the repository..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 2: Add remote and push
Write-Host ""
Write-Host "Step 2: Setting up remote and pushing code..." -ForegroundColor Green

# Add remote
Write-Host "Adding remote origin..." -ForegroundColor Yellow
git remote add origin $repoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote added successfully!" -ForegroundColor Green
} else {
    Write-Host "Error adding remote. It might already exist." -ForegroundColor Red
    Write-Host "Removing existing remote and re-adding..." -ForegroundColor Yellow
    git remote remove origin
    git remote add origin $repoUrl
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code has been pushed to:" -ForegroundColor Cyan
    Write-Host $repoUrl -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host " ERROR!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed to push to GitHub. Possible reasons:" -ForegroundColor Yellow
    Write-Host "1. Repository not created yet" -ForegroundColor White
    Write-Host "2. Authentication required (GitHub credentials)" -ForegroundColor White
    Write-Host "3. Network issues" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual push command:" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor White
    Write-Host ""
}

