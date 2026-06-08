namespace CourseProjectAPI.DTOs
{
    public class SalesReportDto
    {
        public string BrandName { get; set; }
        public string ModelName { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
    }
}
