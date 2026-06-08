using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        
        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto orderDto)
        {
            try
            {
                var order = await _orderService.CreateOrderAsync(orderDto);
                return Ok(new
                {
                    Message = "Order created successfully",
                    OrderId = order.OrderId,
                    TotalPrice = order.TotalPrice
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("quote")]
        public async Task<ActionResult<PricingQuoteDto>> GetQuote([FromBody] PricingQuoteRequestDto quoteDto)
        {
            try
            {
                var quote = await _orderService.GetPricingQuoteAsync(quoteDto);
                return Ok(quote);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.GetBaseException().Message });
            }
        }

        [HttpPost("reserve-24h")]
        public async Task<ActionResult<ReserveCarResponseDto>> ReserveCar24h([FromBody] ReserveCarRequestDto dto)
        {
            try
            {
                return Ok(await _orderService.ReserveCar24hAsync(dto));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.GetBaseException().Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<OrderDto>>> GetUserOrders(int userId)
        {
            try
            {
                var orders = await _orderService.GetUserOrdersAsync(userId);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для получения всех заказов в системе.
        /// Доступен только для администраторов.
        /// </summary>
        /// <returns>
        /// 200 OK - успешное получение списка заказов
        /// 401 Unauthorized - пользователь не авторизован
        /// 403 Forbidden - у пользователя нет прав администратора
        /// </returns>
        [HttpGet]
        // [Authorize(Roles = "Admin")] // Временно отключено - требуется настройка аутентификации
        public async Task<ActionResult<List<OrderDto>>> GetAllOrders()
        {
            try
            {
                var orders = await _orderService.GetAllOrdersAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для обновления статуса заказа.
        /// Доступен только для администраторов.
        /// </summary>
        /// <param name="orderId">Идентификатор заказа, статус которого нужно обновить</param>
        /// <param name="statusDto">DTO с новым статусом и примечаниями</param>
        /// <returns>
        /// 200 OK - статус заказа успешно обновлен
        /// 401 Unauthorized - пользователь не авторизован
        /// 403 Forbidden - у пользователя нет прав администратора
        /// 404 NotFound - заказ не найден
        /// </returns>
        [HttpPut("{orderId}/status")]
        // [Authorize(Roles = "Admin")] // Временно отключено - требуется настройка аутентификации
        public async Task<IActionResult> UpdateOrderStatus(int orderId, [FromBody] UpdateOrderStatusDto statusDto)
        {
            try
            {
                var success = await _orderService.UpdateOrderStatusAsync(orderId, statusDto.Status, statusDto.Notes);

                if (!success)
                    return NotFound();

                return Ok(new { Message = "Order status updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для получения отчета о продажах.
        /// Формирует отчет о продажах за указанный период времени с возможностью фильтрации по бренду.
        /// Доступен только для администраторов.
        /// </summary>
        /// <param name="startDate">Начальная дата периода для формирования отчета (опционально, из query string).</param>
        /// <param name="endDate">Конечная дата периода для формирования отчета (опционально, из query string).</param>
        /// <param name="brandId">Идентификатор бренда для фильтрации отчета (опционально, из query string).</param>
        /// <returns>
        /// 200 OK - успешное получение отчета, возвращает список данных отчета о продажах.
        /// 400 BadRequest - ошибка при формировании отчета (неверные параметры или ошибка сервиса).
        /// 401 Unauthorized - пользователь не авторизован
        /// 403 Forbidden - у пользователя нет прав администратора
        /// </returns>
        [HttpGet("reports/sales")]
        // [Authorize(Roles = "Admin")] // Временно отключено - требуется настройка аутентификации
        public async Task<ActionResult<List<SalesReportDto>>> GetSalesReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? brandId)
        {
            try
            {
                // Логика формирования отчета только для администраторов
                // Вызываем сервис для генерации отчета с переданными параметрами периода и фильтрации по бренду
                var report = await _orderService.GetSalesReportAsync(startDate, endDate, brandId);
                
                // Возвращаем отчет в формате JSON с HTTP статусом 200 OK
                return Ok(report);
            }
            catch (Exception ex)
            {
                // Обработка ошибок: возвращаем HTTP 400 BadRequest с сообщением об ошибке
                return BadRequest(new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Эндпоинт для удаления заказа.
        /// Доступен только для администраторов.
        /// </summary>
        [HttpDelete("{orderId}")]
        public async Task<IActionResult> DeleteOrder(int orderId)
        {
            try
            {
                var success = await _orderService.DeleteOrderAsync(orderId);
                if (!success)
                    return NotFound();

                return Ok(new { Message = "Order deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
