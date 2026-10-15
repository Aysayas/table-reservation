@echo off
REM ============================================================
REM  LavaLust Docker Template - one-click dev environment starter
REM  Double-click this file (or make a desktop shortcut to it) to:
REM    1. Make sure Docker Desktop is running
REM    2. Create .env and fill empty keys/passwords (init-env.ps1)
REM    3. Start the docker-compose stack (app, mysql, phpmyadmin)
REM    4. Run pending migrations
REM    5. Open the project in VS Code and the app in your browser
REM ============================================================

REM Always run from the folder this .bat file lives in, no matter
REM where it's double-clicked from.
cd /d "%~dp0"

echo.
echo === LavaLust Dev Environment ===
echo.

REM --- 1. Check Docker Desktop is running ---
docker info >nul 2>&1
if errorlevel 1 (
    echo Docker does not appear to be running.
    echo Trying to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to come up, this can take up to a minute...

    :waitfordocker
    timeout /t 5 >nul
    docker info >nul 2>&1
    if errorlevel 1 goto waitfordocker

    echo Docker is up.
) else (
    echo Docker is already running.
)

REM --- 2. .env with generated keys and passwords ---
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0init-env.ps1"
if errorlevel 1 goto failed

REM --- 3. Start the containers and wait until MySQL is healthy ---
echo.
echo Starting containers...
docker compose up -d --build --wait
if errorlevel 1 goto failed

REM --- 4. Apply pending migrations ---
docker compose exec -T app php lava migration run
if errorlevel 1 goto failed

docker compose ps

set APP_PORT=80
set PMA_PORT=8080
for /f "tokens=2 delims==" %%a in ('findstr /b "APP_PORT=" .env') do set APP_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "PMA_PORT=" .env') do set PMA_PORT=%%a

REM --- 5. Open the project in VS Code and the app in the browser ---
where code >nul 2>&1
if errorlevel 1 (
    echo VS Code CLI "code" not found on PATH - skipping editor launch.
    echo ^(In VS Code: Ctrl+Shift+P -^> "Shell Command: Install 'code' command in PATH"^)
) else (
    echo Opening project in VS Code...
    code .
)
start "" "http://localhost:%APP_PORT%/health"

echo.
echo === Ready ===
echo   App:        http://localhost:%APP_PORT%
echo   Health:     http://localhost:%APP_PORT%/health
echo   phpMyAdmin: http://localhost:%PMA_PORT%
echo   Stop with:  docker compose down  (or double-click stop-dev.bat)
echo.
pause
exit /b 0

:failed
echo.
echo Something failed - see the messages above, or run: docker compose logs
echo.
pause
exit /b 1
