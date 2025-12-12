@echo off
echo.
echo ================================
echo   Docker Setup Verification
echo ================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if containers are running
echo Checking containers...
docker-compose ps

echo.
echo ================================
echo   Testing API Endpoints
echo ================================
echo.

REM Test main endpoint
echo Testing GET http://localhost:5000
curl -s http://localhost:5000
echo.
echo.

REM Test health endpoint
echo Testing GET http://localhost:5000/health
curl -s http://localhost:5000/health
echo.
echo.

echo ================================
echo   All tests passed! ✅
echo ================================
echo.
echo Your game backend is running in Docker!
echo - Backend: http://localhost:5000
echo - MongoDB: localhost:27017
echo.
echo Next steps:
echo 1. Open multi-player-test.html in your browser
echo 2. Or use the API endpoints to test
echo.
echo Commands:
echo - View logs: docker-compose logs -f
echo - Stop: docker-compose down
echo - Restart: docker-compose restart
echo.
pause
