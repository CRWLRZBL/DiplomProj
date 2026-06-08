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
                var brands = await _context.Brands.ToListAsync();
                return Ok(brands);
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
                var bodyTypes = await _context.Models
                    .Select(m => m.BodyType)
                    .Distinct()
                    .ToListAsync();
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
                if (string.IsNullOrWhiteSpace(dto.BrandName) || string.IsNullOrWhiteSpace(dto.ModelName))
                    return BadRequest(new { Error = "Укажите марку и модель." });

                var created = await _carService.CreateCarListingAsync(dto);
                return CreatedAtAction(nameof(GetCar), new { id = created.CarId }, created);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPut("catalog/{id}")]
        public async Task<ActionResult<CarDto>> UpdateCatalogListing(int id, [FromBody] SaveCarListingDto dto)
        {
            try
            {
                var updated = await _carService.UpdateCarListingAsync(id, dto);
                if (updated == null)
                    return NotFound();

                return Ok(updated);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
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
                return StatusCode(500, new { Error = ex.Message });
            }
        }
    }
}
