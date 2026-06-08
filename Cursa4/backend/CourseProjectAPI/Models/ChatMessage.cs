using System;

namespace CourseProjectAPI.Models;

public partial class ChatMessage
{
    public int ChatMessageId { get; set; }

    public int ChatConversationId { get; set; }

    public int SenderUserId { get; set; }

    public string Body { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ChatConversation Conversation { get; set; } = null!;

    public virtual User Sender { get; set; } = null!;
}
