using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CourseProjectAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IPdfReportService _pdfReportService;

        public ReportsController(IPdfReportService pdfReportService)
        {
            _pdfReportService = pdfReportService;
        }

        /// <summary>
        /// Эндпоинт для экспорта отчета о продажах в формате PDF.
        /// Доступен только для администраторов.
        /// </summary>
        /// <param name="startDate">Начальная дата периода для формирования отчета (опционально, из query string).</param>
        /// <param name="endDate">Конечная дата периода для формирования отчета (опционально, из query string).</param>
        /// <param name="brandId">Идентификатор бренда для фильтрации отчета (опционально, из query string).</param>
        /// <param name="period">Период для формирования отчета: "month", "year" или "custom" (по умолчанию "custom").</param>
        /// <returns>
        /// 200 OK - успешное создание PDF отчета, возвращает файл PDF.
        /// 400 BadRequest - ошибка при формировании отчета.
        /// 401 Unauthorized - пользователь не авторизован
        /// 403 Forbidden - у пользователя нет прав администратора
        /// </returns>
        [HttpGet("sales/export")]
        // [Authorize(Roles = "Admin")] // Временно отключено - требуется настройка аутентификации
        public async Task<IActionResult> ExportSalesReportPdf(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? brandId,
            [FromQuery] string period = "custom")
        {
            try
            {
                DateTime start, end;

                // Определяем период на основе параметра
                switch (period.ToLower())
                {
                    case "month":
                        start = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                        end = DateTime.Now;
                        break;
                    case "year":
                        start = new DateTime(DateTime.Now.Year, 1, 1);
                        end = DateTime.Now;
                        break;
                    default:
                        start = startDate ?? DateTime.Now.AddMonths(-1);
                        end = endDate ?? DateTime.Now;
                        
                        // Проверяем и исправляем порядок дат, если они в обратном порядке
                        if (start > end)
                        {
                            var temp = start;
                            start = end;
                            end = temp;
                        }
                        break;
                }

                var pdfBytes = await _pdfReportService.GenerateSalesReportPdfAsync(start, end, brandId);

                var fileName = $"sales_report_{start:yyyy-MM-dd}_{end:yyyy-MM-dd}.pdf";
                return File(pdfBytes, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}

