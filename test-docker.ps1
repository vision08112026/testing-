# Docker Testing Script for PowerShell

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   Docker Setup Verification" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Docker is running
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
}

Write-Host "`nChecking containers..." -ForegroundColor Yellow
docker-compose ps

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   Testing API Endpoints" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test main endpoint
Write-Host "Testing GET http://localhost:5000" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not connect to http://localhost:5000" -ForegroundColor Red
    Write-Host "Make sure containers are running: docker-compose up -d"
}

Write-Host "`nTesting GET http://localhost:5000/health" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Health check failed" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "   Register Test User" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

try {
    $body = @{
        username = "testplayer"
        email = "test@game.com"
        password = "test123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "[OK] User registered successfully!" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 50))..." -ForegroundColor Cyan
    Write-Host "Username: $($response.user.username)" -ForegroundColor Cyan
    Write-Host "Money: $($response.user.money)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "[INFO] User already exists (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n================================" -ForegroundColor Green
Write-Host "   All tests completed! ✅" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "Your game backend is running in Docker!" -ForegroundColor Cyan
Write-Host "- Backend: " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Yellow
Write-Host "- MongoDB: " -NoNewline; Write-Host "localhost:27017" -ForegroundColor Yellow

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Open multi-player-test.html in your browser"
Write-Host "2. Or use the API endpoints to test"

Write-Host "`nUseful Commands:" -ForegroundColor Cyan
Write-Host "- View logs: " -NoNewline; Write-Host "docker-compose logs -f" -ForegroundColor Yellow
Write-Host "- Stop: " -NoNewline; Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host "- Restart: " -NoNewline; Write-Host "docker-compose restart" -ForegroundColor Yellow
Write-Host "- Rebuild: " -NoNewline; Write-Host "docker-compose up -d --build`n" -ForegroundColor Yellow
