-- =====================================================
-- Скрипт создания базы данных Autosalon
-- Полная структура базы данных со всеми таблицами,
-- индексами, внешними ключами, триггерами и начальными данными
-- 
-- ВАЖНО: 
-- 1. Скрипт должен выполняться от имени пользователя с правами sysadmin (например, sa)
-- 2. Убедитесь, что SQL Server запущен и доступен
-- 3. После выполнения скрипта база данных будет полностью готова к использованию
-- 4. Все тестовые данные будут созданы автоматически
-- 5. Скрипт автоматически удалит существующую БД, если она есть
-- =====================================================

USE master;
GO

-- Удаление базы данных, если она существует (для чистой установки)
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'Autosalon')
BEGIN
    -- Закрываем все активные соединения
    ALTER DATABASE Autosalon SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE Autosalon;
    PRINT 'Существующая база данных Autosalon удалена';
END
ELSE
BEGIN
    PRINT 'База данных Autosalon не существует, будет создана новая';
END
GO

-- Создание базы данных с правильной кодировкой для поддержки кириллицы
CREATE DATABASE Autosalon
COLLATE Cyrillic_General_CI_AS;
GO

PRINT 'База данных Autosalon создана';
GO

USE Autosalon;
GO

-- =====================================================
-- Таблица: Roles (Роли пользователей)
-- =====================================================
CREATE TABLE [dbo].[Roles] (
    [RoleID] INT IDENTITY(1,1) NOT NULL,
    [RoleName] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    CONSTRAINT [PK__Roles__8AFACE3A71737522] PRIMARY KEY ([RoleID]),
    CONSTRAINT [UQ__Roles__8A2B61609852683A] UNIQUE ([RoleName])
);
GO

-- =====================================================
-- Таблица: Users (Пользователи)
-- =====================================================
CREATE TABLE [dbo].[Users] (
    [UserID] INT IDENTITY(1,1) NOT NULL,
    [Email] NVARCHAR(255) NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [RoleID] INT NOT NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT [PK__Users__1788CCAC05B3A282] PRIMARY KEY ([UserID]),
    CONSTRAINT [FK_Users_Roles] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Roles] ([RoleID]),
    CONSTRAINT [UQ__Users__A9D1053433B6664A] UNIQUE ([Email])
);
GO

CREATE INDEX [IX_Users_Email] ON [dbo].[Users] ([Email]);
GO

-- =====================================================
-- Таблица: UserProfiles (Профили пользователей)
-- =====================================================
CREATE TABLE [dbo].[UserProfiles] (
    [ProfileID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Phone] NVARCHAR(20) NULL,
    [Address] NVARCHAR(500) NULL,
    [DateOfBirth] DATE NULL,
    CONSTRAINT [PK__UserProf__290C8884920A62CC] PRIMARY KEY ([ProfileID]),
    CONSTRAINT [FK_UserProfiles_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]) ON DELETE CASCADE,
    CONSTRAINT [UQ__UserProf__1788CCAD084141F5] UNIQUE ([UserID])
);
GO

-- =====================================================
-- Таблица: Brands (Бренды)
-- =====================================================
CREATE TABLE [dbo].[Brands] (
    [BrandID] INT IDENTITY(1,1) NOT NULL,
    [BrandName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [Country] NVARCHAR(50) NULL,
    [LogoURL] NVARCHAR(500) NULL,
    CONSTRAINT [PK__Brands__DAD4F3BE1FBD0878] PRIMARY KEY ([BrandID]),
    CONSTRAINT [UQ__Brands__2206CE9BE376F531] UNIQUE ([BrandName])
);
GO

-- =====================================================
-- Таблица: Models (Модели автомобилей)
-- =====================================================
CREATE TABLE [dbo].[Models] (
    [ModelID] INT IDENTITY(1,1) NOT NULL,
    [BrandID] INT NOT NULL,
    [ModelName] NVARCHAR(100) NOT NULL,
    [ModelYear] INT NOT NULL,
    [BodyType] NVARCHAR(50) NOT NULL,
    [BasePrice] DECIMAL(15, 2) NOT NULL,
    [Description] NVARCHAR(1000) NULL,
    [EngineCapacity] DECIMAL(4, 2) NULL,
    [FuelType] NVARCHAR(20) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [ImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK__Models__E8D7A1CC3A8CD188] PRIMARY KEY ([ModelID]),
    CONSTRAINT [FK_Models_Brands] FOREIGN KEY ([BrandID]) REFERENCES [dbo].[Brands] ([BrandID])
);
GO

CREATE INDEX [IX_Models_BrandID] ON [dbo].[Models] ([BrandID]);
GO

-- =====================================================
-- Таблица: Colors (Цвета)
-- =====================================================
CREATE TABLE [dbo].[Colors] (
    [ColorID] INT IDENTITY(1,1) NOT NULL,
    [ColorName] NVARCHAR(100) NOT NULL,
    [ColorCode] NVARCHAR(20) NOT NULL,
    [PriceModifier] DECIMAL(15, 2) NOT NULL DEFAULT 0,
    [IsAvailable] BIT NOT NULL DEFAULT 1,
    [ImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK_Colors_ColorID] PRIMARY KEY ([ColorID]),
    CONSTRAINT [UQ_Colors_ColorName] UNIQUE ([ColorName])
);
GO

-- =====================================================
-- Таблица: Engines (Двигатели)
-- =====================================================
CREATE TABLE [dbo].[Engines] (
    [EngineID] INT IDENTITY(1,1) NOT NULL,
    [EngineName] NVARCHAR(100) NOT NULL,
    [EngineCapacity] DECIMAL(4, 2) NOT NULL,
    [Power] INT NOT NULL,
    [FuelType] NVARCHAR(20) NOT NULL,
    [PriceModifier] DECIMAL(15, 2) NOT NULL DEFAULT 0,
    [IsAvailable] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Engines_EngineID] PRIMARY KEY ([EngineID]),
    CONSTRAINT [UQ_Engines_EngineName] UNIQUE ([EngineName])
);
GO

-- =====================================================
-- Таблица: Transmissions (Коробки передач)
-- =====================================================
CREATE TABLE [dbo].[Transmissions] (
    [TransmissionID] INT IDENTITY(1,1) NOT NULL,
    [TransmissionName] NVARCHAR(100) NOT NULL,
    [TransmissionType] NVARCHAR(20) NOT NULL,
    [Gears] INT NOT NULL,
    [PriceModifier] DECIMAL(15, 2) NOT NULL DEFAULT 0,
    [IsAvailable] BIT NOT NULL DEFAULT 1,
    CONSTRAINT [PK_Transmissions_TransmissionID] PRIMARY KEY ([TransmissionID]),
    CONSTRAINT [UQ_Transmissions_TransmissionName] UNIQUE ([TransmissionName])
);
GO

-- =====================================================
-- Таблица: ModelColors (Связь моделей и цветов)
-- =====================================================
CREATE TABLE [dbo].[ModelColors] (
    [ModelID] INT NOT NULL,
    [ColorID] INT NOT NULL,
    [ImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK_ModelColors] PRIMARY KEY ([ModelID], [ColorID]),
    CONSTRAINT [FK_ModelColors_Models] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Models] ([ModelID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ModelColors_Colors] FOREIGN KEY ([ColorID]) REFERENCES [dbo].[Colors] ([ColorID]) ON DELETE CASCADE
);
GO

