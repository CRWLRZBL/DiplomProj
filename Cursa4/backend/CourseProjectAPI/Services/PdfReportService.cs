using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace CourseProjectAPI.Services
{
    public class PdfReportService : IPdfReportService
    {
        private readonly AutoSalonContext _context;
        private readonly IOrderService _orderService;

        public PdfReportService(AutoSalonContext context, IOrderService orderService)
        {
            _context = context;
            _orderService = orderService;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<byte[]> GenerateSalesReportPdfAsync(DateTime startDate, DateTime endDate, int? brandId = null)
        {
            var report = await _orderService.GetSalesReportAsync(startDate, endDate, brandId);
            
            // Получаем общую статистику
            var totalOrders = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.OrderStatus == "Completed")
                .Where(o => brandId == null || o.Car.Model.Brand.BrandId == brandId)
                .CountAsync();

            var totalRevenue = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.OrderStatus == "Completed")
                .Where(o => brandId == null || o.Car.Model.Brand.BrandId == brandId)
                .SumAsync(o => o.TotalPrice);

            var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                    page.Header()
                        .AlignCenter()
                        .Text("ОТЧЕТ ПО ПРОДАЖАМ")
                        .FontSize(20)
                        .Bold()
                        .FontColor(Colors.Blue.Darken2);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(20);

                            // Период отчета
                            column.Item().PaddingBottom(10).Text(text =>
                            {
                                text.Span("Период: ").Bold();
                                text.Span($"{startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy}");
                            });

                            // Общая статистика
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("Всего заказов").Bold();
                                    header.Cell().Element(CellStyle).Text("Общая выручка").Bold();
                                    header.Cell().Element(CellStyle).Text("Средний чек").Bold();
                                    header.Cell().Element(CellStyle).Text("Моделей продано").Bold();
                                });

                                table.Cell().Element(CellStyle).Text(totalOrders.ToString());
                                table.Cell().Element(CellStyle).Text($"{totalRevenue:N2} ₽");
                                table.Cell().Element(CellStyle).Text($"{averageOrderValue:N2} ₽");
                                table.Cell().Element(CellStyle).Text(report.Count.ToString());
                            });

                            // Детализация по моделям
                            if (report.Any())
                            {
                                column.Item().PaddingTop(10).Text("Детализация по моделям:").Bold().FontSize(12);
                                
                                column.Item().Table(table =>
                                {
                                    table.ColumnsDefinition(columns =>
                                    {
                                        columns.RelativeColumn(2);
                                        columns.RelativeColumn(2);
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                        columns.RelativeColumn();
                                    });

                                    table.Header(header =>
                                    {
                                        header.Cell().Element(CellStyle).Text("Марка").Bold();
                                        header.Cell().Element(CellStyle).Text("Модель").Bold();
                                        header.Cell().Element(CellStyle).AlignRight().Text("Заказов").Bold();
                                        header.Cell().Element(CellStyle).AlignRight().Text("Выручка").Bold();
                                        header.Cell().Element(CellStyle).AlignRight().Text("Средний чек").Bold();
                                    });

                                    foreach (var item in report)
                                    {
                                        table.Cell().Element(CellStyle).Text(item.BrandName);
                                        table.Cell().Element(CellStyle).Text(item.ModelName);
                                        table.Cell().Element(CellStyle).AlignRight().Text(item.TotalOrders.ToString());
                                        table.Cell().Element(CellStyle).AlignRight().Text($"{item.TotalRevenue:N2} ₽");
                                        table.Cell().Element(CellStyle).AlignRight().Text($"{item.AverageOrderValue:N2} ₽");
                                    }
                                });
                            }
                            else
                            {
                                column.Item().Text("За выбранный период продаж не было.").Italic();
                            }

                            // Подвал
                            column.Item().AlignRight().Text(text =>
                            {
                                text.Span("Сформировано: ").FontSize(8);
                                text.Span(DateTime.Now.ToString("dd.MM.yyyy HH:mm")).FontSize(8);
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.CurrentPageNumber();
                            x.Span(" / ");
                            x.TotalPages();
                        });
                });
            });

            return document.GeneratePdf();
        }

        private static IContainer CellStyle(IContainer container)
        {
            return container
                .Border(1)
                .BorderColor(Colors.Grey.Lighten2)
                .Padding(8)
                .Background(Colors.White);
        }
    }
}

