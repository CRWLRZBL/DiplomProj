using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

/// <summary>
/// Тип переписки: клиент с салоном или два сотрудника.
/// </summary>
public enum ChatConversationType : byte
{
    ClientSupport = 0,
    StaffDirect = 1,
}

public partial class ChatConversation
{
    public int ChatConversationId { get; set; }

    public byte ConversationType { get; set; }

    /// <summary>Для ClientSupport — клиент, инициировавший диалог.</summary>
    public int? ClientUserId { get; set; }

    /// <summary>Для StaffDirect — меньший UserID участника.</summary>
    public int? StaffKeyUser1 { get; set; }

    /// <summary>Для StaffDirect — больший UserID участника.</summary>
    public int? StaffKeyUser2 { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User? ClientUser { get; set; }

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
