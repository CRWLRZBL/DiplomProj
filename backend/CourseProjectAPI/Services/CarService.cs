using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Services
{
    public class CarService : ICarService
    {
        private readonly AutoSalonContext _context;

        public CarService(AutoSalonContext context)
        {
            _context = context;
        }
        
        public async Task<List<CarDto>> GetAvailableCarsAsync(string brand = null, string bodyType = null)
        {
            var query = _context.Cars
                .Include(c => c.Model)
                    .ThenInclude(m => m!.Brand)
                .Where(c => c.Status == "Available");

            if (!string.IsNullOrEmpty(brand))
                query = query.Where(c =>
                    (c.CatalogBrand ?? c.Model!.Brand!.BrandName).Contains(brand));

            if (!string.IsNullOrEmpty(bodyType))
                query = query.Where(c =>
                    (c.CatalogBodyType ?? c.Model!.BodyType) == bodyType);

            var cars = await query.ToListAsync();

            return cars.Select(CarMapping.ToDto).ToList();
        }

        public async Task<List<ModelDto>> GetAvailableModelsAsync(string brand = null, string bodyType = null)
        {
            var query = _context.Models
                .Include(m => m.Brand)
                .Where(m => m.IsActive);

            if (!string.IsNullOrEmpty(brand))
                query = query.Where(m => m.Brand.BrandName.Contains(brand));

            if (!string.IsNullOrEmpty(bodyType))
                query = query.Where(m => m.BodyType == bodyType);

            var models = await query
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    BrandName = m.Brand.BrandName,
                    ModelName = m.ModelName,
                    BodyType = m.BodyType,
                    BasePrice = m.BasePrice,
                    ModelYear = m.ModelYear,
                    FuelType = m.FuelType,
                    EngineCapacity = m.EngineCapacity,
                    Description = m.Description,
                    ImageUrl = m.ImageUrl,
                    IsActive = m.IsActive,
                    AvailableCount = _context.Cars.Count(c => c.ModelId == m.ModelId && c.Status == "Available")
                })
                .ToListAsync();

            // Фильтруем модели: показываем те, у которых есть либо доступные машины, либо комплектации
            var modelIdsWithConfigs = await _context.Configurations
                .Select(c => c.ModelId)
                .Distinct()
                .ToListAsync();

            return models
                .Where(m => m.AvailableCount > 0 || modelIdsWithConfigs.Contains(m.ModelId))
                .OrderBy(m => m.BrandName)
                .ThenBy(m => m.ModelName)
                .ToList();
        }

        public async Task<ModelDto> GetModelByIdAsync(int id)
        {
            return await _context.Models
                .Include(m => m.Brand)
                .Where(m => m.ModelId == id && m.IsActive)
                .Select(m => new ModelDto
                {
                    ModelId = m.ModelId,
                    BrandName = m.Brand.BrandName,
                    ModelName = m.ModelName,
                    BodyType = m.BodyType,
                    BasePrice = m.BasePrice,
                    ModelYear = m.ModelYear,
                    FuelType = m.FuelType,
                    EngineCapacity = m.EngineCapacity,
                    Description = m.Description,
                    ImageUrl = m.ImageUrl,
                    IsActive = m.IsActive,
                    AvailableCount = _context.Cars.Count(c => c.ModelId == m.ModelId && c.Status == "Available")
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CarDto> GetCarByIdAsync(int id)
        {
            var car = await _context.Cars
                .Include(c => c.Model)
                    .ThenInclude(m => m!.Brand)
                .FirstOrDefaultAsync(c => c.CarId == id);

            return car == null ? null! : CarMapping.ToDto(car);
        }

        public async Task<List<CarDto>> GetAllCarsAsync()
        {
            var cars = await _context.Cars
                .Include(c => c.Model)
                    .ThenInclude(m => m!.Brand)
                .OrderByDescending(c => c.CarId)
                .ToListAsync();

            return cars.Select(CarMapping.ToDto).ToList();
        }

        public async Task<List<Configuration>> GetConfigurationsAsync(int carId)
        {
            var car = await _context.Cars
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CarId == carId);

            if (car == null) return new List<Configuration>();

            var modelId = car.ConfiguratorModelId ?? car.ModelId;
            if (!modelId.HasValue)
                return new List<Configuration>();

            return await _context.Configurations
                .AsNoTracking()
                .Where(c => c.ModelId == modelId.Value)
                .ToListAsync();
        }

        public async Task<List<Configuration>> GetConfigurationsByModelIdAsync(int modelId)
        {
            var configurations = await _context.Configurations
                .AsNoTracking()
                .Where(c => c.ModelId == modelId)
                .OrderBy(c => c.AdditionalPrice)
                .ThenBy(c => c.ConfigurationName)
                .ToListAsync();
            
            // Диагностическое логирование
            System.Diagnostics.Debug.WriteLine($"[CarService] GetConfigurationsByModelIdAsync: modelId={modelId}, found={configurations.Count} configurations");
            if (configurations.Count > 0)
            {
                System.Diagnostics.Debug.WriteLine($"[CarService] First config: ID={configurations[0].ConfigurationId}, Name={configurations[0].ConfigurationName}, ModelId={configurations[0].ModelId}");
            }
            else
            {
                // Проверяем есть ли вообще конфигурации в БД
                var totalCount = await _context.Configurations.CountAsync();
                var modelsWithConfigs = await _context.Configurations
                    .Select(c => c.ModelId)
                    .Distinct()
                    .ToListAsync();
                System.Diagnostics.Debug.WriteLine($"[CarService] Total configurations in DB: {totalCount}");
                System.Diagnostics.Debug.WriteLine($"[CarService] Models with configurations: {string.Join(", ", modelsWithConfigs)}");
            }
            
            return configurations;
        }

        public async Task<CarDto> UpdateCarAsync(int id, UpdateCarDto updateDto)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
                return null;

            if (!string.IsNullOrEmpty(updateDto.Color))
                car.Color = updateDto.Color;

            if (!string.IsNullOrEmpty(updateDto.Status))
                car.Status = updateDto.Status;

            if (!string.IsNullOrEmpty(updateDto.Vin))
                car.Vin = updateDto.Vin;

            if (updateDto.Mileage.HasValue)
                car.Mileage = updateDto.Mileage.Value;

            if (updateDto.ImageUrl != null)
                car.ImageUrl = string.IsNullOrWhiteSpace(updateDto.ImageUrl) ? null : updateDto.ImageUrl.Trim();

            if (updateDto.ImageUrls != null)
            {
                var urls = updateDto.ImageUrls
                    .Where(u => !string.IsNullOrWhiteSpace(u))
                    .Select(u => u.Trim())
                    .Distinct()
                    .ToList();
                car.CatalogImageUrls = urls.Count > 0 ? string.Join("|", urls) : null;
                if (urls.Count > 0)
                    car.ImageUrl = urls[0];
                else if (updateDto.ImageUrl == null)
                    car.ImageUrl = null;
            }

            if (updateDto.Condition != null)
                car.CatalogCondition = string.IsNullOrWhiteSpace(updateDto.Condition)
                    ? null
                    : updateDto.Condition.Trim();

            await _context.SaveChangesAsync();

            return await GetCarByIdAsync(id);
        }

        public async Task<List<ColorDto>> GetAvailableColorsAsync()
        {
            // Маппинг всех доступных цветов LADA в hex-коды
            // Базовый цвет: Ледниковый (белый)
            var colorMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Ледниковый", "#FFFFFF" },      // Базовый белый цвет
                { "Пантера", "#000000" },         // Черный
                { "Платина", "#C0C0C0" },        // Серебристый
                { "Борнео", "#4A5568" },         // Темно-серый
                { "Капитан", "#3B82F6" },        // Синий
                { "Кориандр", "#92400E" },       // Коричневый
                { "Фламенко", "#DC2626" },       // Красный
                { "Несси", "#065F46" },          // Темно-зеленый
                { "Несси 2", "#065F46" },        // Темно-зеленый (вариант 2)
                { "Несси2", "#065F46" },         // Темно-зеленый (вариант 2, без пробела)
                { "Табаско", "#B91C1C" },        // Темно-красный
                // Старые названия для обратной совместимости
                { "Белый", "#FFFFFF" },
                { "Черный", "#000000" },
                { "Серебристый", "#C0C0C0" },
                { "Серый", "#808080" },
                { "Красный", "#DC2626" },
                { "Синий", "#3B82F6" },
                { "Зеленый", "#059669" }
            };

            // Возвращаем все доступные цвета из маппинга
            // Порядок: сначала базовый, потом остальные
            var orderedColors = new List<string>
            {
                "Ледниковый",  // Базовый цвет - первый
                "Пантера",
                "Платина",
                "Борнео",
                "Капитан",
                "Кориандр",
                "Фламенко",
                "Несси",
                "Несси 2",     // Темно-зеленый (вариант 2)
                "Табаско"
            };

            return orderedColors.Select(colorName => new ColorDto
            {
                Name = colorName,
                HexCode = colorMap.TryGetValue(colorName, out var hexCode) ? hexCode : "#CCCCCC"
            }).ToList();
        }

        public async Task<List<EngineDto>> GetAvailableEnginesAsync(int? modelId = null)
        {
            var engines = new List<EngineDto>();

            // Сначала получаем двигатели из комплектаций (если указана модель)
            if (modelId.HasValue)
            {
                var configEngines = await _context.Configurations
                    .AsNoTracking()
                    .Where(c => c.ModelId == modelId.Value)
                    .Where(c => (c.EngineCapacity.HasValue || c.Model.EngineCapacity.HasValue) 
                        && (!string.IsNullOrEmpty(c.FuelType) || !string.IsNullOrEmpty(c.Model.FuelType)))
                    .Select(c => new EngineDto
                    {
                        Capacity = c.EngineCapacity ?? c.Model.EngineCapacity ?? 0,
                        FuelType = c.FuelType ?? c.Model.FuelType ?? "",
                        Power = c.EnginePower
                    })
                    .Distinct()
                    .ToListAsync();

                engines.AddRange(configEngines);
            }

            // Если нет данных из комплектаций или не указана модель, используем данные из Models
            if (!engines.Any())
            {
                var query = _context.Models
                    .AsNoTracking()
                    .Where(m => m.IsActive);

                if (modelId.HasValue)
                {
                    query = query.Where(m => m.ModelId == modelId.Value);
                }

                var modelEngines = await query
                    .Where(m => m.EngineCapacity.HasValue && !string.IsNullOrEmpty(m.FuelType))
                    .Select(m => new EngineDto
                    {
                        Capacity = m.EngineCapacity.Value,
                        FuelType = m.FuelType,
                        Power = null // Мощность теперь может быть в Configuration
                    })
                    .Distinct()
                    .ToListAsync();

                engines.AddRange(modelEngines);
            }

            return engines
                .GroupBy(e => new { e.Capacity, e.FuelType })
                .Select(g => g.OrderByDescending(e => e.Power).First())
                .OrderBy(e => e.Capacity)
                .ThenBy(e => e.FuelType)
                .ToList();
        }

        public async Task<List<TransmissionDto>> GetAvailableTransmissionsAsync(int? modelId = null)
        {
            var transmissions = new List<TransmissionDto>();

            // Получаем КПП из комплектаций
            if (modelId.HasValue)
            {
                var configTransmissions = await _context.Configurations
                    .AsNoTracking()
                    .Where(c => c.ModelId == modelId.Value && !string.IsNullOrEmpty(c.TransmissionType))
                    .Select(c => new TransmissionDto
                    {
                        Type = c.TransmissionType,
                        Description = $"Коробка передач для комплектации {c.ConfigurationName}"
                    })
                    .Distinct()
                    .ToListAsync();

                transmissions.AddRange(configTransmissions);
            }
            else
            {
                // Если модель не указана, получаем все уникальные КПП из всех комплектаций
                var allTransmissions = await _context.Configurations
                    .AsNoTracking()
                    .Where(c => !string.IsNullOrEmpty(c.TransmissionType))
                    .Select(c => new TransmissionDto
                    {
                        Type = c.TransmissionType,
                        Description = $"Коробка передач"
                    })
                    .Distinct()
                    .ToListAsync();

                transmissions.AddRange(allTransmissions);
            }

            // Если в БД нет данных о КПП, возвращаем стандартные варианты
            if (!transmissions.Any())
            {
                transmissions = new List<TransmissionDto>
                {
                    new TransmissionDto { Type = "Механика", Description = "Механическая коробка передач" },
                    new TransmissionDto { Type = "Автомат", Description = "Автоматическая коробка передач" },
                    new TransmissionDto { Type = "Вариатор", Description = "Бесступенчатая трансмиссия" },
                    new TransmissionDto { Type = "Робот", Description = "Роботизированная коробка передач" }
                };
            }

            return transmissions.OrderBy(t => t.Type).ToList();
        }

        public async Task<List<CarDto>> GetCatalogListingsAsync(
            string? listingType = null,
            string? brand = null,
            string? bodyType = null,
            string? search = null,
            bool publishedOnly = true)
        {
            var query = _context.Cars
                .Include(c => c.Model)
                    .ThenInclude(m => m!.Brand)
                .AsQueryable();

            if (publishedOnly)
                query = query.Where(c => c.IsPublished);

            if (!string.IsNullOrWhiteSpace(listingType))
                query = query.Where(c => c.ListingType == listingType);

            if (!string.IsNullOrWhiteSpace(brand))
                query = query.Where(c => (c.CatalogBrand ?? c.Model!.Brand!.BrandName).Contains(brand));

            if (!string.IsNullOrWhiteSpace(bodyType))
                query = query.Where(c => (c.CatalogBodyType ?? c.Model!.BodyType) == bodyType);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                query = query.Where(c =>
                    (c.CatalogTitle ?? "").Contains(s) ||
                    (c.CatalogBrand ?? "").Contains(s) ||
                    (c.CatalogModel ?? "").Contains(s));
            }

            var cars = await query
                .OrderByDescending(c => c.CreatedAt)
                .ThenByDescending(c => c.CarId)
                .ToListAsync();

            return cars.Select(CarMapping.ToDto).ToList();
        }

        public async Task<(CarDto? car, string? error)> CreateInventoryCarAsync(CreateInventoryCarDto dto)
        {
            var model = await _context.Models
                .Include(m => m.Brand)
                .FirstOrDefaultAsync(m => m.ModelId == dto.ModelId);

            if (model == null)
                return (null, "Модель не найдена в справочнике");

            var color = dto.Color?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(color))
                return (null, "Укажите цвет автомобиля");

            var colorExists = await _context.Colors.AnyAsync(c => c.ColorName == color);
            if (!colorExists)
                return (null, $"Цвет «{color}» не найден в справочнике");

            var vin = dto.Vin?.Trim().ToUpperInvariant() ?? string.Empty;
            if (vin.Length != 17)
                return (null, "VIN должен содержать ровно 17 символов");

            if (await _context.Cars.AnyAsync(c => c.Vin == vin))
                return (null, $"Автомобиль с VIN {vin} уже существует");

            var status = string.IsNullOrWhiteSpace(dto.Status) ? "Available" : dto.Status.Trim();
            if (status is not ("Available" or "Reserved" or "Sold"))
                return (null, "Недопустимый статус. Доступны: В наличии, Забронирован, Продан");

            if (dto.Mileage < 0)
                return (null, "Пробег не может быть отрицательным");

            var car = new Car
            {
                ModelId = model.ModelId,
                Color = color,
                Vin = vin,
                Status = status,
                Mileage = dto.Mileage,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Cars.Add(car);
            await _context.SaveChangesAsync();
            return (await GetCarByIdAsync(car.CarId), null);
        }

        public async Task<CarDto> CreateCarListingAsync(SaveCarListingDto dto)
        {
            var car = new Car
            {
                CreatedAt = DateTime.UtcNow,
            };
            CarMapping.ApplySaveDto(car, dto);
            _context.Cars.Add(car);
            await _context.SaveChangesAsync();
            return CarMapping.ToDto(car);
        }

        public async Task<CarDto> UpdateCarListingAsync(int id, SaveCarListingDto dto)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
                return null!;

            CarMapping.ApplySaveDto(car, dto);
            await _context.SaveChangesAsync();
            return await GetCarByIdAsync(id);
        }

        public async Task<bool> DeleteCarListingAsync(int id)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null)
                return false;

            car.IsPublished = false;
            car.Status = "Archived";
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
