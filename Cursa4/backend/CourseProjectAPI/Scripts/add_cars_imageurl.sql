-- Добавляет хранение изображения на уровне машины (Cars.ImageUrl).
-- Выполнить один раз в БД Autosalon.

IF COL_LENGTH('dbo.Cars', 'ImageUrl') IS NULL
BEGIN
    ALTER TABLE dbo.Cars
    ADD ImageUrl NVARCHAR(500) NULL;
END
GO

-- (опционально) пример: заполнить ImageUrl значением от модели, если оно уже есть
-- UPDATE c
-- SET c.ImageUrl = m.ImageUrl
-- FROM dbo.Cars c
-- JOIN dbo.Models m ON m.ModelID = c.ModelID
-- WHERE c.ImageUrl IS NULL AND m.ImageUrl IS NOT NULL;

