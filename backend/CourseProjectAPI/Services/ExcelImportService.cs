using CourseProjectAPI.Data;
using CourseProjectAPI.Models;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace CourseProjectAPI.Services
{
    public class ExcelImportService : IExcelImportService
    {
        private readonly AutoSalonContext _context;

        public ExcelImportService(AutoSalonContext context)
        {
            _context = context;
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public byte[] GenerateExcelTemplate()
        {
            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Автомобили");

            // Заголовки
            worksheet.Cells[1, 1].Value = "Модель";
            worksheet.Cells[1, 2].Value = "Цвет";
            worksheet.Cells[1, 3].Value = "VIN";
            worksheet.Cells[1, 4].Value = "Статус";
            worksheet.Cells[1, 5].Value = "Пробег";

            // Стилизация заголовков
            using (var range = worksheet.Cells[1, 1, 1, 5])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightBlue);
            }

            // Пример данных
            worksheet.Cells[2, 1].Value = "Granta Седан";
            worksheet.Cells[2, 2].Value = "Ледниковый";
            worksheet.Cells[2, 3].Value = "X9FMXXEEBDM123456";
            worksheet.Cells[2, 4].Value = "В наличии";
            worksheet.Cells[2, 5].Value = 0;

            worksheet.Cells[3, 1].Value = "Vesta Седан";
            worksheet.Cells[3, 2].Value = "Пантера";
            worksheet.Cells[3, 3].Value = "X9FMXXEEBDM123457";
            worksheet.Cells[3, 4].Value = "В наличии";
            worksheet.Cells[3, 5].Value = 0;

            // Добавляем комментарий с доступными статусами
            worksheet.Cells[5, 1].Value = "Доступные статусы:";
            worksheet.Cells[6, 1].Value = "В наличии, Забронирован, Продан";

            // Автоподбор ширины колонок
            worksheet.Cells.AutoFitColumns();

            return package.GetAsByteArray();
        }

        public async Task<ImportResult> ImportCarsFromExcelAsync(Stream excelStream)
        {
            var result = new ImportResult();

            try
            {
                using var package = new ExcelPackage(excelStream);
                var worksheet = package.Workbook.Worksheets[0];

                if (worksheet == null)
                {
                    result.Errors.Add("Лист не найден в файле Excel");
                    return result;
                }

                var startRow = 2; // Пропускаем заголовок
                var endRow = worksheet.Dimension?.End.Row ?? startRow;

                for (int row = startRow; row <= endRow; row++)
                {
                    try
                    {
                        // Читаем данные из строки
                        var modelNameCell = worksheet.Cells[row, 1];
                        var colorCell = worksheet.Cells[row, 2];
                        var vinCell = worksheet.Cells[row, 3];
                        var statusCell = worksheet.Cells[row, 4];
                        var mileageCell = worksheet.Cells[row, 5];

                        // Проверяем, что строка не пустая
                        if (modelNameCell.Value == null || string.IsNullOrWhiteSpace(modelNameCell.Value.ToString()))
                            continue;

                        // Получаем название модели
                        var modelName = modelNameCell.Value.ToString()?.Trim() ?? "";
                        
                        // Ищем модель по названию
                        var model = await _context.Models
                            .FirstOrDefaultAsync(m => m.ModelName == modelName);
                        
                        if (model == null)
                        {
                            result.Errors.Add($"Строка {row}: Модель '{modelName}' не найдена");
                            result.ErrorCount++;
                            continue;
                        }
                        
                        var modelId = model.ModelId;

                        var color = colorCell.Value?.ToString()?.Trim() ?? "Ледниковый";
                        var vin = vinCell.Value?.ToString()?.Trim() ?? "";
                        
                        // Валидация цвета - проверяем, существует ли цвет в базе данных
                        var colorExists = await _context.Colors.AnyAsync(c => c.ColorName == color);
                        if (!colorExists)
                        {
                            result.Errors.Add($"Строка {row}: Цвет '{color}' не найден в базе данных");
                            result.ErrorCount++;
                            continue;
                        }
                        
                        // Преобразуем статус из русского в английский
                        var statusRu = statusCell.Value?.ToString()?.Trim() ?? "В наличии";
                        var status = statusRu switch
                        {
                            "В наличии" => "Available",
                            "Забронирован" => "Reserved",
                            "Продан" => "Sold",
                            _ => statusRu // Если уже на английском, оставляем как есть
                        };
                        
                        var mileage = 0;

                        if (mileageCell.Value != null && int.TryParse(mileageCell.Value.ToString(), out int parsedMileage))
                        {
                            mileage = parsedMileage;
                        }

                        // Валидация данных
                        if (mileage < 0)
                        {
                            result.Errors.Add($"Строка {row}: Пробег не может быть отрицательным");
                            result.ErrorCount++;
                            continue;
                        }

                        // Проверяем уникальность VIN
                        if (!string.IsNullOrEmpty(vin))
                        {
                            var vinExists = await _context.Cars.AnyAsync(c => c.Vin == vin);
                            if (vinExists)
                            {
                                result.Errors.Add($"Строка {row}: Автомобиль с VIN {vin} уже существует");
                                result.ErrorCount++;
                                continue;
                            }
                        }
                        else
                        {
                            // Генерируем уникальный VIN, если не указан
                            vin = GenerateUniqueVin();
                        }

                        // Валидация статуса
                        if (status != "Available" && status != "Reserved" && status != "Sold")
                        {
                            result.Errors.Add($"Строка {row}: Недопустимый статус '{statusRu}'. Доступные: В наличии, Забронирован, Продан");
                            result.ErrorCount++;
                            continue;
                        }

                        // Создаем автомобиль
                        var car = new Car
                        {
                            ModelId = modelId,
                            Color = color,
                            Vin = vin,
                            Status = status,
                            Mileage = mileage,
                            CreatedAt = DateTime.Now
                        };

                        _context.Cars.Add(car);
                        result.ImportedCars.Add(car);
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Строка {row}: {ex.Message}");
                        result.ErrorCount++;
                    }
                }

                // Сохраняем все изменения
                if (result.ImportedCars.Any())
                {
                    await _context.SaveChangesAsync();
                    result.SuccessCount = result.ImportedCars.Count;
                }
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Ошибка при чтении файла: {ex.Message}");
                result.ErrorCount++;
            }

            return result;
        }

        private string GenerateUniqueVin()
        {
            var random = new Random();
            var vin = $"X9FMXXEEBDM{random.Next(100000, 999999)}";
            
            // Проверяем уникальность
            while (_context.Cars.Any(c => c.Vin == vin))
            {
                vin = $"X9FMXXEEBDM{random.Next(100000, 999999)}";
            }

            return vin;
        }
    }
}

