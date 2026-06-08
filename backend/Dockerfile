# Используем официальный образ .NET SDK для сборки
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем файл проекта и восстанавливаем зависимости
COPY CourseProjectAPI/CourseProjectAPI.csproj CourseProjectAPI/
RUN dotnet restore CourseProjectAPI/CourseProjectAPI.csproj

# Копируем остальные файлы и собираем проект
COPY CourseProjectAPI/ CourseProjectAPI/
WORKDIR /src/CourseProjectAPI
RUN dotnet build -c Release -o /app/build

# Публикуем приложение
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Финальный образ для запуска
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Копируем опубликованное приложение
COPY --from=publish /app/publish .

# curl — для healthcheck; каталог загрузок — с правами для пользователя app
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/wwwroot/uploads/catalog \
    && chown -R app:app /app/wwwroot
USER app

# Устанавливаем переменную окружения для ASP.NET Core
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Development

ENTRYPOINT ["dotnet", "CourseProjectAPI.dll"]