-- =====================================================
-- Таблица: ModelEngines (Связь моделей и двигателей)
-- =====================================================
CREATE TABLE [dbo].[ModelEngines] (
    [ModelID] INT NOT NULL,
    [EngineID] INT NOT NULL,
    CONSTRAINT [PK_ModelEngines] PRIMARY KEY ([ModelID], [EngineID]),
    CONSTRAINT [FK_ModelEngines_Models] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Models] ([ModelID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ModelEngines_Engines] FOREIGN KEY ([EngineID]) REFERENCES [dbo].[Engines] ([EngineID]) ON DELETE CASCADE
);
GO

-- =====================================================
-- Таблица: ModelTransmissions (Связь моделей и КПП)
-- =====================================================
CREATE TABLE [dbo].[ModelTransmissions] (
    [ModelID] INT NOT NULL,
    [TransmissionID] INT NOT NULL,
    CONSTRAINT [PK_ModelTransmissions] PRIMARY KEY ([ModelID], [TransmissionID]),
    CONSTRAINT [FK_ModelTransmissions_Models] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Models] ([ModelID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ModelTransmissions_Transmissions] FOREIGN KEY ([TransmissionID]) REFERENCES [dbo].[Transmissions] ([TransmissionID]) ON DELETE CASCADE
);
GO

