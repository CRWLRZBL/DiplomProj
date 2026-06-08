using CourseProjectAPI.Data;
using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Services;

public class ChatService : IChatService
{
    private const int MaxBodyLength = 2000;
    private readonly AutoSalonContext _context;

    public ChatService(AutoSalonContext context)
    {
        _context = context;
    }

    private static bool RoleIs(string? roleName, params string[] anyOf)
    {
        if (string.IsNullOrWhiteSpace(roleName)) return false;
        foreach (var x in anyOf)
        {
            if (string.Equals(roleName.Trim(), x, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private static bool IsStaffRole(string? roleName) =>
        RoleIs(roleName,
            "Admin", "Administrator", "Администратор",
            "Manager", "Менеджер");

    private static bool IsClientRole(string? roleName) =>
        RoleIs(roleName, "Client", "Клиент");

    private async Task<(User? User, string? RoleName)> GetUserWithRoleAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.UserProfiles)
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive);
        return (user, user?.Role?.RoleName);
    }

    private static string DisplayName(User u) =>
        u.UserProfiles != null
            ? $"{u.UserProfiles.FirstName} {u.UserProfiles.LastName}".Trim()
            : u.Email;

    private static ChatMessageDto MapMessage(ChatMessage m) => new()
    {
        MessageId = m.ChatMessageId,
        SenderUserId = m.SenderUserId,
        SenderName = m.Sender != null ? DisplayName(m.Sender) : $"#{m.SenderUserId}",
        Body = m.Body,
        CreatedAt = m.CreatedAt,
    };

    /// <summary>
    /// Отдельный запрос вместо Include(...OrderBy...).ThenInclude — так надёжнее в EF Core.
    /// </summary>
    private async Task<List<ChatMessage>> LoadThreadMessagesAsync(int conversationId)
    {
        return await _context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ChatConversationId == conversationId)
            .OrderBy(m => m.CreatedAt)
            .Include(m => m.Sender)
            .ThenInclude(s => s.UserProfiles)
            .ToListAsync();
    }

    public async Task<SupportThreadDto> GetOrCreateClientSupportThreadAsync(int viewerUserId, int clientUserId)
    {
        var (viewer, viewerRole) = await GetUserWithRoleAsync(viewerUserId);
        if (viewer == null)
            throw new InvalidOperationException("Пользователь не найден.");

        var (client, clientRole) = await GetUserWithRoleAsync(clientUserId);
        if (client == null)
            throw new InvalidOperationException("Клиент не найден.");

        if (!IsClientRole(clientRole))
            throw new InvalidOperationException("Указанный пользователь не является клиентом.");

        var isStaff = IsStaffRole(viewerRole);
        if (!isStaff && viewerUserId != clientUserId)
            throw new UnauthorizedAccessException("Нет доступа к этой переписке.");

        var conv = await _context.ChatConversations
            .FirstOrDefaultAsync(c =>
                c.ConversationType == (byte)ChatConversationType.ClientSupport
                && c.ClientUserId == clientUserId);

        if (conv == null)
        {
            conv = new ChatConversation
            {
                ConversationType = (byte)ChatConversationType.ClientSupport,
                ClientUserId = clientUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _context.ChatConversations.Add(conv);
            await _context.SaveChangesAsync();
        }

        var messages = await LoadThreadMessagesAsync(conv.ChatConversationId);

        return new SupportThreadDto
        {
            ConversationId = conv.ChatConversationId,
            ClientUserId = clientUserId,
            Messages = messages.Select(MapMessage).ToList(),
        };
    }

    public async Task<ChatMessageDto> PostClientSupportMessageAsync(int senderUserId, int clientUserId, string body)
    {
        body = (body ?? string.Empty).Trim();
        if (body.Length == 0)
            throw new InvalidOperationException("Текст сообщения пуст.");
        if (body.Length > MaxBodyLength)
            throw new InvalidOperationException($"Сообщение длиннее {MaxBodyLength} символов.");

        var (sender, senderRole) = await GetUserWithRoleAsync(senderUserId);
        if (sender == null)
            throw new InvalidOperationException("Отправитель не найден.");

        var (_, clientRole) = await GetUserWithRoleAsync(clientUserId);
        if (!IsClientRole(clientRole))
            throw new InvalidOperationException("Некорректный клиент.");

        var isStaff = IsStaffRole(senderRole);
        if (!isStaff && senderUserId != clientUserId)
            throw new UnauthorizedAccessException("Клиент может писать только от своего имени.");

        var thread = await GetOrCreateClientSupportThreadAsync(senderUserId, clientUserId);

        var msg = new ChatMessage
        {
            ChatConversationId = thread.ConversationId,
            SenderUserId = senderUserId,
            Body = body,
            CreatedAt = DateTime.UtcNow,
        };
        _context.ChatMessages.Add(msg);

        var conv = await _context.ChatConversations.FirstAsync(c => c.ChatConversationId == thread.ConversationId);
        conv.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _context.Entry(msg).Reference(m => m.Sender).LoadAsync();
        if (msg.Sender != null)
            await _context.Entry(msg.Sender).Reference(s => s.UserProfiles).LoadAsync();

        return MapMessage(msg);
    }

    public async Task<List<SupportInboxItemDto>> GetClientSupportInboxAsync(int staffUserId)
    {
        var (_, role) = await GetUserWithRoleAsync(staffUserId);
        if (!IsStaffRole(role))
            throw new UnauthorizedAccessException("Доступно только сотрудникам.");

        var convs = await _context.ChatConversations
            .AsNoTracking()
            .Where(c => c.ConversationType == (byte)ChatConversationType.ClientSupport && c.ClientUserId != null)
            .Include(c => c.ClientUser!)
            .ThenInclude(u => u.UserProfiles)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var ids = convs.Select(c => c.ChatConversationId).ToList();
        var lastByConv = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => ids.Contains(m.ChatConversationId))
            .GroupBy(m => m.ChatConversationId)
            .Select(g => new
            {
                ConvId = g.Key,
                LastAt = g.Max(m => m.CreatedAt),
            })
            .ToListAsync();

        var lastBodies = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => ids.Contains(m.ChatConversationId))
            .ToListAsync();

