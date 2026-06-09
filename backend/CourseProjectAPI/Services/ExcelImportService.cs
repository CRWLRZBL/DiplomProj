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

            worksheet.Cells[1, 1].Value = "Марка";
            worksheet.Cells[1, 2].Value = "Модель";
            worksheet.Cells[1, 3].Value = "Цвет";
            worksheet.Cells[1, 4].Value = "VIN";
            worksheet.Cells[1, 5].Value = "Статус";
            worksheet.Cells[1, 6].Value = "Пробег";

            using (var range = worksheet.Cells[1, 1, 1, 6])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightBlue);
            }

            worksheet.Cells[2, 1].Value = "LADA";
            worksheet.Cells[2, 2].Value = "Granta Седан";
            worksheet.Cells[2, 3].Value = "Ледниковый";
            worksheet.Cells[2, 4].Value = "X9FMXXEEBDM123456";
            worksheet.Cells[2, 5].Value = "В наличии";
            worksheet.Cells[2, 6].Value = 0;

            worksheet.Cells[3, 1].Value = "LADA";
            worksheet.Cells[3, 2].Value = "Vesta Седан";
            worksheet.Cells[3, 3].Value = "Пантера";
            worksheet.Cells[3, 4].Value = "X9FMXXEEBDM123457";
            worksheet.Cells[3, 5].Value = "В наличии";
            worksheet.Cells[3, 6].Value = 0;

            worksheet.Cells[5, 1].Value = "Обязательные поля: Марка, Модель, VIN";
            worksheet.Cells[6, 1].Value = "Доступные статусы: В наличии, Забронирован, Продан";

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

                var startRow = 2;
                var endRow = worksheet.Dimension?.End.Row ?? startRow;

                for (int row = startRow; row <= endRow; row++)
                {
                    try
                    {
                        var brandCell = worksheet.Cells[row, 1];
                        var modelNameCell = worksheet.Cells[row, 2];
                        var colorCell = worksheet.Cells[row, 3];
                        var vinCell = worksheet.Cells[row, 4];
                        var statusCell = worksheet.Cells[row, 5];
                        var mileageCell = worksheet.Cells[row, 6];

                        var brandName = brandCell.Value?.ToString()?.Trim() ?? "";
                        var modelName = modelNameCell.Value?.ToString()?.Trim() ?? "";
                        var vin = vinCell.Value?.ToString()?.Trim().ToUpperInvariant() ?? "";

                        if (string.IsNullOrWhiteSpace(brandName) &&
                            string.IsNullOrWhiteSpace(modelName) &&
                            string.IsNullOrWhiteSpace(vin))
                            continue;

                        if (string.IsNullOrWhiteSpace(brandName))
                        {
                            result.Errors.Add($"Строка {row}: не указана марка (обязательное поле)");
                            result.ErrorCount++;
                            continue;
                        }

                        if (string.IsNullOrWhiteSpace(modelName))
                        {
                            result.Errors.Add($"Строка {row}: не указана модель (обязательное поле)");
                            result.ErrorCount++;
                            continue;
                        }

                        if (string.IsNullOrWhiteSpace(vin))
                        {
                            result.Errors.Add($"Строка {row}: не указан VIN (обязательное поле)");
                            result.ErrorCount++;
                            continue;
                        }

                        if (vin.Length != 17)
                        {
                            result.Errors.Add($"Строка {row}: VIN должен содержать 17 символов");
                            result.ErrorCount++;
                            continue;
                        }

                        var model = await _context.Models
                            .Include(m => m.Brand)
                            .FirstOrDefaultAsync(m =>
                                m.ModelName == modelName &&
                                m.Brand!.BrandName == brandName);

                        if (model == null)
                        {
                            result.Errors.Add($"Строка {row}: модель «{brandName} {modelName}» не найдена в справочнике");
                            result.ErrorCount++;
                            continue;
                        }

                        var color = colorCell.Value?.ToString()?.Trim() ?? "Ледниковый";
                        var colorExists = await _context.Colors.AnyAsync(c => c.ColorName == color);
                        if (!colorExists)
                        {
                            result.Errors.Add($"Строка {row}: цвет «{color}» не найден в справочнике");
                            result.ErrorCount++;
                            continue;
                        }

                        var statusRu = statusCell.Value?.ToString()?.Trim() ?? "В наличии";
                        var status = statusRu switch
                        {
                            "В наличии" => "Available",
                            "Забронирован" => "Reserved",
                            "Продан" => "Sold",
                            _ => statusRu
                        };

                        var mileage = 0;
                        if (mileageCell.Value != null && int.TryParse(mileageCell.Value.ToString(), out int parsedMileage))
                            mileage = parsedMileage;

                        if (mileage < 0)
                        {
                            result.Errors.Add($"Строка {row}: пробег не может быть отрицательным");
                            result.ErrorCount++;
                            continue;
                        }

                        if (await _context.Cars.AnyAsync(c => c.Vin == vin))
                        {
                            result.Errors.Add($"Строка {row}: автомобиль с VIN {vin} уже существует");
                            result.ErrorCount++;
                            continue;
                        }

                        if (status is not ("Available" or "Reserved" or "Sold"))
                        {
                            result.Errors.Add($"Строка {row}: недопустимый статус «{statusRu}». Доступны: В наличии, Забронирован, Продан");
                            result.ErrorCount++;
                            continue;
                        }

                        var car = new Car
                        {
                            ModelId = model.ModelId,
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
    }
}
