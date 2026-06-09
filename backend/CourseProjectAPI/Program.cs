using CourseProjectAPI.Data;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping; // Поддержка кириллицы
    });

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var messages = context.ModelState
            .Where(kv => kv.Value?.Errors.Count > 0)
            .SelectMany(kv => kv.Value!.Errors.Select(err =>
                string.IsNullOrWhiteSpace(err.ErrorMessage)
                    ? $"Проверьте поле «{kv.Key}»"
                    : err.ErrorMessage))
            .Distinct()
            .ToList();

        return new BadRequestObjectResult(new
        {
            Error = messages.Count > 0
                ? string.Join(" ", messages)
                : "Проверьте правильность заполнения полей.",
            Errors = messages
        });
    };
});

builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 12 * 1024 * 1024);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Регистрация сервисов
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICarService, CarService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPdfReportService, PdfReportService>();
builder.Services.AddScoped<IExcelImportService, ExcelImportService>();
builder.Services.AddScoped<IChatService, ChatService>();


builder.Services.AddDbContext<AutoSalonContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AutoSalonContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("ChatSchemaBootstrap");
    await ChatSchemaBootstrap.EnsureTablesAsync(db, logger);
    await CatalogSchemaBootstrap.EnsureColumnsAsync(db, logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(uploadsPath, "uploads", "catalog"));
app.UseStaticFiles();

// UseHttpsRedirection отключен для Docker окружения (только HTTP)
// app.UseHttpsRedirection();

// UseAuthorization отключен - аутентификация не настроена
// При необходимости настроить JWT или Cookie authentication, раскомментировать:
// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

app.Run();