        var bodyByConv = lastBodies
            .GroupBy(m => m.ChatConversationId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(m => m.CreatedAt).First().Body);

        var atByConv = lastByConv.ToDictionary(x => x.ConvId, x => x.LastAt);

        return convs.Select(c => new SupportInboxItemDto
        {
            ConversationId = c.ChatConversationId,
            ClientUserId = c.ClientUserId!.Value,
            ClientDisplayName = c.ClientUser != null ? DisplayName(c.ClientUser) : $"#{c.ClientUserId}",
            LastMessagePreview = bodyByConv.TryGetValue(c.ChatConversationId, out var b)
                ? (b.Length > 120 ? b[..120] + "…" : b)
                : null,
            LastMessageAt = atByConv.TryGetValue(c.ChatConversationId, out var at) ? at : null,
        }).ToList();
    }

    public async Task<List<StaffPeerDto>> GetStaffPeersAsync(int requesterUserId)
    {
        var (_, role) = await GetUserWithRoleAsync(requesterUserId);
        if (!IsStaffRole(role))
            throw new UnauthorizedAccessException("Доступно только сотрудникам.");

        var peers = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.UserProfiles)
            .Where(u => u.IsActive && u.UserId != requesterUserId)
            .Where(u => u.Role!.RoleName == "Admin" || u.Role!.RoleName == "Manager")
            .OrderBy(u => u.UserProfiles != null ? u.UserProfiles.FirstName : u.Email)
            .ThenBy(u => u.UserProfiles != null ? u.UserProfiles.LastName : "")
            .ToListAsync();

        return peers.Select(u => new StaffPeerDto
        {
            UserId = u.UserId,
            DisplayName = DisplayName(u),
            RoleName = u.Role?.RoleName ?? "",
        }).ToList();
    }

    public async Task<SupportThreadDto> GetOrCreateStaffDirectThreadAsync(int userId, int peerUserId)
    {
        if (userId == peerUserId)
            throw new InvalidOperationException("Нельзя открыть чат с самим собой.");

        var (u1, r1) = await GetUserWithRoleAsync(userId);
        var (u2, r2) = await GetUserWithRoleAsync(peerUserId);
        if (u1 == null || u2 == null)
            throw new InvalidOperationException("Пользователь не найден.");
        if (!IsStaffRole(r1) || !IsStaffRole(r2))
            throw new InvalidOperationException("Внутренний чат доступен только между сотрудниками.");

        var a = Math.Min(userId, peerUserId);
        var b = Math.Max(userId, peerUserId);

        var conv = await _context.ChatConversations
            .FirstOrDefaultAsync(c =>
                c.ConversationType == (byte)ChatConversationType.StaffDirect
                && c.StaffKeyUser1 == a
                && c.StaffKeyUser2 == b);

        if (conv == null)
        {
            conv = new ChatConversation
            {
                ConversationType = (byte)ChatConversationType.StaffDirect,
                StaffKeyUser1 = a,
                StaffKeyUser2 = b,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };
            _context.ChatConversations.Add(conv);
            await _context.SaveChangesAsync();
        }

        var messages = await LoadThreadMessagesAsync(conv.ChatConversationId);

        return new SupportThreadDto
        {
            ConversationId = conv.ChatConversationId,
            ClientUserId = peerUserId,
            Messages = messages.Select(MapMessage).ToList(),
        };
    }

    public async Task<ChatMessageDto> PostStaffDirectMessageAsync(int senderUserId, int conversationId, string body)
    {
        body = (body ?? string.Empty).Trim();
        if (body.Length == 0)
            throw new InvalidOperationException("Текст сообщения пуст.");
        if (body.Length > MaxBodyLength)
            throw new InvalidOperationException($"Сообщение длиннее {MaxBodyLength} символов.");

        var conv = await _context.ChatConversations.FirstOrDefaultAsync(c =>
            c.ChatConversationId == conversationId
            && c.ConversationType == (byte)ChatConversationType.StaffDirect);
        if (conv == null)
            throw new InvalidOperationException("Переписка не найдена.");

        if (senderUserId != conv.StaffKeyUser1 && senderUserId != conv.StaffKeyUser2)
            throw new UnauthorizedAccessException("Вы не участник этой переписки.");

        var (_, senderRole) = await GetUserWithRoleAsync(senderUserId);
        if (!IsStaffRole(senderRole))
            throw new UnauthorizedAccessException("Отправка запрещена.");

        var msg = new ChatMessage
        {
            ChatConversationId = conversationId,
            SenderUserId = senderUserId,
            Body = body,
            CreatedAt = DateTime.UtcNow,
        };
        _context.ChatMessages.Add(msg);
        conv.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _context.Entry(msg).Reference(m => m.Sender).LoadAsync();
        if (msg.Sender != null)
            await _context.Entry(msg.Sender).Reference(s => s.UserProfiles).LoadAsync();

        return MapMessage(msg);
    }

    public async Task<List<StaffDirectInboxItemDto>> GetStaffDirectInboxAsync(int staffUserId)
    {
        var (user, role) = await GetUserWithRoleAsync(staffUserId);
        if (user == null || !IsStaffRole(role))
            throw new UnauthorizedAccessException("Доступно только сотрудникам.");

        var convs = await _context.ChatConversations
            .AsNoTracking()
            .Where(c =>
                c.ConversationType == (byte)ChatConversationType.StaffDirect
                && (c.StaffKeyUser1 == staffUserId || c.StaffKeyUser2 == staffUserId))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var peerIds = convs
            .Select(c => c.StaffKeyUser1 == staffUserId ? c.StaffKeyUser2!.Value : c.StaffKeyUser1!.Value)
            .Distinct()
            .ToList();

        var peerList = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.UserProfiles)
            .Where(u => peerIds.Contains(u.UserId))
            .ToListAsync();
        var peers = peerList.ToDictionary(u => u.UserId);

        var ids = convs.Select(c => c.ChatConversationId).ToList();
        var lastBodies = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => ids.Contains(m.ChatConversationId))
            .ToListAsync();

        var previewByConv = lastBodies
            .GroupBy(m => m.ChatConversationId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(m => m.CreatedAt).First());

        return convs.Select(c =>
        {
            var peerId = c.StaffKeyUser1 == staffUserId ? c.StaffKeyUser2!.Value : c.StaffKeyUser1!.Value;
            peers.TryGetValue(peerId, out var peer);
            previewByConv.TryGetValue(c.ChatConversationId, out var last);
            var preview = last?.Body;
            return new StaffDirectInboxItemDto
            {
                ConversationId = c.ChatConversationId,
                PeerUserId = peerId,
                PeerDisplayName = peer != null ? DisplayName(peer) : $"#{peerId}",
                PeerRoleName = peer?.Role?.RoleName ?? "",
                LastMessagePreview = preview != null
                    ? (preview.Length > 120 ? preview[..120] + "…" : preview)
                    : null,
                LastMessageAt = last?.CreatedAt,
            };
        }).ToList();
    }
}
