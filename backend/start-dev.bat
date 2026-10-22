@echo off
REM ============================================================
REM  Table Reservation - dev environment starter and menu
REM  Double-click this file (or make a desktop shortcut to it) to:
REM    1. Make sure Docker Desktop is running
REM    2. Create .env from .env.example if missing
REM    3. Start the docker-compose stack (php, nginx, mysql, phpmyadmin)
REM    4. Fill in JWT_SECRET / JWT_REFRESH_KEY in .env if they are empty
REM    5. Open the project in VS Code and the API in the browser
REM    6. Show a menu of the commands used every day
REM ============================================================

REM Always run from the folder this .bat file lives in, no matter
REM where it's double-clicked from.
cd /d "%~dp0"

echo.
echo === Table Reservation Dev Environment ===
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

REM --- 2. Create .env if it doesn't exist yet ---
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Created .env from .env.example
    )
)

REM --- 3. Start the containers ---
echo.
echo Starting containers...
docker compose up -d

echo.
echo Waiting a few seconds for services to settle...
timeout /t 8 >nul

REM --- 4. Generate JWT keys that are missing or shorter than 32 characters ---
call :jwtkeys

REM --- 5. Open the project in VS Code and the API in the browser ---
where code >nul 2>&1
if errorlevel 1 (
    echo VS Code CLI "code" not found on PATH - skipping editor launch.
    echo ^(In VS Code: Ctrl+Shift+P -^> "Shell Command: Install 'code' command in PATH"^)
) else (
    echo Opening project in VS Code...
    code ..
)
start "" "http://localhost:8000/api/health"

REM --- 6. Menu ---
:menu
echo.
echo ============================================================
echo   API:        http://localhost:8000/api/health
echo   phpMyAdmin: http://localhost:8080   (root / root)
echo   Frontend:   http://localhost:5173   (after option 7)
echo ============================================================
echo   1  Status        containers + API + database check
echo   2  Test API      call every route, flag 404s and crashes
echo   3  Restart       restart all containers
echo   4  Logs          follow container logs (new window)
echo   5  MySQL shell   (new window)
echo   6  PHP shell     bash inside the php container (new window)
echo   7  Frontend      start npm run dev (new window)
echo   8  Checks        frontend format, build, lint, e2e tests
echo   9  Reset DB      DELETE all data, reload schema.sql + seed.sql
echo   S  Stop          stop all containers and exit
echo   Q  Quit          leave everything running and exit
echo.
choice /c 123456789SQ /n /m "Choose: "
if errorlevel 11 exit /b 0
if errorlevel 10 goto stop
if errorlevel 9 goto resetdb
if errorlevel 8 goto checks
if errorlevel 7 goto frontend
if errorlevel 6 goto phpshell
if errorlevel 5 goto mysqlshell
if errorlevel 4 goto logs
if errorlevel 3 goto restart
if errorlevel 2 goto testapi
if errorlevel 1 goto status
goto menu

:status
docker compose ps
echo.
call :check "GET" "/health" "200"
call :check "GET" "/health/db" "200"
goto menu

