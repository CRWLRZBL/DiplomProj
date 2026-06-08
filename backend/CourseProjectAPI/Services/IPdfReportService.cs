namespace CourseProjectAPI.Services
{
    public interface IPdfReportService
    {
        Task<byte[]> GenerateSalesReportPdfAsync(DateTime startDate, DateTime endDate, int? brandId = null);
    }
}

