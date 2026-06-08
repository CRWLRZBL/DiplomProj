@echo off
chcp 65001 >nul
echo Запуск проекта «Авторитет»...
set DOCKER_BUILDKIT=0
set COMPOSE_DOCKER_CLI_BUILD=0
docker compose up -d --build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Ошибка запуска. Проверьте, что Docker Desktop запущен.
    pause
    exit /b 1
)
echo.
echo Готово:
echo   Сайт:   http://localhost:3000
echo   Swagger: http://localhost:5171/swagger
echo.
pause
