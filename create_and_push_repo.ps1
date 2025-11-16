# PowerShell script to create GitHub repository and push code automatically
param(
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

$repoName = "Devreal_state"
$username = "Rajaku12"
$repoUrl = "https://github.com/$username/$repoName.git"
$apiUrl = "https://api.github.com/user/repos"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Auto-Create GitHub Repository & Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository Name: $repoName" -ForegroundColor Yellow
Write-Host "GitHub Username: $username" -ForegroundColor Yellow
Write-Host ""

# Get GitHub token
if (-not $GitHubToken) {
    Write-Host "GitHub token not found." -ForegroundColor Yellow
    Write-Host "Please enter your GitHub Personal Access Token:" -ForegroundColor Yellow
    Write-Host "(Create one at: https://github.com/settings/tokens)" -ForegroundColor Gray
    Write-Host ""
    $secureToken = Read-Host "Token" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $GitHubToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if (-not $GitHubToken) {
    Write-Host "Error: GitHub token is required." -ForegroundColor Red
    Write-Host "Get a token from: https://github.com/settings/tokens" -ForegroundColor Yellow
    exit 1
}

# Create repository using GitHub API
Write-Host "Step 1: Creating repository on GitHub..." -ForegroundColor Green

$repoData = @{
    name = $repoName
    description = "Real Estate CRM System with Full Integration Support"
    private = $false
    auto_init = $false
} | ConvertTo-Json

$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell"
}

$repoCreated = $false
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $repoData -ContentType "application/json"
    Write-Host "Repository created successfully!" -ForegroundColor Green
    Write-Host "Repository URL: $($response.html_url)" -ForegroundColor Cyan
    $repoCreated = $true
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }
    
    if ($statusCode -eq 422) {
        Write-Host "Repository might already exist. Checking..." -ForegroundColor Yellow
        $checkUrl = "https://api.github.com/repos/$username/$repoName"
        try {
            $checkResponse = Invoke-RestMethod -Uri $checkUrl -Method Get -Headers $headers
            Write-Host "Repository already exists!" -ForegroundColor Green
            $repoCreated = $true
        } catch {
            Write-Host "Error: Could not verify repository." -ForegroundColor Red
            exit 1
        }
    } elseif ($statusCode -eq 401) {
        Write-Host "Error: Authentication failed. Check your token." -ForegroundColor Red
        exit 1
    } else {
        Write-Host "Error creating repository: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

if (-not $repoCreated) {
    Write-Host "Failed to create or verify repository." -ForegroundColor Red
    exit 1
}

# Wait for GitHub to process
Start-Sleep -Seconds 2

# Step 2: Configure git remote
Write-Host ""
Write-Host "Step 2: Configuring git remote..." -ForegroundColor Green

$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    if ($existingRemote -ne $repoUrl) {
        git remote remove origin
        git remote add origin $repoUrl
        Write-Host "Remote updated!" -ForegroundColor Green
    } else {
        Write-Host "Remote already configured." -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    Write-Host "Remote added!" -ForegroundColor Green
}

# Step 3: Push code
Write-Host ""
Write-Host "Step 3: Pushing code to GitHub..." -ForegroundColor Green

git branch -M main 2>$null

# Configure credential helper for token
$credentialHelper = git config --global credential.helper
if (-not $credentialHelper) {
    git config --global credential.helper store
}

# Push with token in URL (temporary)
$pushUrl = "https://$GitHubToken@github.com/$username/$repoName.git"
git remote set-url origin $pushUrl

try {
    git push -u origin main 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host " SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Code pushed to: https://github.com/$username/$repoName" -ForegroundColor Cyan
        Write-Host ""
        
        # Reset remote URL to remove token
        git remote set-url origin $repoUrl
    } else {
        Write-Host "Push may have issues. Check output above." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error during push: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to push manually: git push -u origin main" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
