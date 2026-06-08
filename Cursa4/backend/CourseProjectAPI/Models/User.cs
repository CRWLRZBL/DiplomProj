using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual Role Role { get; set; } = null!;

    public virtual UserProfiles? UserProfiles { get; set; }

    public virtual ICollection<ChatMessage> SentChatMessages { get; set; } = new List<ChatMessage>();

    public virtual ICollection<ChatConversation> ClientChatConversations { get; set; } = new List<ChatConversation>();
}
