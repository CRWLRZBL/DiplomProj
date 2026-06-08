/*
  Миграция фото в БД (пути к файлам в frontend/public).

  Что делает:
  1) Гарантирует наличие dbo.Cars.ImageUrl (если БД уже создана без колонки).
  2) Заполняет dbo.Models.ImageUrl "витринным" фото (по одной картинке на модель).
  3) (Опционально) Заполняет dbo.Cars.ImageUrl по модели+цвету, если поле пустое.

  Важно:
  - Пути пишем как URL для фронта: /images/cars/<Folder>/<Prefix>-<Color>.png
  - Файлы должны лежать в frontend/public/images/cars/...
*/

-- 1) Добавляем колонку в Cars при необходимости
IF COL_LENGTH('dbo.Cars', 'ImageUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Cars
    ADD ImageUrl NVARCHAR(500) NULL;
END
GO

-- 2) Заполняем Models.ImageUrl (витринная картинка)
--    Выбираем базовый цвет: обычно "Ледниковый", для Aura и Niva Travel берём "Платина" (т.к. ледникового может не быть).
UPDATE m
SET m.ImageUrl =
    CASE
        WHEN m.ModelName = N'Granta Седан' THEN N'/images/cars/Granta/Sedan-Ледниковый.png'
        WHEN m.ModelName = N'Granta Хэтчбек' THEN N'/images/cars/Granta/LiftBack-Ледниковый.png'
        WHEN m.ModelName = N'Granta Cross' THEN N'/images/cars/Granta/Cross-Ледниковый.png'
        WHEN m.ModelName = N'Granta Sport' THEN N'/images/cars/Granta/Sport-Ледниковый.png'
        WHEN m.ModelName = N'Granta Sportline' THEN N'/images/cars/Granta/Sportline-Ледниковый.png'

        WHEN m.ModelName = N'Vesta Седан' THEN N'/images/cars/Vesta/Sedan-Ледниковый.png'
        WHEN m.ModelName = N'Vesta SW' THEN N'/images/cars/Vesta/SW-Ледниковый.png'
        WHEN m.ModelName = N'Vesta SW Cross' THEN N'/images/cars/Vesta/SW-Cross-Ледниковый.png'
        WHEN m.ModelName = N'Vesta Sportline' THEN N'/images/cars/Vesta/Sportline-Ледниковый.png'

        WHEN m.ModelName = N'Largus Универсал' THEN N'/images/cars/Largus/Универсал-Ледниковый.png'
        WHEN m.ModelName = N'Largus Фургон' THEN N'/images/cars/Largus/Фургон-Ледниковый.png'
        WHEN m.ModelName = N'Largus Cross' THEN N'/images/cars/Largus/Cross-Ледниковый.png'

        WHEN m.ModelName = N'Niva Travel' THEN N'/images/cars/Niva Travel/Travel-NEW-Платина.png'
        WHEN m.ModelName = N'Niva Legend' THEN N'/images/cars/Niva Legend/Legend-Ледниковый.png'

        WHEN m.ModelName = N'Iskra Седан' THEN N'/images/cars/Iskra/Sedan-Ледниковый.png'
        WHEN m.ModelName = N'Iskra SW' THEN N'/images/cars/Iskra/SW-Ледниковый.png'
        WHEN m.ModelName = N'Iskra SW Cross' THEN N'/images/cars/Iskra/SW-Cross-Ледниковый.png'

        WHEN m.ModelName = N'Aura' THEN N'/images/cars/Aura/Aura-Платина.png'
        ELSE m.ImageUrl
    END
FROM dbo.Models m
WHERE (m.ImageUrl IS NULL OR LTRIM(RTRIM(m.ImageUrl)) = N'');
GO

/*
  3) (Опционально) Заполняем Cars.ImageUrl для конкретных машин.
     Если хочешь хранить только картинку на уровне модели — этот блок можно удалить/закомментировать.
*/

;WITH Map AS (
    SELECT
        c.CarID,
        Folder =
            CASE
                WHEN m.ModelName LIKE N'Granta%' THEN N'Granta'
                WHEN m.ModelName LIKE N'Vesta%' THEN N'Vesta'
                WHEN m.ModelName LIKE N'Largus%' THEN N'Largus'
                WHEN m.ModelName = N'Niva Travel' THEN N'Niva Travel'
                WHEN m.ModelName = N'Niva Legend' THEN N'Niva Legend'
                WHEN m.ModelName LIKE N'Iskra%' THEN N'Iskra'
                WHEN m.ModelName = N'Aura' THEN N'Aura'
                ELSE NULL
            END,
        Prefix =
            CASE
                WHEN m.ModelName = N'Granta Хэтчбек' THEN N'LiftBack'
                WHEN m.ModelName = N'Granta Cross' THEN N'Cross'
                WHEN m.ModelName = N'Granta Sport' THEN N'Sport'
                WHEN m.ModelName = N'Granta Sportline' THEN N'Sportline'

                WHEN m.ModelName = N'Vesta Седан' THEN N'Sedan'
                WHEN m.ModelName = N'Vesta SW' THEN N'SW'
                WHEN m.ModelName = N'Vesta SW Cross' THEN N'SW-Cross'
                WHEN m.ModelName = N'Vesta Sportline' THEN N'Sportline'

                WHEN m.ModelName = N'Largus Универсал' THEN N'Универсал'
                WHEN m.ModelName = N'Largus Фургон' THEN N'Фургон'
                WHEN m.ModelName = N'Largus Cross' THEN N'Cross'

                WHEN m.ModelName = N'Niva Travel' THEN N'Travel-NEW'
                WHEN m.ModelName = N'Niva Legend' THEN N'Legend'

                WHEN m.ModelName = N'Iskra Седан' THEN N'Sedan'
                WHEN m.ModelName = N'Iskra SW' THEN N'SW'
                WHEN m.ModelName = N'Iskra SW Cross' THEN N'SW-Cross'

                WHEN m.ModelName = N'Aura' THEN N'Aura'
                ELSE
                    CASE
                        WHEN m.BodyType = N'Sedan' THEN N'Sedan'
                        WHEN m.BodyType = N'Hatchback' THEN N'LiftBack'
                        WHEN m.BodyType = N'StationWagon' THEN N'SW'
                        WHEN m.BodyType = N'SUV' THEN N'SUV'
                        ELSE N'Sedan'
                    END
            END,
        NormalizedColor =
            CASE
                WHEN c.Color IN (N'Несси 2', N'Несси2') THEN N'Несси2'
                ELSE REPLACE(c.Color, N' ', N'')
            END
    FROM dbo.Cars c
    JOIN dbo.Models m ON m.ModelID = c.ModelID
)
UPDATE c
SET c.ImageUrl = N'/images/cars/' + Map.Folder + N'/' + Map.Prefix + N'-' + Map.NormalizedColor + N'.png'
FROM dbo.Cars c
JOIN Map ON Map.CarID = c.CarID
WHERE (c.ImageUrl IS NULL OR LTRIM(RTRIM(c.ImageUrl)) = N'')
  AND Map.Folder IS NOT NULL
  AND Map.Prefix IS NOT NULL
  AND Map.NormalizedColor IS NOT NULL;
GO