-- =====================================================
-- Таблица: Configurations (Комплектации)
-- =====================================================
CREATE TABLE [dbo].[Configurations] (
    [ConfigurationID] INT IDENTITY(1,1) NOT NULL,
    [ModelID] INT NOT NULL,
    [ConfigurationName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [AdditionalPrice] DECIMAL(15, 2) NOT NULL DEFAULT 0,
    [EnginePower] INT NULL,
    [EngineCapacity] DECIMAL(4, 2) NULL,
    [FuelType] NVARCHAR(20) NULL,
    [TransmissionType] NVARCHAR(20) NULL,
    CONSTRAINT [PK__Configur__95AA539BA454B50F] PRIMARY KEY ([ConfigurationID]),
    CONSTRAINT [FK_Configurations_Models] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Models] ([ModelID]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Configurations_ModelID] ON [dbo].[Configurations] ([ModelID]);
GO

-- =====================================================
-- Таблица: AdditionalOptions (Дополнительные опции)
-- =====================================================
CREATE TABLE [dbo].[AdditionalOptions] (
    [OptionID] INT IDENTITY(1,1) NOT NULL,
    [OptionName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [OptionPrice] DECIMAL(15, 2) NOT NULL,
    [Category] NVARCHAR(50) NULL,
    CONSTRAINT [PK__Addition__92C7A1DF1C48BBCA] PRIMARY KEY ([OptionID])
);
GO

-- =====================================================
-- Таблица: Cars (Автомобили)
-- =====================================================
CREATE TABLE [dbo].[Cars] (
    [CarID] INT IDENTITY(1,1) NOT NULL,
    [ModelID] INT NOT NULL,
    [VIN] NVARCHAR(17) NOT NULL,
    [Color] NVARCHAR(50) NOT NULL,
    [ProductionDate] DATE NULL,
    [Mileage] INT NOT NULL DEFAULT 0,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'Available',
    [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [ImageUrl] NVARCHAR(500) NULL,
    CONSTRAINT [PK__Cars__68A0340ED23855BA] PRIMARY KEY ([CarID]),
    CONSTRAINT [FK_Cars_Models] FOREIGN KEY ([ModelID]) REFERENCES [dbo].[Models] ([ModelID]),
    CONSTRAINT [UQ__Cars__C5DF234CB587C62F] UNIQUE ([VIN])
);
GO

CREATE INDEX [IX_Cars_Status] ON [dbo].[Cars] ([Status]);
CREATE INDEX [IX_Cars_ModelID] ON [dbo].[Cars] ([ModelID]);
GO

-- =====================================================
-- Таблица: Orders (Заказы)
-- =====================================================
CREATE TABLE [dbo].[Orders] (
    [OrderID] INT IDENTITY(1,1) NOT NULL,
    [UserID] INT NOT NULL,
    [CarID] INT NOT NULL,
    [ConfigurationID] INT NOT NULL,
    [TotalPrice] DECIMAL(15, 2) NOT NULL,
    [OrderStatus] NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    [OrderDate] DATETIME NOT NULL DEFAULT GETDATE(),
    [DeliveryDate] DATE NULL,
    [Notes] NVARCHAR(1000) NULL,
    CONSTRAINT [PK__Orders__C3905BAF5870167A] PRIMARY KEY ([OrderID]),
    CONSTRAINT [FK_Orders_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [FK_Orders_Cars] FOREIGN KEY ([CarID]) REFERENCES [dbo].[Cars] ([CarID]),
    CONSTRAINT [FK_Orders_Configurations] FOREIGN KEY ([ConfigurationID]) REFERENCES [dbo].[Configurations] ([ConfigurationID])
);
GO

CREATE INDEX [IX_Orders_UserID] ON [dbo].[Orders] ([UserID]);
CREATE INDEX [IX_Orders_Status] ON [dbo].[Orders] ([OrderStatus]);
GO

-- =====================================================
-- Таблица: OrderOptions (Опции в заказе)
-- =====================================================
CREATE TABLE [dbo].[OrderOptions] (
    [OrderOptionID] INT IDENTITY(1,1) NOT NULL,
    [OrderID] INT NOT NULL,
    [OptionID] INT NOT NULL,
    [Quantity] INT NOT NULL DEFAULT 1,
    [PriceAtOrder] DECIMAL(15, 2) NOT NULL,
    CONSTRAINT [PK__OrderOpt__59E1EBBC50C34C36] PRIMARY KEY ([OrderOptionID]),
    CONSTRAINT [FK_OrderOptions_Orders] FOREIGN KEY ([OrderID]) REFERENCES [dbo].[Orders] ([OrderID]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderOptions_AdditionalOptions] FOREIGN KEY ([OptionID]) REFERENCES [dbo].[AdditionalOptions] ([OptionID])
);
GO

-- =====================================================
-- Таблица: OrderStatusHistory (История изменений статусов заказов)
-- =====================================================
CREATE TABLE [dbo].[OrderStatusHistory] (
    [HistoryID] INT IDENTITY(1,1) NOT NULL,
    [OrderID] INT NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    [ChangedAt] DATETIME NOT NULL DEFAULT GETDATE(),
    [ChangedBy] INT NULL,
    [Notes] NVARCHAR(500) NULL,
    CONSTRAINT [PK__OrderSta__4D7B4ADDAA186F83] PRIMARY KEY ([HistoryID]),
    CONSTRAINT [FK_OrderStatusHistory_Orders] FOREIGN KEY ([OrderID]) REFERENCES [dbo].[Orders] ([OrderID]) ON DELETE CASCADE,
    CONSTRAINT [FK_OrderStatusHistory_Users] FOREIGN KEY ([ChangedBy]) REFERENCES [dbo].[Users] ([UserID])
);
GO

-- =====================================================
-- Триггеры
-- =====================================================

-- Триггер для обновления UpdatedAt
CREATE TRIGGER [tr_Users_UpdateTimestamp]
ON [dbo].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Users]
    SET [UpdatedAt] = GETDATE()
    FROM [dbo].[Users] u
    INNER JOIN inserted i ON u.UserID = i.UserID;
END;
GO

-- Триггер для истории изменений статусов заказов
CREATE TRIGGER [tr_Orders_StatusChange]
ON [dbo].[Orders]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE([OrderStatus])
    BEGIN
        INSERT INTO [dbo].[OrderStatusHistory] ([OrderID], [Status], [ChangedAt], [Notes])
        SELECT 
            i.[OrderID],
            i.[OrderStatus],
            GETDATE(),
            'Статус изменен системой'
        FROM inserted i
        INNER JOIN deleted d ON i.[OrderID] = d.[OrderID]
        WHERE i.[OrderStatus] != d.[OrderStatus];
    END
END;
GO

-- =====================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =====================================================

-- Вставка базовых ролей
INSERT INTO [dbo].[Roles] ([RoleName], [Description]) VALUES
    ('Admin', 'Администратор системы'),
    ('Manager', 'Менеджер'),
    ('Client', 'Клиент');
GO

-- Вставка бренда LADA
INSERT INTO [dbo].[Brands] ([BrandName], [Description], [Country]) VALUES
    ('LADA', 'Автомобили LADA - российский производитель', 'Россия');
GO

-- Получаем BrandID для LADA
DECLARE @LadaBrandID INT = (SELECT BrandID FROM [dbo].[Brands] WHERE BrandName = 'LADA');

-- Вставка моделей автомобилей
INSERT INTO [dbo].[Models] ([BrandID], [ModelName], [ModelYear], [BodyType], [BasePrice], [Description], [EngineCapacity], [FuelType], [IsActive]) VALUES
    (@LadaBrandID, N'Granta Седан', 2024, 'Sedan', 749900.00, N'Компактный седан LADA Granta', 1.6, 'Petrol', 1),
    (@LadaBrandID, N'Granta Хэтчбек', 2024, 'Hatchback', 789900.00, N'Хэтчбек LADA Granta', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Granta Cross', 2024, 'SUV', 899900.00, N'Кроссовер LADA Granta Cross', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Granta Sport', 2024, 'Sedan', 949900.00, N'Спортивная версия LADA Granta', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Granta Sportline', 2024, 'Sedan', 999900.00, N'Спортивная версия LADA Granta Sportline', 1.6, 'Petrol', 1),
    (@LadaBrandID, N'Vesta Седан', 2024, 'Sedan', 1239900.00, N'Седан LADA Vesta', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Vesta SW', 2024, 'StationWagon', 1299900.00, N'Универсал LADA Vesta SW', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Vesta SW Cross', 2024, 'SUV', 1399900.00, N'Кросс-универсал LADA Vesta SW Cross', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Vesta Sportline', 2024, 'Sedan', 1449900.00, N'Спортивная версия LADA Vesta Sportline', 1.6, 'Petrol', 1),
    (@LadaBrandID, N'Largus Универсал', 2024, 'StationWagon', 1099900.00, N'Универсал LADA Largus', 1.6, 'Petrol', 1),
    (@LadaBrandID, N'Largus Фургон', 2024, 'StationWagon', 999900.00, N'Фургон LADA Largus', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Largus Cross', 2024, 'SUV', 1199900.00, N'Кроссовер LADA Largus Cross', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Niva Travel', 2024, 'SUV', 1314000.00, N'Внедорожник LADA Niva Travel', 1.8, 'Petrol', 1),
    (@LadaBrandID, 'Niva Legend', 2024, 'SUV', 1249900.00, N'Внедорожник LADA Niva Legend', 1.7, 'Petrol', 1),
    (@LadaBrandID, N'Iskra Седан', 2024, 'Sedan', 899900.00, N'Седан LADA Iskra', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Iskra SW', 2024, 'StationWagon', 949900.00, N'Универсал LADA Iskra SW', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Iskra SW Cross', 2024, 'SUV', 1049900.00, N'Кросс-универсал LADA Iskra SW Cross', 1.6, 'Petrol', 1),
    (@LadaBrandID, 'Aura', 2024, 'Sedan', 1599900.00, N'Премиум седан LADA Aura', 1.8, 'Petrol', 1);
GO

-- Вставка цветов (с проверкой на существование)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Ледниковый')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Ледниковый', '#FFFFFF', 0.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Пантера')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Пантера', '#000000', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Платина')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Платина', '#C0C0C0', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Борнео')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Борнео', '#1E3A8A', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Капитан')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Капитан', '#3B82F6', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Кориандр')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Кориандр', '#92400E', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Фламенко')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Фламенко', '#DC2626', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Несси')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Несси', '#065F46', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Несси 2')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Несси 2', '#065F46', 20000.00, 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[Colors] WHERE ColorName = N'Табаско')
    INSERT INTO [dbo].[Colors] ([ColorName], [ColorCode], [PriceModifier], [IsAvailable]) VALUES (N'Табаско', '#B91C1C', 20000.00, 1);
GO

-- Вставка двигателей
INSERT INTO [dbo].[Engines] ([EngineName], [EngineCapacity], [Power], [FuelType], [PriceModifier], [IsAvailable]) VALUES
    ('1.6L 90 л.с.', 1.6, 90, 'Petrol', 0.00, 1),
    ('1.6L 106 л.с. Turbo', 1.6, 106, 'Petrol', 50000.00, 1),
    ('1.8L 122 л.с.', 1.8, 122, 'Petrol', 80000.00, 1),
    ('1.7L 83 л.с.', 1.7, 83, 'Petrol', 0.00, 1),
    ('1.5L 87 л.с.', 1.5, 87, 'Petrol', 0.00, 1);
GO

-- Вставка трансмиссий
INSERT INTO [dbo].[Transmissions] ([TransmissionName], [TransmissionType], [Gears], [PriceModifier], [IsAvailable]) VALUES
    ('5-ступенчатая механика', 'Механика', 5, 0.00, 1),
    ('6-ступенчатая механика', 'Механика', 6, 10000.00, 1),
    ('Автоматическая', 'Автомат', 4, 100000.00, 1),
    ('Вариатор', 'Вариатор', 0, 120000.00, 1);
GO

-- Получаем ID для связей (используем N префикс для Unicode)
DECLARE @LedaGlacierColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Ледниковый');
DECLARE @PantherColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Пантера');
DECLARE @PlatinumColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Платина');
DECLARE @BorneoColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Борнео');
DECLARE @CaptainColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Капитан');
DECLARE @CorianderColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Кориандр');
DECLARE @FlamencoColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Фламенко');
DECLARE @NessyColorID INT = (SELECT ColorID FROM [dbo].[Colors] WHERE ColorName = N'Несси');

DECLARE @Engine16_90ID INT = (SELECT EngineID FROM [dbo].[Engines] WHERE EngineName = '1.6L 90 л.с.');
DECLARE @Engine16_106ID INT = (SELECT EngineID FROM [dbo].[Engines] WHERE EngineName = '1.6L 106 л.с. Turbo');
DECLARE @Engine18_122ID INT = (SELECT EngineID FROM [dbo].[Engines] WHERE EngineName = '1.8L 122 л.с.');
DECLARE @Engine17_83ID INT = (SELECT EngineID FROM [dbo].[Engines] WHERE EngineName = '1.7L 83 л.с.');
DECLARE @Engine15_87ID INT = (SELECT EngineID FROM [dbo].[Engines] WHERE EngineName = '1.5L 87 л.с.');

DECLARE @Transmission5MTID INT = (SELECT TransmissionID FROM [dbo].[Transmissions] WHERE TransmissionName = '5-ступенчатая механика');
DECLARE @Transmission6MTID INT = (SELECT TransmissionID FROM [dbo].[Transmissions] WHERE TransmissionName = '6-ступенчатая механика');
DECLARE @TransmissionATID INT = (SELECT TransmissionID FROM [dbo].[Transmissions] WHERE TransmissionName = 'Автоматическая');
DECLARE @TransmissionCVTID INT = (SELECT TransmissionID FROM [dbo].[Transmissions] WHERE TransmissionName = 'Вариатор');

-- Получаем ID моделей для создания связей и комплектаций (используем N префикс для Unicode)
DECLARE @GrantaSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Седан');
DECLARE @GrantaHatchbackID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Хэтчбек');
DECLARE @GrantaCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Cross');
DECLARE @GrantaSportID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sport');
DECLARE @GrantaSportlineID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sportline');
DECLARE @VestaSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Vesta Седан');
DECLARE @VestaSWID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW');
DECLARE @VestaSWCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW Cross');
DECLARE @VestaSportlineID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta Sportline');
DECLARE @LargusUniversalID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Универсал');
DECLARE @LargusFurgonID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Фургон');
DECLARE @LargusCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Largus Cross');
DECLARE @NivaTravelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Travel');
DECLARE @NivaLegendID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Legend');
DECLARE @IskraSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Iskra Седан');
DECLARE @IskraSWID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW');
DECLARE @IskraSWCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW Cross');
DECLARE @AuraID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Aura');

-- =====================================================
-- Заполнение связей: ModelColors (Модели-Цвета)
-- =====================================================
-- Granta Седан - доступные цвета
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@GrantaSedanID, @LedaGlacierColorID),
    (@GrantaSedanID, @PantherColorID),
    (@GrantaSedanID, @PlatinumColorID),
    (@GrantaSedanID, @BorneoColorID),
    (@GrantaSedanID, @CaptainColorID),
    (@GrantaSedanID, @CorianderColorID),
    (@GrantaSedanID, @FlamencoColorID);

-- Granta Хэтчбек
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@GrantaHatchbackID, @LedaGlacierColorID),
    (@GrantaHatchbackID, @PantherColorID),
    (@GrantaHatchbackID, @PlatinumColorID),
    (@GrantaHatchbackID, @BorneoColorID);

-- Vesta Седан
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@VestaSedanID, @LedaGlacierColorID),
    (@VestaSedanID, @PantherColorID),
    (@VestaSedanID, @PlatinumColorID),
    (@VestaSedanID, @BorneoColorID),
    (@VestaSedanID, @CaptainColorID),
    (@VestaSedanID, @FlamencoColorID);

-- Vesta SW
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@VestaSWID, @LedaGlacierColorID),
    (@VestaSWID, @PantherColorID),
    (@VestaSWID, @PlatinumColorID),
    (@VestaSWID, @BorneoColorID);

