using System.Text.Json;
using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Controllers;

[ApiController]
[Route("api/test-drives")]
public class TestDrivesController : ControllerBase
{
    private readonly AutoSalonContext _context;
    private readonly IOrderService _orderService;

    public TestDrivesController(AutoSalonContext context, IOrderService orderService)
    {
        _context = context;
        _orderService = orderService;
    }

    [HttpGet("slots")]
    public ActionResult<List<TestDriveSlotDto>> GetSlots([FromQuery] DateTime? dateUtc)
    {
        var day = (dateUtc ?? DateTime.UtcNow).Date;
        var slotTimes = TestDriveSlotGenerator.GenerateTestDriveSlots(day);
        var slots = slotTimes
            .Select(t => new TestDriveSlotDto { StartsAtUtc = t, DurationMinutes = TestDriveSlotGenerator.SlotDurationMinutes })
            .ToList();

        return Ok(slots);
    }

    [HttpPost("book")]
    public async Task<ActionResult<BookTestDriveResponseDto>> Book([FromBody] BookTestDriveRequestDto dto)
    {
        try
        {
            if (dto.UserId <= 0) return BadRequest(new { Error = "UserId is required" });
            if (dto.CarId <= 0) return BadRequest(new { Error = "CarId is required" });
            if (dto.StartsAtUtc == default) return BadRequest(new { Error = "StartsAtUtc is required" });

            var car = await _context.Cars
                .Include(c => c.Model)
                .FirstOrDefaultAsync(c => c.CarId == dto.CarId);

            if (car == null) return BadRequest(new { Error = "Car not found" });
            if (!string.Equals(car.Status, "Available", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { Error = "Car is not available for test drive" });

            // Prevent double-booking in this MVP: one slot per car at a time
            var slotEnd = dto.StartsAtUtc.AddMinutes(TestDriveSlotGenerator.SlotDurationMinutes);
            var overlap = await _context.Orders
                .AsNoTracking()
                .Where(o => o.CarId == dto.CarId && o.OrderStatus == "TestDriveBooked")
                .Where(o => o.Notes != null && o.Notes.Contains("\"startsAtUtc\""))
                .AnyAsync(o =>
                    o.Notes != null &&
                    o.Notes.Contains(dto.StartsAtUtc.ToString("O"), StringComparison.OrdinalIgnoreCase));

            if (overlap)
                return BadRequest(new { Error = "Selected slot is already booked" });

            var configurationId = dto.ConfigurationId;
            if (!configurationId.HasValue || configurationId.Value <= 0)
            {
                configurationId = await _context.Configurations
                    .AsNoTracking()
                    .Where(c => c.ModelId == car.ModelId)
                    .OrderBy(c => c.AdditionalPrice)
                    .Select(c => c.ConfigurationId)
                    .FirstOrDefaultAsync();
            }

            if (!configurationId.HasValue || configurationId.Value <= 0)
                return BadRequest(new { Error = "No configurations available for this model" });

            PricingQuoteDto? quote = null;
            try
            {
                quote = await _orderService.GetPricingQuoteAsync(new PricingQuoteRequestDto
                {
                    CarId = dto.CarId,
                    ConfigurationId = configurationId.Value,
                    Color = dto.Color ?? car.Color,
                    OptionIds = dto.OptionIds ?? new List<int>()
                });
            }
            catch
            {
                // quote is optional for booking
            }

            var payload = new
            {
                startsAtUtc = DateTime.SpecifyKind(dto.StartsAtUtc, DateTimeKind.Utc),
                endsAtUtc = DateTime.SpecifyKind(slotEnd, DateTimeKind.Utc),
                routeType = dto.RouteType,
                childSeat = dto.ChildSeat,
                notes = dto.Notes
            };

            var order = new Order
            {
                UserId = dto.UserId,
                CarId = dto.CarId,
                ConfigurationId = configurationId.Value,
                TotalPrice = quote?.TotalPrice ?? 0m,
                OrderStatus = "TestDriveBooked",
                OrderDate = DateTime.Now,
                Notes = JsonSerializer.Serialize(payload)
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                Status = "TestDriveBooked",
                ChangedAt = DateTime.Now,
                Notes = $"Test drive booked for {dto.StartsAtUtc:O}"
            });
            await _context.SaveChangesAsync();

            return Ok(new BookTestDriveResponseDto
            {
                OrderId = order.OrderId,
                StartsAtUtc = DateTime.SpecifyKind(dto.StartsAtUtc, DateTimeKind.Utc),
                DurationMinutes = TestDriveSlotGenerator.SlotDurationMinutes,
                Quote = quote
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<BookTestDriveResponseDto>>> GetUserBookings(int userId)
    {
        if (userId <= 0) return BadRequest(new { Error = "Invalid userId" });

        var rows = await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId && o.OrderStatus == "TestDriveBooked")
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var items = new List<BookTestDriveResponseDto>(rows.Count);
        foreach (var o in rows)
        {
            var startsAt = DateTime.SpecifyKind(o.OrderDate.ToUniversalTime(), DateTimeKind.Utc);
            try
            {
                if (!string.IsNullOrWhiteSpace(o.Notes))
                {
                    using var doc = JsonDocument.Parse(o.Notes);
                    if (doc.RootElement.TryGetProperty("startsAtUtc", out var p) && p.ValueKind == JsonValueKind.String)
                    {
                        if (DateTime.TryParse(p.GetString(), null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
                        {
                            startsAt = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
                        }
                    }
                }
            }
            catch
            {
                // ignore malformed notes
            }

            items.Add(new BookTestDriveResponseDto
            {
                OrderId = o.OrderId,
                StartsAtUtc = startsAt,
                DurationMinutes = TestDriveSlotGenerator.SlotDurationMinutes,
                Quote = null
            });
        }

        return Ok(items);
    }
}