:testapi
echo.
call :check "GET" "/health" "200"
call :check "GET" "/health/db" "200"
for /f "tokens=1,2 delims=|" %%a in ('powershell -NoProfile -Command "Select-String -Path app\config\routes.php -Pattern '\$router->(get|post|put|patch|delete)\(''([^'']+)'', ''(?!Health|Dbtest)' | ForEach-Object { $_.Matches[0].Groups[1].Value.ToUpper() + '|' + ($_.Matches[0].Groups[2].Value -replace '\{id\}','1' -replace '\{code\}','RSV-000001') }"') do call :check "%%a" "%%b" "live"
goto menu

:restart
docker compose restart
goto menu

:logs
start "Container logs" cmd /k docker compose logs -f --tail 50
goto menu

:mysqlshell
start "MySQL" cmd /k docker compose exec mysql mysql -uroot -proot table_reservation_db
goto menu

:phpshell
start "PHP container" cmd /k docker compose exec php bash
goto menu

:frontend
if not exist "..\frontend\.env.local" (
    copy "..\frontend\.env.example" "..\frontend\.env.local" >nul
    echo Created frontend\.env.local from .env.example
)
if not exist "..\frontend\node_modules" (
    echo Installing frontend packages first...
    pushd ..\frontend
    call npm install
    popd
)
start "Frontend dev server" /d "..\frontend" cmd /k npm run dev
timeout /t 4 >nul
start "" "http://localhost:5173"
goto menu

:checks
pushd ..\frontend
call npm run format && call npm run build && call npm run lint && call npm run test:e2e
if errorlevel 1 (echo. & echo CHECKS FAILED - see the output above.) else (echo. & echo All checks passed.)
popd
goto menu

:resetdb
echo.
call :foldercheck
echo This permanently deletes ALL data in the local database.
echo The database is rebuilt from database\schema.sql and database\seed.sql in THIS folder.
set "confirm="
set /p "confirm=Type RESET to continue, anything else to cancel: "
if /i not "%confirm%"=="RESET" (
    echo Cancelled - nothing was deleted. ^(Type exactly RESET to reset.^)
    goto menu
)
echo Deleting the database and rebuilding it from schema.sql and seed.sql...
docker compose down -v
docker compose up -d
echo Waiting for MySQL to load the schema and seed, up to 2 minutes...
call :waitseed
goto menu

:stop
docker compose down
echo Stopped. Your database data is kept in its Docker volume.
exit /b 0

REM --- Helpers ---

:check
for /f %%c in ('curl -s -o nul -w "%%{http_code}" -X %~1 "http://localhost:8000/api%~2"') do set "code=%%c"
if "%~3"=="live" (
    echo  200 201 204 401 403 422 501 | findstr /c:" %code% " >nul && (echo   OK    %code%  %~1 %~2) || (echo   FAIL  %code%  %~1 %~2   expected 2xx, 401, 403, 422 or 501)
    exit /b 0
)
if "%code%"=="%~3" (echo   OK    %code%  %~1 %~2) else (echo   FAIL  %code%  %~1 %~2   expected %~3)
exit /b 0

:foldercheck
REM Warn when this folder is not an up-to-date main, because the reset loads its .sql files
where git >nul 2>&1 || exit /b 0
git -C .. fetch -q origin main >nul 2>&1
set "branch="
set "behind=0"
for /f %%b in ('git -C .. rev-parse --abbrev-ref HEAD 2^>nul') do set "branch=%%b"
for /f %%n in ('git -C .. rev-list --count HEAD..origin/main 2^>nul') do set "behind=%%n"
if /i "%branch%"=="main" if "%behind%"=="0" exit /b 0
echo.
echo WARNING: this folder is on "%branch%", %behind% commit^(s^) behind main.
echo The reset loads the seed from THIS folder, so it may load an old menu or schema.
echo Run "git switch main" and "git pull" first, or type RESET to reset anyway.
echo.
exit /b 0

:waitseed
REM Wait until the API reaches the database and the seed is loaded, then show proof
set /a "tries=0"
:waitseedloop
timeout /t 3 >nul
set /a "tries+=1"
set "code=000"
set "cats=0"
for /f %%c in ('curl -s -o nul -w "%%{http_code}" "http://localhost:8000/api/health/db"') do set "code=%%c"
for /f %%c in ('docker compose exec -T mysql mysql -uroot -proot table_reservation_db -N -e "SELECT COUNT(*) FROM categories" 2^>nul') do set "cats=%%c"
if "%code%"=="200" if not "%cats%"=="0" goto waitseeddone
if %tries% lss 40 goto waitseedloop
echo FAILED: the database did not come back within 2 minutes. Check option 4 ^(Logs^).
exit /b 0
:waitseeddone
set "created="
set "counts="
for /f "delims=" %%t in ('docker compose exec -T mysql mysql -uroot -proot table_reservation_db -N -e "SELECT MIN(create_time) FROM information_schema.tables WHERE table_schema = DATABASE()" 2^>nul') do set "created=%%t"
for /f "tokens=1-3" %%a in ('docker compose exec -T mysql mysql -uroot -proot table_reservation_db -N -e "SELECT (SELECT COUNT(*) FROM categories), (SELECT COUNT(*) FROM menu_items), (SELECT COUNT(*) FROM users)" 2^>nul') do set "counts=%%a categories, %%b menu items, %%c users"
echo.
echo Database rebuilt at %created% ^(MySQL clock, UTC^).
echo Loaded: %counts%
call :check "GET" "/health/db" "200"
exit /b 0

:jwtkeys
docker compose exec -T php php -r "$f='.env'; $s=file_get_contents($f); foreach (['JWT_SECRET','JWT_REFRESH_KEY'] as $k) { if (!preg_match('/^'.$k.'=[^\r\n]{32,}/m', $s)) { $v=$k.'='.bin2hex(random_bytes(32)); $s=preg_match('/^'.$k.'=/m', $s) ? preg_replace('/^'.$k.'=[^\r\n]*/m', $v, $s) : rtrim($s).PHP_EOL.$v.PHP_EOL; echo 'Generated '.$k.' in .env'.PHP_EOL; } } file_put_contents($f, $s);"
exit /b 0