-- Largus Универсал
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@LargusUniversalID, @LedaGlacierColorID),
    (@LargusUniversalID, @PantherColorID),
    (@LargusUniversalID, @PlatinumColorID);

-- Niva Travel
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@NivaTravelID, @LedaGlacierColorID),
    (@NivaTravelID, @PantherColorID),
    (@NivaTravelID, @CaptainColorID),
    (@NivaTravelID, @NessyColorID);

-- Niva Legend
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@NivaLegendID, @LedaGlacierColorID),
    (@NivaLegendID, @PantherColorID),
    (@NivaLegendID, @NessyColorID);

-- Iskra Седан
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@IskraSedanID, @LedaGlacierColorID),
    (@IskraSedanID, @PantherColorID),
    (@IskraSedanID, @PlatinumColorID),
    (@IskraSedanID, @BorneoColorID);

-- Aura
INSERT INTO [dbo].[ModelColors] ([ModelID], [ColorID]) VALUES
    (@AuraID, @PlatinumColorID),
    (@AuraID, @PantherColorID),
    (@AuraID, @BorneoColorID),
    (@AuraID, @CaptainColorID);
GO

-- =====================================================
-- Заполнение связей: ModelEngines (Модели-Двигатели)
-- =====================================================
-- Granta модели - двигатели 1.6L
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@GrantaSedanID, @Engine16_90ID),
    (@GrantaSedanID, @Engine16_106ID),
    (@GrantaHatchbackID, @Engine16_90ID),
    (@GrantaHatchbackID, @Engine16_106ID),
    (@GrantaCrossID, @Engine16_90ID),
    (@GrantaCrossID, @Engine16_106ID),
    (@GrantaSportID, @Engine16_106ID),
    (@GrantaSportlineID, @Engine16_106ID);

-- Vesta модели
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@VestaSedanID, @Engine16_106ID),
    (@VestaSedanID, @Engine18_122ID),
    (@VestaSWID, @Engine16_106ID),
    (@VestaSWID, @Engine18_122ID),
    (@VestaSWCrossID, @Engine16_106ID),
    (@VestaSWCrossID, @Engine18_122ID),
    (@VestaSportlineID, @Engine18_122ID);

-- Largus модели
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@LargusUniversalID, @Engine16_90ID),
    (@LargusUniversalID, @Engine16_106ID),
    (@LargusFurgonID, @Engine16_90ID),
    (@LargusCrossID, @Engine16_90ID),
    (@LargusCrossID, @Engine16_106ID);

-- Niva модели
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@NivaTravelID, @Engine18_122ID),
    (@NivaLegendID, @Engine17_83ID);

-- Iskra модели
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@IskraSedanID, @Engine16_90ID),
    (@IskraSedanID, @Engine16_106ID),
    (@IskraSWID, @Engine16_90ID),
    (@IskraSWID, @Engine16_106ID),
    (@IskraSWCrossID, @Engine16_90ID),
    (@IskraSWCrossID, @Engine16_106ID);

-- Aura
INSERT INTO [dbo].[ModelEngines] ([ModelID], [EngineID]) VALUES
    (@AuraID, @Engine18_122ID);
GO

