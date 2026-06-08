using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class UserProfiles
{
    public int ProfileId { get; set; }

    public int UserId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Address { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    public virtual User User { get; set; } = null!;
}
