# Автосалон LADA — ООО «Авторитет»

Веб-ИС автосалона: каталог LADA и авто с пробегом, онлайн-конфигуратор, заказы, тест-драйв, чат, админ-панель.

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | .NET 8, ASP.NET Core Web API, EF Core, SQL Server 2022 |
| Frontend | React 19, TypeScript, Vite, React Bootstrap |
| Инфраструктура | Docker Compose, Nginx |

## Структура

```
Cursa4/
├── backend/
│   ├── CourseProjectAPI/     # API, модели, SQL-скрипты
│   └── Dockerfile
├── frontend/
│   ├── src/                  # React-приложение
│   ├── public/               # Статика и изображения
│   ├── Dockerfile
│   └── nginx.conf
├── docker/db-init/           # Автоинициализация БД
├── docker-compose.yml
└── docker-compose-up.bat     # Быстрый запуск (Windows)
```

## Быстрый запуск (Docker)

**Нужно:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```powershell
cd Cursa4
docker compose up -d --build
```

Или на Windows двойной клик по `docker-compose-up.bat`.

Первый запуск — 2–4 минуты (образы + создание БД).

| Сервис | URL |
|--------|-----|
| Сайт | http://localhost:3000 |
| API / Swagger | http://localhost:5171/swagger |

База создаётся автоматически контейнером `db-init`. Ручной запуск SQL не нужен.

### Учётные записи

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@autosalon.ru | admin123 |
| Менеджер | manager@autosalon.ru | admin123 |
| Клиент | client@test.ru | admin123 |

### SQL Server (SSMS / DBeaver)

| Параметр | Значение |
|----------|----------|
| Сервер | `localhost,1433` |
| База | `Autosalon` |
| Логин | `sa` |
| Пароль | `Pass1234` |

## Перенос на другой ПК

1. Скопируйте всю папку `Cursa4` (USB, архив, Git).
2. Установите Docker Desktop.
3. Выполните `docker compose up -d --build`.

`node_modules`, `bin/`, `obj/`, `dist/` в архив класть не нужно — всё соберётся в Docker.

## Сброс при ошибках

```powershell
docker compose down -v
docker compose up -d --build
```

Удалит данные БД и пересоздаст контейнеры.

## Локальная разработка (без Docker)

### Backend

```powershell
cd backend/CourseProjectAPI
dotnet restore
dotnet run
```

API: http://localhost:5171 — строка подключения в `appsettings.json`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Сайт: http://localhost:5173 — при необходимости создайте `.env`:

```
VITE_API_URL=http://localhost:5171/api
```

## Порты

| Порт | Назначение |
|------|------------|
| 3000 | Frontend (Nginx) |
| 5171 | Backend API |
| 1433 | SQL Server |

## Полезные команды

```powershell
docker compose ps          # статус контейнеров
docker compose logs -f     # логи всех сервисов
docker compose logs backend
dotnet test backend/CourseProjectAPI.Tests
```
