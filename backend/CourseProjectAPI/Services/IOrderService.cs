using CourseProjectAPI.DTOs;

namespace CourseProjectAPI.Services
{
    public interface IOrderService
    {

        Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto);
        Task<PricingQuoteDto> GetPricingQuoteAsync(PricingQuoteRequestDto quoteDto);
        Task<ReserveCarResponseDto> ReserveCar24hAsync(ReserveCarRequestDto dto);
        Task<List<OrderDto>> GetUserOrdersAsync(int userId);
        Task<List<OrderDto>> GetAllOrdersAsync();
        Task<bool> UpdateOrderStatusAsync(int orderId, string status, string notes = null);
        Task<OrderDto> GetOrderByIdAsync(int orderId);
        Task<List<SalesReportDto>> GetSalesReportAsync(DateTime? startDate = null, DateTime? endDate = null, int? brandId = null);
        Task<bool> DeleteOrderAsync(int orderId);
    }
}