-- =====================================================
-- Заполнение связей: ModelTransmissions (Модели-КПП)
-- =====================================================
-- Granta модели
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@GrantaSedanID, @Transmission5MTID),
    (@GrantaSedanID, @Transmission6MTID),
    (@GrantaSedanID, @TransmissionATID),
    (@GrantaHatchbackID, @Transmission5MTID),
    (@GrantaHatchbackID, @TransmissionATID),
    (@GrantaCrossID, @Transmission5MTID),
    (@GrantaCrossID, @TransmissionATID),
    (@GrantaSportID, @Transmission6MTID),
    (@GrantaSportlineID, @Transmission6MTID),
    (@GrantaSportlineID, @TransmissionATID);

-- Vesta модели
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@VestaSedanID, @Transmission5MTID),
    (@VestaSedanID, @Transmission6MTID),
    (@VestaSedanID, @TransmissionATID),
    (@VestaSedanID, @TransmissionCVTID),
    (@VestaSWID, @Transmission5MTID),
    (@VestaSWID, @TransmissionATID),
    (@VestaSWID, @TransmissionCVTID),
    (@VestaSWCrossID, @Transmission5MTID),
    (@VestaSWCrossID, @TransmissionATID),
    (@VestaSportlineID, @TransmissionATID),
    (@VestaSportlineID, @TransmissionCVTID);

-- Largus модели
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@LargusUniversalID, @Transmission5MTID),
    (@LargusUniversalID, @TransmissionATID),
    (@LargusFurgonID, @Transmission5MTID),
    (@LargusCrossID, @Transmission5MTID),
    (@LargusCrossID, @TransmissionATID);

-- Niva модели
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@NivaTravelID, @Transmission5MTID),
    (@NivaTravelID, @TransmissionATID),
    (@NivaLegendID, @Transmission5MTID);

-- Iskra модели
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@IskraSedanID, @Transmission5MTID),
    (@IskraSedanID, @TransmissionATID),
    (@IskraSWID, @Transmission5MTID),
    (@IskraSWID, @TransmissionATID),
    (@IskraSWCrossID, @Transmission5MTID),
    (@IskraSWCrossID, @TransmissionATID);

-- Aura
INSERT INTO [dbo].[ModelTransmissions] ([ModelID], [TransmissionID]) VALUES
    (@AuraID, @TransmissionATID),
    (@AuraID, @TransmissionCVTID);
GO

-- =====================================================
-- Заполнение комплектаций (Configurations)
-- =====================================================
-- Переобъявляем переменные (после GO они теряются)
DECLARE @GrantaSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Седан');
DECLARE @GrantaHatchbackID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Хэтчбек');
DECLARE @GrantaCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Cross');
DECLARE @GrantaSportID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sport');
DECLARE @GrantaSportlineID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sportline');
DECLARE @VestaSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Vesta Седан');
DECLARE @VestaSWID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW');
DECLARE @VestaSWCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW Cross');
DECLARE @VestaSportlineID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta Sportline');
DECLARE @LargusUniversalID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Универсал');
DECLARE @LargusFurgonID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Фургон');
DECLARE @LargusCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Largus Cross');
DECLARE @NivaTravelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Travel');
DECLARE @NivaLegendID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Legend');
DECLARE @IskraSedanID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Iskra Седан');
DECLARE @IskraSWID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW');
DECLARE @IskraSWCrossID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW Cross');
DECLARE @AuraID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Aura');

