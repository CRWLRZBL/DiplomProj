using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Services
{
    public class OrderService : IOrderService
    {
        private readonly AutoSalonContext _context;
        private const decimal NonBaseColorSurcharge = 20000m;
        private static readonly TimeSpan ReservationTtl = TimeSpan.FromHours(24);

        public OrderService(AutoSalonContext context)
        {
            _context = context;
        }

        public async Task<PricingQuoteDto> GetPricingQuoteAsync(PricingQuoteRequestDto quoteDto)
        {
            // 1) Resolve model/base price
            Model model;
            if (quoteDto.CarId.HasValue)
            {
                var car = await _context.Cars
                    .Include(c => c.Model)
                    .FirstOrDefaultAsync(c => c.CarId == quoteDto.CarId.Value);

                if (car == null) throw new InvalidOperationException("Car not found");
                if (!string.Equals(car.Status, "Available", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Car is not available");

                model = car.Model;
            }
            else
            {
                if (!quoteDto.ModelId.HasValue || quoteDto.ModelId.Value <= 0)
                    throw new InvalidOperationException("ModelId is required when CarId is not provided");

                model = await _context.Models.FirstOrDefaultAsync(m => m.ModelId == quoteDto.ModelId.Value);
                if (model == null) throw new InvalidOperationException("Model not found");
            }

            // 2) Configuration
            var configuration = await _context.Configurations
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.ConfigurationId == quoteDto.ConfigurationId);
            if (configuration == null) throw new InvalidOperationException("Configuration not found");

            // 3) Options
            var optionIds = quoteDto.OptionIds?.Distinct().ToList() ?? new List<int>();
            var options = optionIds.Count == 0
                ? new List<AdditionalOption>()
                : await _context.AdditionalOptions
                    .AsNoTracking()
                    .Where(o => optionIds.Contains(o.OptionId))
                    .ToListAsync();

            // 4) Price calculation
            var basePrice = model.BasePrice;
            var configurationPrice = configuration.AdditionalPrice;
            var optionsPrice = options.Sum(o => o.OptionPrice);
            var colorName = quoteDto.Color;
            var colorPrice =
                !string.IsNullOrWhiteSpace(colorName) &&
                !string.Equals(colorName.Trim(), "Ледниковый", StringComparison.OrdinalIgnoreCase)
                    ? NonBaseColorSurcharge
                    : 0m;

            var total = basePrice + configurationPrice + optionsPrice + colorPrice;

            var quote = new PricingQuoteDto
            {
                BasePrice = basePrice,
                ConfigurationPrice = configurationPrice,
                OptionsPrice = optionsPrice,
                ColorPrice = colorPrice,
                TotalPrice = total,
                Lines = new List<PricingQuoteLineDto>()
            };

            quote.Lines.Add(new PricingQuoteLineDto { Code = "base", Label = "Базовая цена", Amount = basePrice });
            quote.Lines.Add(new PricingQuoteLineDto
            {
                Code = "configuration",
                Label = $"Комплектация: {configuration.ConfigurationName}",
                Amount = configurationPrice
            });
            if (colorPrice > 0m)
            {
                quote.Lines.Add(new PricingQuoteLineDto
                {
                    Code = "color",
                    Label = $"Цвет: {colorName}",
                    Amount = colorPrice
                });
            }
            foreach (var opt in options.OrderBy(o => o.Category).ThenBy(o => o.OptionName))
            {
                quote.Lines.Add(new PricingQuoteLineDto
                {
                    Code = "option",
                    Label = opt.OptionName,
                    Amount = opt.OptionPrice
                });
            }

            return quote;
        }

        public async Task<OrderDto> CreateOrderAsync(CreateOrderDto orderDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                Car car;
                Model model;
                
                // 1. Проверяем или создаем автомобиль
                if (orderDto.CarId.HasValue)
                {
                    // Если указан CarId, проверяем доступность
                    car = await _context.Cars
                        .Include(c => c.Model)
                        .FirstOrDefaultAsync(c => c.CarId == orderDto.CarId.Value && c.Status == "Available");

                    if (car == null)
                        throw new Exception("Car is not available");

                    model = car.Model;
                }
                else
                {
                    // Если CarId не указан, создаем новый автомобиль со статусом "Reserved" (В ожидании)
                    model = await _context.Models
                        .FirstOrDefaultAsync(m => m.ModelId == orderDto.ModelId);

                    if (model == null)
                        throw new Exception("Model not found");

                    // Генерируем VIN
                    var vinPrefix = model.ModelName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, model.ModelName.Length));
                    var vinNumber = DateTime.Now.Ticks.ToString().Substring(10);
                    var vin = $"{vinPrefix}{vinNumber}";

                    car = new Car
                    {
                        ModelId = orderDto.ModelId,
                        Vin = vin,
                        Color = orderDto.Color ?? "Ледниковый",
                        Status = "Reserved", // Статус "В ожидании" (Reserved)
                        Mileage = 0,
                        CreatedAt = DateTime.Now
                    };

                    _context.Cars.Add(car);
                    await _context.SaveChangesAsync(); // Сохраняем, чтобы получить CarId
                }

                // 2. Получаем данные для расчета цены
                var configuration = await _context.Configurations
                    .FirstOrDefaultAsync(c => c.ConfigurationId == orderDto.ConfigurationId);

                if (configuration == null)
                    throw new Exception("Configuration not found");

                var options = await _context.AdditionalOptions
                    .Where(o => orderDto.OptionIds.Contains(o.OptionId))
                    .ToListAsync();

                // 3. Рассчитываем общую цену
                var colorName = orderDto.Color;
                var colorPrice =
                    !string.IsNullOrWhiteSpace(colorName) &&
                    !string.Equals(colorName.Trim(), "Ледниковый", StringComparison.OrdinalIgnoreCase)
                        ? NonBaseColorSurcharge
                        : 0m;

                var totalPrice = model.BasePrice + configuration.AdditionalPrice + options.Sum(o => o.OptionPrice) + colorPrice;

                // 4. Создаем заказ
                var order = new Order
                {
                    UserId = orderDto.UserId,
                    CarId = car.CarId,
                    ConfigurationId = orderDto.ConfigurationId,
                    TotalPrice = totalPrice,
                    OrderStatus = "Pending",
                    OrderDate = DateTime.Now
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // 5. Добавляем опции
                foreach (var option in options)
                {
                    var orderOption = new OrderOption
                    {
                        OrderId = order.OrderId,
                        OptionId = option.OptionId,
                        Quantity = 1,
                        PriceAtOrder = option.OptionPrice
                    };
                    _context.OrderOptions.Add(orderOption);
                }

                // 6. Обновляем статус автомобиля (если он был Available, меняем на Reserved)
                if (car.Status == "Available")
                {
                    car.Status = "Reserved";
                    _context.Cars.Update(car);
                }

                // 7. Добавляем запись в историю статусов
                var statusHistory = new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    Status = "Pending",
                    ChangedAt = DateTime.Now,
                    Notes = car.Status == "Reserved" && !orderDto.CarId.HasValue 
                        ? "Order created for car on order (В ожидании)" 
                        : "Order created automatically"
                };
                _context.OrderStatusHistories.Add(statusHistory);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 8. Возвращаем созданный заказ
                return await GetOrderByIdAsync(order.OrderId);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ReserveCarResponseDto> ReserveCar24hAsync(ReserveCarRequestDto dto)
        {
            using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var car = await _context.Cars
                    .Include(c => c.Model)
                    .FirstOrDefaultAsync(c => c.CarId == dto.CarId);

                if (car == null) throw new InvalidOperationException("Car not found");
                if (!string.Equals(car.Status, "Available", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Car is not available");

                var modelId = car.ModelId;
                var configurationId = dto.ConfigurationId;
                if (!configurationId.HasValue || configurationId.Value <= 0)
                {
                    configurationId = await _context.Configurations
                        .AsNoTracking()
                        .Where(c => c.ModelId == modelId)
                        .OrderBy(c => c.AdditionalPrice)
                        .Select(c => c.ConfigurationId)
                        .FirstOrDefaultAsync();
                }

                if (!configurationId.HasValue || configurationId.Value <= 0)
                    throw new InvalidOperationException("No configurations available for this model");

                var quote = await GetPricingQuoteAsync(new PricingQuoteRequestDto
                {
                    CarId = dto.CarId,
                    ModelId = null,
                    ConfigurationId = configurationId.Value,
                    Color = dto.Color ?? car.Color,
                    OptionIds = dto.OptionIds ?? new List<int>()
                });

                var reservedUntil = DateTime.UtcNow.Add(ReservationTtl);

                var order = new Order
                {
                    UserId = dto.UserId,
                    CarId = car.CarId,
                    ConfigurationId = configurationId.Value,
                    TotalPrice = quote.TotalPrice,
                    OrderStatus = "Hold24h",
                    OrderDate = DateTime.Now,
                    Notes = $"Auto-reservation. ReservedUntilUtc={reservedUntil:O}"
                };

                _context.Orders.Add(order);

                // lock car
                car.Status = "Reserved";
                _context.Cars.Update(car);

                await _context.SaveChangesAsync();

                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = order.OrderId,
                    Status = "Hold24h",
                    ChangedAt = DateTime.Now,
                    Notes = $"Reserved for 24h until {reservedUntil:O}"
                });

                await _context.SaveChangesAsync();
                await tx.CommitAsync();

                return new ReserveCarResponseDto
                {
                    OrderId = order.OrderId,
                    ReservedUntil = reservedUntil,
                    Quote = quote
                };
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<List<OrderDto>> GetUserOrdersAsync(int userId)
        {
            return await _context.Orders
                .Include(o => o.User)
                    .ThenInclude(u => u.UserProfiles)
                .Include(o => o.Car)
                    .ThenInclude(c => c.Model)
                        .ThenInclude(m => m.Brand)
                .Include(o => o.Configuration)
                .Include(o => o.OrderOptions)
                    .ThenInclude(oo => oo.Option)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderDto
                {
                    OrderId = o.OrderId,
                    CustomerName = (o.User.UserProfiles.FirstName ?? "") + " " + (o.User.UserProfiles.LastName ?? ""),
                    CarModel = o.Car.Model.Brand.BrandName + " " + o.Car.Model.ModelName,
                    Configuration = o.Configuration.ConfigurationName,
                    TotalPrice = o.TotalPrice,
                    OrderStatus = o.OrderStatus,
                    OrderDate = o.OrderDate,
                    Options = o.OrderOptions.Select(oo => new OrderOptionDto
                    {
                        OptionName = oo.Option.OptionName,
                        Price = oo.PriceAtOrder,
                        Quantity = oo.Quantity
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<List<OrderDto>> GetAllOrdersAsync()
        {
            return await _context.Orders
                .Include(o => o.User)
                    .ThenInclude(u => u.UserProfiles)
                .Include(o => o.Car)
                    .ThenInclude(c => c.Model)
                        .ThenInclude(m => m.Brand)
                .Include(o => o.Configuration)
                .Include(o => o.OrderOptions)
                    .ThenInclude(oo => oo.Option)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderDto
                {
                    OrderId = o.OrderId,
                    CustomerName = (o.User.UserProfiles.FirstName ?? "") + " " + (o.User.UserProfiles.LastName ?? ""),
                    CarModel = o.Car.Model.Brand.BrandName + " " + o.Car.Model.ModelName,
                    Configuration = o.Configuration.ConfigurationName,
                    TotalPrice = o.TotalPrice,
                    OrderStatus = o.OrderStatus,
                    OrderDate = o.OrderDate,
                    Options = o.OrderOptions.Select(oo => new OrderOptionDto
                    {
                        OptionName = oo.Option.OptionName,
                        Price = oo.PriceAtOrder,
                        Quantity = oo.Quantity
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string status, string notes = null)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
                return false;

            order.OrderStatus = status;
            _context.Orders.Update(order);

            // Добавляем запись в историю
            var statusHistory = new OrderStatusHistory
            {
                OrderId = orderId,
                Status = status,
                ChangedAt = DateTime.Now,
                Notes = notes ?? $"Status changed to {status}"
            };
            _context.OrderStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OrderDto> GetOrderByIdAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.User)
                    .ThenInclude(u => u.UserProfiles)
                .Include(o => o.Car)
                    .ThenInclude(c => c.Model)
                        .ThenInclude(m => m.Brand)
                .Include(o => o.Configuration)
                .Include(o => o.OrderOptions)
                    .ThenInclude(oo => oo.Option)
                .Where(o => o.OrderId == orderId)
                .Select(o => new OrderDto
                {
                    OrderId = o.OrderId,
                    CustomerName = (o.User.UserProfiles.FirstName ?? "") + " " + (o.User.UserProfiles.LastName ?? ""),
                    CarModel = o.Car.Model.Brand.BrandName + " " + o.Car.Model.ModelName,
                    Configuration = o.Configuration.ConfigurationName,
                    TotalPrice = o.TotalPrice,
                    OrderStatus = o.OrderStatus,
                    OrderDate = o.OrderDate,
                    Options = o.OrderOptions.Select(oo => new OrderOptionDto
                    {
                        OptionName = oo.Option.OptionName,
                        Price = oo.PriceAtOrder,
                        Quantity = oo.Quantity
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<bool> DeleteOrderAsync(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
                return false;

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<SalesReportDto>> GetSalesReportAsync(DateTime? startDate = null, DateTime? endDate = null, int? brandId = null)
        {
            if (startDate == null) startDate = DateTime.Now.AddMonths(-1);
            if (endDate == null) endDate = DateTime.Now;

            var report = await _context.Orders
                .Include(o => o.Car)
                    .ThenInclude(c => c.Model)
                        .ThenInclude(m => m.Brand)
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.OrderStatus == "Completed")
                .Where(o => brandId == null || o.Car.Model.Brand.BrandId == brandId)
                .GroupBy(o => new { o.Car.Model.Brand.BrandName, o.Car.Model.ModelName })
                .Select(g => new SalesReportDto
                {
                    BrandName = g.Key.BrandName,
                    ModelName = g.Key.ModelName,
                    TotalOrders = g.Count(),
                    TotalRevenue = g.Sum(o => o.TotalPrice),
                    AverageOrderValue = g.Average(o => o.TotalPrice)
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToListAsync();

            return report;
        }
    }
}
