using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;

namespace CourseProjectAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;
        private readonly AutoSalonContext _context;
        private readonly ILogger<CarsController> _logger;

        public CarsController(ICarService carService, AutoSalonContext context, ILogger<CarsController> logger)
        {
            _carService = carService;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<CarDto>>> GetCars(
    [FromQuery] string brand = null,    // Параметр фильтрации по марке автомобиля
    [FromQuery] string bodyType = null, // Параметр фильтрации по типу кузова
    [FromQuery] bool all = false)       // Флаг для получения всех записей (включая недоступные)
{
    try
    {
        // Проверка флага 'all' - если true, возвращаем все автомобили без фильтрации
        if (all)
        {
            // Вызов сервисного метода для получения всех автомобилей из БД
            var allCars = await _carService.GetAllCarsAsync();
            // Возврат успешного HTTP-ответа (200 OK) со списком автомобилей
            return Ok(allCars);
        }
        
        // Если флаг 'all' не установлен, выполняем фильтрацию
        // Вызов сервисного метода для получения доступных автомобилей с учетом фильтров
        var cars = await _carService.GetAvailableCarsAsync(brand, bodyType);
        // Возврат успешного HTTP-ответа (200 OK) с отфильтрованным списком
        return Ok(cars);
    }
    catch (Exception ex) // Обработка исключений, возникших в процессе выполнения
    {
        // Возврат HTTP-ответа 500 Internal Server Error
        // В тело ответа включается объект с информацией об ошибке
        return StatusCode(500, new { Error = ex.Message });
    }
}

        [HttpGet("models")]
        public async Task<ActionResult<List<ModelDto>>> GetModels(
            [FromQuery] string brand = null,
            [FromQuery] string bodyType = null)
        {
            try
            {
                var models = await _carService.GetAvailableModelsAsync(brand, bodyType);
                return Ok(models);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("models/{id}")]
        public async Task<ActionResult<ModelDto>> GetModel(int id)
        {
            try
            {
                var model = await _carService.GetModelByIdAsync(id);

                if (model == null)
                    return NotFound();

                return Ok(model);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CarDto>> GetCar(int id)
        {
            try
            {
                var car = await _carService.GetCarByIdAsync(id);

                if (car == null)
                    return NotFound();

                return Ok(car);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("{carId}/configurations")]
        public async Task<ActionResult<List<ConfigurationDto>>> GetConfigurations(int carId)
        {
            try
            {
                var configurations = await _carService.GetConfigurationsAsync(carId);
                var configurationDtos = configurations.Select(c => new ConfigurationDto
                {
                    ConfigurationId = c.ConfigurationId,
                    ModelId = c.ModelId,
                    ConfigurationName = c.ConfigurationName,
                    Description = c.Description,
                    AdditionalPrice = c.AdditionalPrice,
                    EnginePower = c.EnginePower,
                    EngineCapacity = c.EngineCapacity,
                    FuelType = c.FuelType,
                    TransmissionType = c.TransmissionType
                }).ToList();
                
                return Ok(configurationDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("models/{modelId}/configurations")]
        public async Task<ActionResult<List<ConfigurationDto>>> GetConfigurationsByModelId(int modelId)
        {
            try
            {
                _logger?.LogInformation($"Getting configurations for modelId: {modelId}");
                
                // Прямой запрос к БД для диагностики
                var directQuery = await _context.Configurations
                    .AsNoTracking()
                    .Where(c => c.ModelId == modelId)
                    .ToListAsync();
                
                _logger?.LogInformation($"Direct query returned {directQuery.Count} configurations for modelId: {modelId}");
                
                var configurations = await _carService.GetConfigurationsByModelIdAsync(modelId);
                _logger?.LogInformation($"Service returned {configurations.Count} configurations for modelId: {modelId}");
                
                if (configurations.Count == 0 && directQuery.Count > 0)
                {
                    _logger?.LogWarning($"Service returned 0 but direct query returned {directQuery.Count} - possible service issue");
                }
                
                var configurationDtos = configurations.Select(c => new ConfigurationDto
                {
                    ConfigurationId = c.ConfigurationId,
                    ModelId = c.ModelId,
                    ConfigurationName = c.ConfigurationName ?? string.Empty,
                    Description = c.Description,
                    AdditionalPrice = c.AdditionalPrice,
                    EnginePower = c.EnginePower,
                    EngineCapacity = c.EngineCapacity,
                    FuelType = c.FuelType,
                    TransmissionType = c.TransmissionType
                }).ToList();
                
                _logger?.LogInformation($"Returning {configurationDtos.Count} DTOs for modelId: {modelId}");
                
                return Ok(configurationDtos);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, $"Error getting configurations for modelId: {modelId}");
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        [HttpGet("brands")]
        public async Task<ActionResult<List<Brand>>> GetBrands()
        {
            try
            {
                var dbBrands = await _context.Brands.ToListAsync();
                var catalogBrands = await _context.Cars
                    .Where(c => c.IsPublished && c.CatalogBrand != null && c.CatalogBrand != "")
                    .Select(c => c.CatalogBrand!)
                    .Distinct()
                    .ToListAsync();

                var mergedNames = dbBrands
                    .Select(b => b.BrandName)
                    .Concat(catalogBrands)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(b => b)
                    .ToList();

                var result = mergedNames
                    .Select((name, index) => new Brand
                    {
                        BrandId = index + 1,
                        BrandName = name
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("filters/body-types")]
        public async Task<ActionResult<List<string>>> GetBodyTypes()
        {
            try
            {
                var modelTypes = await _context.Models
                    .Select(m => m.BodyType)
                    .Where(t => t != null && t != "")
                    .Distinct()
                    .ToListAsync();

                var catalogTypes = await _context.Cars
                    .Where(c => c.IsPublished && c.CatalogBodyType != null && c.CatalogBodyType != "")
                    .Select(c => c.CatalogBodyType!)
                    .Distinct()
                    .ToListAsync();

                var bodyTypes = modelTypes
                    .Concat(catalogTypes)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(t => t)
                    .ToList();

                return Ok(bodyTypes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("options")]
        public async Task<ActionResult<List<AdditionalOption>>> GetAdditionalOptions()
        {
            try
            {
                var options = await _context.AdditionalOptions
                    .OrderBy(o => o.Category)
                    .ThenBy(o => o.OptionName)
                    .ToListAsync();
                return Ok(options);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<CarDto>>> SearchCars(
            [FromQuery] string query,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string fuelType = null)
        {
            try
            {
                var cars = await _carService.GetAvailableCarsAsync();

                // Применяем дополнительные фильтры
                if (!string.IsNullOrEmpty(query))
                {
                    cars = cars.Where(c =>
                        c.BrandName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                        c.ModelName.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                        c.Color.Contains(query, StringComparison.OrdinalIgnoreCase))
                        .ToList();
                }

                if (minPrice.HasValue)
                    cars = cars.Where(c => c.BasePrice >= minPrice.Value).ToList();

                if (maxPrice.HasValue)
                    cars = cars.Where(c => c.BasePrice <= maxPrice.Value).ToList();

                if (!string.IsNullOrEmpty(fuelType))
                    cars = cars.Where(c => c.FuelType == fuelType).ToList();

                return Ok(cars);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("colors")]
        public async Task<ActionResult<List<ColorDto>>> GetAvailableColors()
        {
            try
            {
                var colors = await _carService.GetAvailableColorsAsync();
                return Ok(colors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("engines")]
        public async Task<ActionResult<List<EngineDto>>> GetAvailableEngines([FromQuery] int? modelId = null)
        {
            try
            {
                var engines = await _carService.GetAvailableEnginesAsync(modelId);
                return Ok(engines);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("transmissions")]
        public async Task<ActionResult<List<TransmissionDto>>> GetAvailableTransmissions([FromQuery] int? modelId = null)
        {
            try
            {
                var transmissions = await _carService.GetAvailableTransmissionsAsync(modelId);
                return Ok(transmissions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для импорта автомобилей из файла Excel.
        /// Позволяет загрузить файл Excel с данными об автомобилях и автоматически добавить их в базу данных.
        /// </summary>
        /// <param name="file">Загружаемый файл Excel с данными об автомобилях (.xlsx или .xls)</param>
        /// <param name="excelImportService">Сервис для обработки импорта данных из Excel (внедряется через dependency injection)</param>
        /// <returns>
        /// 200 OK - успешный импорт, возвращает результат с количеством успешно импортированных автомобилей и списком ошибок.
        /// 400 BadRequest - файл не загружен или имеет недопустимый формат (не Excel).
        /// 500 InternalServerError - внутренняя ошибка сервера при обработке файла.
        /// </returns>
        [HttpPost("inventory")]
        public async Task<ActionResult<CarDto>> CreateInventoryCar([FromBody] CreateInventoryCarDto dto)
        {
            try
            {
                var (car, error) = await _carService.CreateInventoryCarAsync(dto);
                if (!string.IsNullOrEmpty(error))
                    return BadRequest(new { Error = error });
                return Ok(car);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Не удалось добавить автомобиль. Попробуйте позже." });
            }
        }

        [HttpPost("import/excel")]
        public async Task<IActionResult> ImportCarsFromExcel(IFormFile file, [FromServices] IExcelImportService excelImportService)
        {
            try
            {
                // Проверка наличия файла и его размера
                // Если файл не загружен или пуст, возвращаем ошибку 400
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { Error = "Файл не загружен" });
                }

                // Валидация формата файла: проверяем расширение файла
                // Поддерживаются только файлы Excel с расширениями .xlsx и .xls
                if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) &&
                    !file.FileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { Error = "Поддерживаются только файлы Excel (.xlsx, .xls)" });
                }

                // Открываем поток для чтения файла
                // using гарантирует автоматическое освобождение ресурсов после использования
                using var stream = file.OpenReadStream();
                
                // Вызываем сервис импорта для обработки файла Excel
                // Сервис читает данные из потока, валидирует их и сохраняет в базу данных
                var result = await excelImportService.ImportCarsFromExcelAsync(stream);

                // Возвращаем результат импорта с информацией об успешно импортированных автомобилях
                // и списком ошибок (если они были)
                return Ok(new
                {
                    SuccessCount = result.SuccessCount,    // Количество успешно импортированных автомобилей
                    ErrorCount = result.ErrorCount,        // Количество ошибок при импорте
                    Errors = result.Errors,                // Список описаний ошибок
                    Message = $"Импортировано: {result.SuccessCount}, Ошибок: {result.ErrorCount}"  // Итоговое сообщение
                });
            }
            catch (Exception ex)
            {
                // Обработка неожиданных ошибок при импорте
                // Возвращаем HTTP 500 с сообщением об ошибке для диагностики
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("import/template")]
        public IActionResult DownloadExcelTemplate([FromServices] IExcelImportService excelImportService)
        {
            try
            {
                var templateBytes = excelImportService.GenerateExcelTemplate();
                return File(templateBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "car_import_template.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<CarDto>> UpdateCar(int id, [FromBody] UpdateCarDto updateDto)
        {
            try
            {
                var updatedCar = await _carService.UpdateCarAsync(id, updateDto);
                if (updatedCar == null)
                    return NotFound();

                return Ok(updatedCar);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("catalog")]
        public async Task<ActionResult<List<CarDto>>> GetCatalog(
            [FromQuery] string? listingType = null,
            [FromQuery] string? brand = null,
            [FromQuery] string? bodyType = null,
            [FromQuery] string? search = null,
            [FromQuery] bool all = false)
        {
            try
            {
                var items = await _carService.GetCatalogListingsAsync(
                    listingType, brand, bodyType, search, publishedOnly: !all);
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("catalog")]
        public async Task<ActionResult<CarDto>> CreateCatalogListing([FromBody] SaveCarListingDto dto)
        {
            try
            {
                var validationError = ValidateCatalogListingDto(dto);
                if (validationError != null)
                    return BadRequest(new { Error = validationError });

                var created = await _carService.CreateCarListingAsync(dto);
                return CreatedAtAction(nameof(GetCar), new { id = created.CarId }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Не удалось сохранить карточку. Проверьте данные и попробуйте снова." });
            }
        }

        [HttpPut("catalog/{id}")]
        public async Task<ActionResult<CarDto>> UpdateCatalogListing(int id, [FromBody] SaveCarListingDto dto)
        {
            try
            {
                var validationError = ValidateCatalogListingDto(dto);
                if (validationError != null)
                    return BadRequest(new { Error = validationError });

                var updated = await _carService.UpdateCarListingAsync(id, dto);
                if (updated == null)
                    return NotFound(new { Error = "Автомобиль не найден." });

                return Ok(updated);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Не удалось обновить карточку. Проверьте данные и попробуйте снова." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCar(int id)
        {
            try
            {
                var ok = await _carService.DeleteCarListingAsync(id);
                if (!ok)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpDelete("catalog/{id}")]
        public async Task<ActionResult> DeleteCatalogListing(int id)
        {
            try
            {
                var ok = await _carService.DeleteCarListingAsync(id);
                if (!ok)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>Загрузка изображения для карточки каталога (файл с компьютера).</summary>
        [HttpPost("catalog/upload-image")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult<object>> UploadCatalogImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { Error = "Файл не выбран." });

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
                if (!allowed.Contains(ext))
                    return BadRequest(new { Error = "Допустимы JPG, PNG, WEBP или GIF." });

                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "catalog");
                Directory.CreateDirectory(uploadsDir);

                var fileName = $"{Guid.NewGuid():N}{ext}";
                var fullPath = Path.Combine(uploadsDir, fileName);

                await using (var stream = System.IO.File.Create(fullPath))
                {
                    await file.CopyToAsync(stream);
                }

                var url = $"/uploads/catalog/{fileName}";
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Не удалось загрузить изображение." });
            }
        }

        private static string? ValidateCatalogListingDto(SaveCarListingDto dto)
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(dto.BrandName))
                errors.Add("Укажите марку.");
            else if (dto.BrandName.Length > 80)
                errors.Add("Марка: не более 80 символов.");

            if (string.IsNullOrWhiteSpace(dto.ModelName))
                errors.Add("Укажите модель.");
            else if (dto.ModelName.Length > 80)
                errors.Add("Модель: не более 80 символов.");

            if (string.IsNullOrWhiteSpace(dto.Color))
                errors.Add("Укажите цвет.");
            else if (dto.Color.Length > 50)
                errors.Add("Цвет: не более 50 символов.");

            if (dto.BasePrice < 0 || dto.BasePrice > 999_999_999m)
                errors.Add("Цена: от 0 до 999 999 999 ₽.");

            if (dto.ModelYear == null || dto.ModelYear < 1980 || dto.ModelYear > DateTime.UtcNow.Year + 1)
                errors.Add($"Год выпуска: от 1980 до {DateTime.UtcNow.Year + 1}.");

            var vin = dto.Vin?.Trim().ToUpperInvariant() ?? "";
            if (vin.Length != 17)
                errors.Add("VIN должен содержать 17 символов.");
            else if (!System.Text.RegularExpressions.Regex.IsMatch(vin, @"^[A-Z0-9]{17}$"))
                errors.Add("VIN: только латинские буквы и цифры.");

            if (dto.ListingType == "Used" && (dto.Mileage == null || dto.Mileage < 1 || dto.Mileage > 9_999_999))
                errors.Add("Пробег: от 1 до 9 999 999 км.");

            if (dto.EngineCapacity is < 0 or > 20m)
                errors.Add("Объём двигателя: от 0.1 до 20 л.");

            if (string.IsNullOrWhiteSpace(dto.BodyType))
                errors.Add("Выберите тип кузова.");
            if (string.IsNullOrWhiteSpace(dto.FuelType))
                errors.Add("Выберите тип топлива.");
            if (string.IsNullOrWhiteSpace(dto.Transmission))
                errors.Add("Выберите коробку передач.");
            if (string.IsNullOrWhiteSpace(dto.DriveType))
                errors.Add("Выберите привод.");

            if (dto.TradeInDiscount is < 0 or > 99_999_999m)
                errors.Add("Скидка трейд-ин: от 0 до 99 999 999 ₽.");
            if (dto.CreditDiscount is < 0 or > 99_999_999m)
                errors.Add("Скидка за кредит: от 0 до 99 999 999 ₽.");

            return errors.Count > 0 ? string.Join(" ", errors) : null;
        }
    }
}