-- Вставка всех комплектаций одним блоком (чтобы переменные не терялись)
INSERT INTO [dbo].[Configurations] ([ModelID], [ConfigurationName], [Description], [AdditionalPrice], [EnginePower], [EngineCapacity], [FuelType], [TransmissionType]) VALUES
    -- Granta Седан
    (@GrantaSedanID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaSedanID, 'Standard Plus', N'Комплектация Standard Plus', 50000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaSedanID, 'Comfort', N'Комплектация Comfort', 100000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaSedanID, 'Luxury', N'Комплектация Luxury', 150000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Vesta Седан
    (@VestaSedanID, 'Classic', N'Базовая комплектация', 0.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSedanID, 'Comfort', N'Комплектация Comfort', 80000.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSedanID, 'Luxury', N'Комплектация Luxury', 150000.00, 122, 1.8, 'Petrol', N'Автомат'),
    (@VestaSedanID, 'Sportline', N'Спортивная комплектация', 200000.00, 122, 1.8, 'Petrol', N'Автомат'),
    -- Vesta SW
    (@VestaSWID, 'Classic', N'Базовая комплектация', 0.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSWID, 'Comfort', N'Комплектация Comfort', 80000.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSWID, 'Luxury', N'Комплектация Luxury', 150000.00, 122, 1.8, 'Petrol', N'Автомат'),
    -- Vesta SW Cross
    (@VestaSWCrossID, 'Classic', N'Базовая комплектация', 0.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSWCrossID, 'Comfort', N'Комплектация Comfort', 80000.00, 106, 1.6, 'Petrol', N'Механика'),
    (@VestaSWCrossID, 'Luxury', N'Комплектация Luxury', 150000.00, 122, 1.8, 'Petrol', N'Автомат'),
    -- Largus Универсал
    (@LargusUniversalID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@LargusUniversalID, 'Comfort', N'Комплектация Comfort', 70000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@LargusUniversalID, 'Luxury', N'Комплектация Luxury', 120000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Niva Travel
    (@NivaTravelID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.8, 'Petrol', N'Механика'),
    (@NivaTravelID, 'Comfort', N'Комплектация Comfort', 100000.00, 90, 1.8, 'Petrol', N'Механика'),
    (@NivaTravelID, 'Luxury', N'Комплектация Luxury', 180000.00, 90, 1.8, 'Petrol', N'Автомат'),
    -- Niva Legend
    (@NivaLegendID, 'Standard', N'Базовая комплектация', 0.00, 83, 1.7, 'Petrol', N'Механика'),
    (@NivaLegendID, 'Comfort', N'Комплектация Comfort', 90000.00, 83, 1.7, 'Petrol', N'Механика'),
    (@NivaLegendID, 'Luxury', N'Комплектация Luxury', 150000.00, 83, 1.7, 'Petrol', N'Механика'),
    -- Iskra Седан
    (@IskraSedanID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSedanID, 'Comfort', N'Комплектация Comfort', 60000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSedanID, 'Luxury', N'Комплектация Luxury', 120000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Iskra SW
    (@IskraSWID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSWID, 'Comfort', N'Комплектация Comfort', 60000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSWID, 'Luxury', N'Комплектация Luxury', 120000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Iskra SW Cross
    (@IskraSWCrossID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSWCrossID, 'Comfort', N'Комплектация Comfort', 70000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@IskraSWCrossID, 'Luxury', N'Комплектация Luxury', 130000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Granta Хэтчбек
    (@GrantaHatchbackID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaHatchbackID, 'Comfort', N'Комплектация Comfort', 50000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaHatchbackID, 'Luxury', N'Комплектация Luxury', 100000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Granta Cross
    (@GrantaCrossID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaCrossID, 'Comfort', N'Комплектация Comfort', 60000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@GrantaCrossID, 'Luxury', N'Комплектация Luxury', 120000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Granta Sport
    (@GrantaSportID, 'Sport', N'Спортивная комплектация', 0.00, 106, 1.6, 'Petrol', N'Механика'),
    (@GrantaSportID, 'Sport Plus', N'Спортивная комплектация Plus', 80000.00, 106, 1.6, 'Petrol', N'Механика'),
    -- Granta Sportline
    (@GrantaSportlineID, 'Sportline', N'Спортивная комплектация Sportline', 0.00, 106, 1.6, 'Petrol', N'Механика'),
    (@GrantaSportlineID, 'Sportline Plus', N'Спортивная комплектация Sportline Plus', 100000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Vesta Sportline
    (@VestaSportlineID, 'Sportline', N'Спортивная комплектация Sportline', 0.00, 122, 1.8, 'Petrol', N'Автомат'),
    (@VestaSportlineID, 'Sportline Plus', N'Спортивная комплектация Sportline Plus', 150000.00, 122, 1.8, 'Petrol', N'Автомат'),
    -- Largus Фургон
    (@LargusFurgonID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@LargusFurgonID, 'Comfort', N'Комплектация Comfort', 50000.00, 90, 1.6, 'Petrol', N'Механика'),
    -- Largus Cross
    (@LargusCrossID, 'Standard', N'Базовая комплектация', 0.00, 90, 1.6, 'Petrol', N'Механика'),
    (@LargusCrossID, 'Comfort', N'Комплектация Comfort', 70000.00, 90, 1.6, 'Petrol', N'Механика'),
    (@LargusCrossID, 'Luxury', N'Комплектация Luxury', 130000.00, 106, 1.6, 'Petrol', N'Автомат'),
    -- Aura
    (@AuraID, 'Premium', N'Премиум комплектация', 0.00, 122, 1.8, 'Petrol', N'Автомат'),
    (@AuraID, 'Premium Plus', N'Премиум комплектация Plus', 200000.00, 122, 1.8, 'Petrol', N'Автомат');
GO

-- Вставка дополнительных опций
INSERT INTO [dbo].[AdditionalOptions] ([OptionName], [Description], [OptionPrice], [Category]) VALUES
    ('Климат-контроль', 'Автоматический климат-контроль', 50000.00, 'Комфорт'),
    ('Кожаный салон', 'Отделка салона натуральной кожей', 150000.00, 'Комфорт'),
    ('Подогрев сидений', 'Подогрев передних и задних сидений', 30000.00, 'Комфорт'),
    ('Круиз-контроль', 'Адаптивный круиз-контроль', 80000.00, 'Безопасность'),
    ('Камера заднего вида', 'Камера заднего вида с парковочными линиями', 40000.00, 'Безопасность'),
    ('Парктроники', 'Парковочные датчики спереди и сзади', 25000.00, 'Безопасность'),
    ('Ксеноновые фары', 'Ксеноновые фары с автоматической регулировкой', 60000.00, 'Освещение'),
    ('Светодиодные фары', 'Светодиодные фары', 80000.00, 'Освещение'),
    ('Мультимедиа система', 'Мультимедиа система с навигацией', 70000.00, 'Мультимедиа'),
    ('Панорамная крыша', 'Панорамная стеклянная крыша', 120000.00, 'Комфорт'),
    ('Боковые подушки безопасности', 'Дополнительные боковые подушки безопасности', 40000.00, 'Безопасность'),
    ('Система мониторинга давления в шинах', 'Автоматический мониторинг давления', 20000.00, 'Безопасность');
GO

-- Вставка тестовых пользователей
-- Пароль для всех тестовых пользователей: "admin123" (без хэширования, для тестирования)
DECLARE @AdminRoleID INT = (SELECT RoleID FROM [dbo].[Roles] WHERE RoleName = 'Admin');
DECLARE @ManagerRoleID INT = (SELECT RoleID FROM [dbo].[Roles] WHERE RoleName = 'Manager');
DECLARE @ClientRoleID INT = (SELECT RoleID FROM [dbo].[Roles] WHERE RoleName = 'Client');

INSERT INTO [dbo].[Users] ([Email], [PasswordHash], [RoleID], [IsActive]) VALUES
    ('admin@autosalon.ru', 'admin123', @AdminRoleID, 1),
    ('manager@autosalon.ru', 'admin123', @ManagerRoleID, 1),
    ('client@test.ru', 'admin123', @ClientRoleID, 1);
GO

-- Вставка профилей пользователей
DECLARE @AdminUserID INT = (SELECT UserID FROM [dbo].[Users] WHERE Email = 'admin@autosalon.ru');
DECLARE @ManagerUserID INT = (SELECT UserID FROM [dbo].[Users] WHERE Email = 'manager@autosalon.ru');
DECLARE @ClientUserID INT = (SELECT UserID FROM [dbo].[Users] WHERE Email = 'client@test.ru');

INSERT INTO [dbo].[UserProfiles] ([UserID], [FirstName], [LastName], [Phone], [Address]) VALUES
    (@AdminUserID, 'Администратор', 'Системы', '+7 (999) 123-45-67', 'г. Москва, ул. Примерная, д. 1'),
    (@ManagerUserID, 'Менеджер', 'Тестовый', '+7 (999) 123-45-68', 'г. Москва, ул. Примерная, д. 2'),
    (@ClientUserID, 'Клиент', 'Тестовый', '+7 (999) 123-45-69', 'г. Москва, ул. Примерная, д. 3');
GO

-- Вставка тестовых автомобилей
DECLARE @GrantaSedanModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Седан');
DECLARE @GrantaHatchbackModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Хэтчбек');
DECLARE @GrantaCrossModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Cross');
DECLARE @GrantaSportModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sport');
DECLARE @GrantaSportlineModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Granta Sportline');
DECLARE @VestaSedanModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Vesta Седан');
DECLARE @VestaSWModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW');
DECLARE @VestaSWCrossModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta SW Cross');
DECLARE @VestaSportlineModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Vesta Sportline');
DECLARE @LargusUniversalModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Универсал');
DECLARE @LargusCrossModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Largus Cross');
DECLARE @LargusFurgonModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Фургон');
DECLARE @NivaTravelModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Travel');
DECLARE @NivaLegendModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Legend');
DECLARE @IskraSedanModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Iskra Седан');
DECLARE @IskraSWModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW');
DECLARE @IskraSWCrossModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Iskra SW Cross');
DECLARE @AuraModelID INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Aura');

INSERT INTO [dbo].[Cars] ([ModelID], [VIN], [Color], [Status], [Mileage]) VALUES
    -- Granta Седан
    (@GrantaSedanModelID, 'X9FMXXEEBDM123456', 'Ледниковый', 'Available', 0),
    (@GrantaSedanModelID, 'X9FMXXEEBDM123457', 'Пантера', 'Available', 0),
    (@GrantaSedanModelID, 'X9FMXXEEBDM123458', 'Платина', 'Available', 0),
    (@GrantaSedanModelID, 'X9FMXXEEBDM123459', 'Борнео', 'Available', 0),
    -- Granta Хэтчбек
    (@GrantaHatchbackModelID, 'X9FMXXEEBDM123460', 'Ледниковый', 'Available', 0),
    (@GrantaHatchbackModelID, 'X9FMXXEEBDM123461', 'Пантера', 'Available', 0),
    -- Granta Cross
    (@GrantaCrossModelID, 'X9FMXXEEBDM123500', 'Ледниковый', 'Available', 0),
    (@GrantaCrossModelID, 'X9FMXXEEBDM123501', 'Капитан', 'Available', 0),
    (@GrantaCrossModelID, 'X9FMXXEEBDM123502', 'Борнео', 'Available', 0),
    -- Granta Sport
    (@GrantaSportModelID, 'X9FMXXEEBDM123510', 'Ледниковый', 'Available', 0),
    (@GrantaSportModelID, 'X9FMXXEEBDM123511', 'Пантера', 'Available', 0),
    (@GrantaSportModelID, 'X9FMXXEEBDM123512', 'Платина', 'Available', 0),
    -- Granta Sportline
    (@GrantaSportlineModelID, 'X9FMXXEEBDM123520', 'Ледниковый', 'Available', 0),
    (@GrantaSportlineModelID, 'X9FMXXEEBDM123521', 'Пантера', 'Available', 0),
    (@GrantaSportlineModelID, 'X9FMXXEEBDM123522', 'Капитан', 'Available', 0),
    -- Vesta Седан
    (@VestaSedanModelID, 'X9FMXXEEBDM123462', 'Ледниковый', 'Available', 0),
    (@VestaSedanModelID, 'X9FMXXEEBDM123463', 'Пантера', 'Available', 0),
    (@VestaSedanModelID, 'X9FMXXEEBDM123464', 'Борнео', 'Available', 0),
    (@VestaSedanModelID, 'X9FMXXEEBDM123465', 'Платина', 'Available', 0),
    -- Vesta SW
    (@VestaSWModelID, 'X9FMXXEEBDM123466', 'Ледниковый', 'Available', 0),
    (@VestaSWModelID, 'X9FMXXEEBDM123467', 'Пантера', 'Available', 0),
    -- Vesta SW Cross
    (@VestaSWCrossModelID, 'X9FMXXEEBDM123530', 'Ледниковый', 'Available', 0),
    (@VestaSWCrossModelID, 'X9FMXXEEBDM123531', 'Борнео', 'Available', 0),
    (@VestaSWCrossModelID, 'X9FMXXEEBDM123532', 'Платина', 'Available', 0),
    -- Vesta Sportline
    (@VestaSportlineModelID, 'X9FMXXEEBDM123540', 'Ледниковый', 'Available', 0),
    (@VestaSportlineModelID, 'X9FMXXEEBDM123541', 'Пантера', 'Available', 0),
    -- Largus Универсал
    (@LargusUniversalModelID, 'X9FMXXEEBDM123468', 'Ледниковый', 'Available', 0),
    (@LargusUniversalModelID, 'X9FMXXEEBDM123469', 'Пантера', 'Available', 0),
    (@LargusUniversalModelID, 'X9FMXXEEBDM123550', 'Капитан', 'Available', 0),
    -- Largus Cross
    (@LargusCrossModelID, 'X9FMXXEEBDM123560', 'Ледниковый', 'Available', 0),
    (@LargusCrossModelID, 'X9FMXXEEBDM123561', 'Пантера', 'Available', 0),
    -- Largus Фургон
    (@LargusFurgonModelID, 'X9FMXXEEBDM123570', 'Ледниковый', 'Available', 0),
    (@LargusFurgonModelID, 'X9FMXXEEBDM123571', 'Капитан', 'Available', 0),
    -- Niva Travel
    (@NivaTravelModelID, 'X9FMXXEEBDM123470', 'Ледниковый', 'Available', 0),
    (@NivaTravelModelID, 'X9FMXXEEBDM123471', 'Капитан', 'Available', 0),
    (@NivaTravelModelID, 'X9FMXXEEBDM123580', 'Кориандр', 'Available', 0),
    -- Niva Legend
    (@NivaLegendModelID, 'X9FMXXEEBDM123472', 'Ледниковый', 'Available', 0),
    (@NivaLegendModelID, 'X9FMXXEEBDM123473', 'Пантера', 'Available', 0),
    (@NivaLegendModelID, 'X9FMXXEEBDM123590', 'Капитан', 'Available', 0),
    -- Iskra Седан
    (@IskraSedanModelID, 'X9FMXXEEBDM123474', 'Ледниковый', 'Available', 0),
    (@IskraSedanModelID, 'X9FMXXEEBDM123475', 'Пантера', 'Available', 0),
    (@IskraSedanModelID, 'X9FMXXEEBDM123600', 'Борнео', 'Available', 0),
    -- Iskra SW
    (@IskraSWModelID, 'X9FMXXEEBDM123610', 'Ледниковый', 'Available', 0),
    (@IskraSWModelID, 'X9FMXXEEBDM123611', 'Платина', 'Available', 0),
    -- Iskra SW Cross
    (@IskraSWCrossModelID, 'X9FMXXEEBDM123620', 'Ледниковый', 'Available', 0),
    (@IskraSWCrossModelID, 'X9FMXXEEBDM123621', 'Борнео', 'Available', 0),
    (@IskraSWCrossModelID, 'X9FMXXEEBDM123622', 'Капитан', 'Available', 0),
    -- Aura
    (@AuraModelID, 'X9FMXXEEBDM123476', 'Платина', 'Available', 0),
    (@AuraModelID, 'X9FMXXEEBDM123477', 'Пантера', 'Available', 0),
    (@AuraModelID, 'X9FMXXEEBDM123630', 'Кориандр', 'Available', 0);
GO

-- =====================================================
-- Заполнение заказов (Orders)
-- =====================================================
-- Переобъявляем переменные пользователей (после GO они теряются)
DECLARE @ClientUserID INT = (SELECT UserID FROM [dbo].[Users] WHERE Email = 'client@test.ru');

-- Переобъявляем переменные моделей (после GO они теряются)
DECLARE @GrantaSedanModelIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Седан');
DECLARE @VestaSedanModelIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Vesta Седан');
DECLARE @NivaTravelModelIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Travel');
DECLARE @LargusUniversalModelIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Универсал');

-- Переобъявляем переменные моделей для получения комплектаций
DECLARE @GrantaSedanIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Granta Седан');
DECLARE @VestaSedanIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Vesta Седан');
DECLARE @NivaTravelIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = 'Niva Travel');
DECLARE @LargusUniversalIDForOrders INT = (SELECT ModelID FROM [dbo].[Models] WHERE ModelName = N'Largus Универсал');

-- Получаем ID первого автомобиля каждого типа для заказов
DECLARE @FirstGrantaCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @GrantaSedanModelIDForOrders ORDER BY CarID);
DECLARE @FirstVestaCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @VestaSedanModelIDForOrders ORDER BY CarID);
-- Используем подзапросы вместо OFFSET/FETCH для совместимости
DECLARE @SecondVestaCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @VestaSedanModelIDForOrders AND CarID > @FirstVestaCarID ORDER BY CarID);
DECLARE @ThirdVestaCarID INT;
SELECT TOP 1 @ThirdVestaCarID = CarID FROM (SELECT TOP 3 CarID FROM [dbo].[Cars] WHERE ModelID = @VestaSedanModelIDForOrders ORDER BY CarID) AS Sub ORDER BY CarID DESC;
DECLARE @SecondGrantaCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @GrantaSedanModelIDForOrders AND CarID > @FirstGrantaCarID ORDER BY CarID);
DECLARE @FirstNivaTravelCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @NivaTravelModelIDForOrders ORDER BY CarID);
DECLARE @FirstLargusCarID INT = (SELECT TOP 1 CarID FROM [dbo].[Cars] WHERE ModelID = @LargusUniversalModelIDForOrders ORDER BY CarID);

-- Получаем ID комплектаций
DECLARE @GrantaStandardConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @GrantaSedanIDForOrders AND ConfigurationName = 'Standard');
DECLARE @GrantaComfortConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @GrantaSedanIDForOrders AND ConfigurationName = 'Comfort');
DECLARE @VestaComfortConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @VestaSedanIDForOrders AND ConfigurationName = 'Comfort');
DECLARE @VestaSportlineConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @VestaSedanIDForOrders AND ConfigurationName = 'Sportline');
DECLARE @NivaTravelLuxuryConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @NivaTravelIDForOrders AND ConfigurationName = 'Luxury');
DECLARE @LargusComfortConfigID INT = (SELECT TOP 1 ConfigurationID FROM [dbo].[Configurations] WHERE ModelID = @LargusUniversalIDForOrders AND ConfigurationName = 'Comfort');

