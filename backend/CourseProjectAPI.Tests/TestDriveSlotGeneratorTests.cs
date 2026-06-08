using Xunit;

namespace CourseProjectAPI.Tests;

public class TestDriveSlotGeneratorTests
{
    [Fact]
    public void GenerateTestDriveSlots_ReturnsExpectedCount()
    {
        const int slotDurationMinutes = 45;
        const int workdayStartHour = 10;
        const int workdayEndHour = 18;
        var day = new DateTime(2025, 5, 28);
        var start = new DateTime(day.Year, day.Month, day.Day,
            workdayStartHour, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(day.Year, day.Month, day.Day,
            workdayEndHour, 0, 0, DateTimeKind.Utc);
        var slots = new List<DateTime>();
        for (var t = start; t.AddMinutes(slotDurationMinutes) <= end;
             t = t.AddMinutes(slotDurationMinutes))
        {
            slots.Add(t);
        }
        Assert.Equal(10, slots.Count);
        Assert.Equal(start, slots[0]);
    }
}
