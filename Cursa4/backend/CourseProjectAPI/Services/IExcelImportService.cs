using CourseProjectAPI.Models;

namespace CourseProjectAPI.Services
{
    public interface IExcelImportService
    {
        Task<ImportResult> ImportCarsFromExcelAsync(Stream excelStream);
        byte[] GenerateExcelTemplate();
    }

    public class ImportResult
    {
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<Car> ImportedCars { get; set; } = new();
    }
}