-- Получаем базовые цены моделей для расчета итоговой цены
DECLARE @GrantaBasePrice DECIMAL(15, 2) = (SELECT BasePrice FROM [dbo].[Models] WHERE ModelID = @GrantaSedanIDForOrders);
DECLARE @VestaBasePrice DECIMAL(15, 2) = (SELECT BasePrice FROM [dbo].[Models] WHERE ModelID = @VestaSedanIDForOrders);
DECLARE @NivaTravelBasePrice DECIMAL(15, 2) = (SELECT BasePrice FROM [dbo].[Models] WHERE ModelID = @NivaTravelIDForOrders);
DECLARE @LargusBasePrice DECIMAL(15, 2) = (SELECT BasePrice FROM [dbo].[Models] WHERE ModelID = @LargusUniversalIDForOrders);

-- Получаем дополнительные цены комплектаций
DECLARE @GrantaComfortPrice DECIMAL(15, 2) = (SELECT AdditionalPrice FROM [dbo].[Configurations] WHERE ConfigurationID = @GrantaComfortConfigID);
DECLARE @VestaComfortPrice DECIMAL(15, 2) = (SELECT AdditionalPrice FROM [dbo].[Configurations] WHERE ConfigurationID = @VestaComfortConfigID);
DECLARE @VestaSportlinePrice DECIMAL(15, 2) = (SELECT AdditionalPrice FROM [dbo].[Configurations] WHERE ConfigurationID = @VestaSportlineConfigID);
DECLARE @NivaTravelLuxuryPrice DECIMAL(15, 2) = (SELECT AdditionalPrice FROM [dbo].[Configurations] WHERE ConfigurationID = @NivaTravelLuxuryConfigID);
DECLARE @LargusComfortPrice DECIMAL(15, 2) = (SELECT AdditionalPrice FROM [dbo].[Configurations] WHERE ConfigurationID = @LargusComfortConfigID);

