using CourseProjectAPI.Data;
using CourseProjectAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Controllers;

[ApiController]
[Route("api/admin/images")]
public class AdminImagesController : ControllerBase
{
    private readonly AutoSalonContext _context;

    public AdminImagesController(AutoSalonContext context)
    {
        _context = context;
    }

    private static string ModelFolder(string modelName)
    {
        var n = (modelName ?? string.Empty).Trim();
        if (n.Contains("Granta", StringComparison.OrdinalIgnoreCase)) return "Granta";
        if (n.Contains("Vesta", StringComparison.OrdinalIgnoreCase)) return "Vesta";
        if (n.Contains("Largus", StringComparison.OrdinalIgnoreCase)) return "Largus";
        if (n.Contains("Niva Travel", StringComparison.OrdinalIgnoreCase)) return "Niva Travel";
        if (n.Contains("Niva Legend", StringComparison.OrdinalIgnoreCase)) return "Niva Legend";
        if (n.Contains("Iskra", StringComparison.OrdinalIgnoreCase)) return "Iskra";
        if (n.Contains("Aura", StringComparison.OrdinalIgnoreCase)) return "Aura";
        return n;
    }

    private static string ConfigPrefix(string bodyType, string modelName)
    {
        var bt = (bodyType ?? string.Empty).Trim();
        var m = (modelName ?? string.Empty).Trim().ToLowerInvariant();

        // same priority idea as frontend
        if (m.Contains("granta sportline"))
            return m.Contains("хэтчбек") || m.Contains("hatchback") || m.Contains("liftback") ? "Sportline-LiftBack" : "Sportline";
        if (m.Contains("granta sport") && !m.Contains("sportline"))
            return m.Contains("хэтчбек") || m.Contains("hatchback") || m.Contains("liftback") ? "Sport-LiftBack" : "Sport";
        if (m.Contains("vesta sportline")) return "Sportline";
        if (m.Contains("aura")) return "Aura";
        if (m.Contains("niva travel")) return "Travel-NEW";
        if (m.Contains("niva legend")) return "Legend";

        if (m.Contains("iskra sw cross") || m.Contains("iskra sw-cross")) return "SW-Cross";
        if (m.Contains("iskra sw") && !m.Contains("cross")) return "SW";
        if (m.Contains("iskra")) return "Sedan";

        if (m.Contains("sw cross") || m.Contains("sw-cross")) return "SW-Cross";
        if (m.Contains(" sw") && !m.Contains("cross")) return "SW";

        if (m.Contains("largus cross")) return "Cross";
        if (m.Contains("универсал") && m.Contains("cng")) return "Универсал-CNG";
        if (m.Contains("универсал")) return "Универсал";
        if (m.Contains("фургон") && m.Contains("cng")) return "Фургон-CNG";
        if (m.Contains("фургон")) return "Фургон";

        if (m.Contains("active cross") || m.Contains("activecross")) return "ActiveCross";
        if (m.Contains("cross") || m.Contains("кросс")) return "Cross";
        if (m.Contains("хэтчбек") || m.Contains("hatchback") || bt.Equals("Hatchback", StringComparison.OrdinalIgnoreCase)) return "LiftBack";

        if (bt.Equals("SUV", StringComparison.OrdinalIgnoreCase)) return "Travel-NEW";
        if (bt.Equals("StationWagon", StringComparison.OrdinalIgnoreCase)) return "SW";

        return "Sedan";
    }

    private static string NormalizeColor(string colorName)
    {
        var c = (colorName ?? string.Empty).Trim();
        if (string.Equals(c, "Несси 2", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(c, "Несси2", StringComparison.OrdinalIgnoreCase))
            return "Несси2";
        return string.Concat(c.Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string WebPath(Model model, string colorName)
    {
        var folder = ModelFolder(model.ModelName);
        var prefix = ConfigPrefix(model.BodyType, model.ModelName);
        var color = NormalizeColor(colorName);
        return $"/images/cars/{folder}/{prefix}-{color}.png";
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync()
    {
        var models = await _context.Models.AsNoTracking().ToListAsync();
        var colors = await _context.Colors.AsNoTracking().ToListAsync();
        var modelColors = await _context.ModelColors.ToListAsync();

        // update model main image
        foreach (var m in models)
        {
            var baseColor = m.ModelName.Contains("Aura", StringComparison.OrdinalIgnoreCase) ? "Платина" : "Ледниковый";
            var newUrl = WebPath(m, baseColor);
            // attach and update only if changed
            _context.Models.Attach(m);
            if (!string.Equals(m.ImageUrl, newUrl, StringComparison.OrdinalIgnoreCase))
                m.ImageUrl = newUrl;
        }

        // update model+color specific
        var modelById = models.ToDictionary(x => x.ModelId);
        var colorById = colors.ToDictionary(x => x.ColorId);

        foreach (var mc in modelColors)
        {
            if (!modelById.TryGetValue(mc.ModelId, out var m)) continue;
            if (!colorById.TryGetValue(mc.ColorId, out var c)) continue;
            var url = WebPath(m, c.ColorName);
            mc.ImageUrl = url;
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            ModelsUpdated = models.Count,
            ModelColorsUpdated = modelColors.Count
        });
    }
}

