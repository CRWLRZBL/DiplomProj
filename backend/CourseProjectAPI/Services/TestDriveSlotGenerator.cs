namespace CourseProjectAPI.Services;

/// <summary>
/// Генерация временных слотов тест-драйва за рабочий день (MVP).
/// </summary>
public static class TestDriveSlotGenerator
{
    public const int SlotDurationMinutes = 45;
    public const int WorkdayStartHourUtc = 10;
    public const int WorkdayEndHourUtc = 18;

    public static IReadOnlyList<DateTime> GenerateTestDriveSlots(DateTime dayUtc)
    {
        var day = dayUtc.Date;
        var start = new DateTime(day.Year, day.Month, day.Day, WorkdayStartHourUtc, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(day.Year, day.Month, day.Day, WorkdayEndHourUtc, 0, 0, DateTimeKind.Utc);

        var slots = new List<DateTime>();
        for (var t = start; t.AddMinutes(SlotDurationMinutes) <= end; t = t.AddMinutes(SlotDurationMinutes))
        {
            slots.Add(t);
        }

        return slots;
    }
}
