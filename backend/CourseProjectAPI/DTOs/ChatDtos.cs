namespace CourseProjectAPI.DTOs;

public class ChatMessageDto
{
    public int MessageId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SupportThreadDto
{
    public int ConversationId { get; set; }
    public int ClientUserId { get; set; }
    public List<ChatMessageDto> Messages { get; set; } = new();
}

public class SupportInboxItemDto
{
    public int ConversationId { get; set; }
    public int ClientUserId { get; set; }
    public string ClientDisplayName { get; set; } = string.Empty;
    public string? LastMessagePreview { get; set; }
    public DateTime? LastMessageAt { get; set; }
}

public class StaffDirectInboxItemDto
{
    public int ConversationId { get; set; }
    public int PeerUserId { get; set; }
    public string PeerDisplayName { get; set; } = string.Empty;
    public string PeerRoleName { get; set; } = string.Empty;
    public string? LastMessagePreview { get; set; }
    public DateTime? LastMessageAt { get; set; }
}

public class StaffPeerDto
{
    public int UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string RoleName { get; set; } = string.Empty;
}

public class SendChatMessageDto
{
    public int SenderUserId { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class PostClientSupportMessageDto
{
    public int SenderUserId { get; set; }
    public int ClientUserId { get; set; }
    public string Body { get; set; } = string.Empty;
}

public class PostStaffDirectMessageDto
{
    public int SenderUserId { get; set; }
    public int ConversationId { get; set; }
    public string Body { get; set; } = string.Empty;
}
