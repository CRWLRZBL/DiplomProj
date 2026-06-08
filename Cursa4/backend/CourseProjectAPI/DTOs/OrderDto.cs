namespace CourseProjectAPI.DTOs
{
    public class OrderDto
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; }
        public string CarModel { get; set; }
        public string Configuration { get; set; }
        public decimal TotalPrice { get; set; }
        public string OrderStatus { get; set; }
        public DateTime OrderDate { get; set; }
        public List<OrderOptionDto> Options { get; set; } = new();
    }
}