-- Создаем тестовые заказы с разными статусами
INSERT INTO [dbo].[Orders] ([UserID], [CarID], [ConfigurationID], [TotalPrice], [OrderStatus], [OrderDate], [DeliveryDate], [Notes]) VALUES
    -- Заказы в статусе Pending
    (@ClientUserID, @FirstGrantaCarID, @GrantaComfortConfigID, @GrantaBasePrice + @GrantaComfortPrice, 'Pending', DATEADD(day, -5, GETDATE()), NULL, N'Ожидает подтверждения'),
    (@ClientUserID, @FirstVestaCarID, @VestaComfortConfigID, @VestaBasePrice + @VestaComfortPrice, 'Pending', DATEADD(day, -3, GETDATE()), NULL, N'Заказ на рассмотрении'),
    
    -- Заказы в статусе Confirmed
    (@ClientUserID, @SecondVestaCarID, @VestaSportlineConfigID, @VestaBasePrice + @VestaSportlinePrice, 'Confirmed', DATEADD(day, -10, GETDATE()), DATEADD(day, 15, GETDATE()), N'Заказ подтвержден, ожидает производства'),
    (@ClientUserID, @FirstNivaTravelCarID, @NivaTravelLuxuryConfigID, @NivaTravelBasePrice + @NivaTravelLuxuryPrice, 'Confirmed', DATEADD(day, -7, GETDATE()), DATEADD(day, 20, GETDATE()), N'Заказ в обработке'),
    
    -- Заказы в статусе InProduction
    (@ClientUserID, @FirstLargusCarID, @LargusComfortConfigID, @LargusBasePrice + @LargusComfortPrice, 'InProduction', DATEADD(day, -15, GETDATE()), DATEADD(day, 5, GETDATE()), N'Автомобиль в производстве'),
    
    -- Заказы в статусе Completed
    (@ClientUserID, @SecondGrantaCarID, @GrantaStandardConfigID, @GrantaBasePrice, 'Completed', DATEADD(day, -30, GETDATE()), DATEADD(day, -5, GETDATE()), N'Заказ выполнен, автомобиль получен'),
    (@ClientUserID, @ThirdVestaCarID, @VestaComfortConfigID, @VestaBasePrice + @VestaComfortPrice, 'Completed', DATEADD(day, -25, GETDATE()), DATEADD(day, -3, GETDATE()), N'Заказ успешно выполнен');
GO

PRINT '========================================';
PRINT 'База данных Autosalon успешно создана!';
PRINT '========================================';
PRINT '';
PRINT 'Тестовые пользователи:';
PRINT '  Email: admin@autosalon.ru (Администратор)';
PRINT '  Email: manager@autosalon.ru (Менеджер)';
PRINT '  Email: client@test.ru (Клиент)';
PRINT '';
PRINT 'Пароль для всех пользователей: admin123';
PRINT '';
PRINT 'Создано:';
PRINT '  - Брендов: 1 (LADA)';
PRINT '  - Моделей: 18';
PRINT '  - Комплектаций: 40+';
PRINT '  - Цветов: 10';
PRINT '  - Двигателей: 5';
PRINT '  - Трансмиссий: 4';
PRINT '  - Связей Модель-Цвет: 50+';
PRINT '  - Связей Модель-Двигатель: 30+';
PRINT '  - Связей Модель-Трансмиссия: 30+';
PRINT '  - Дополнительных опций: 12';
PRINT '  - Тестовых автомобилей: 18';
PRINT '  - Тестовых заказов: 7';
PRINT '';
PRINT 'Все связи заполнены корректно!';
PRINT 'База данных готова к использованию!';
GO
