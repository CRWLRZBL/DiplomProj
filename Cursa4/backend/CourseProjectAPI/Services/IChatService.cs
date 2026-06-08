using CourseProjectAPI.DTOs;

namespace CourseProjectAPI.Services;

public interface IChatService
{
    Task<SupportThreadDto> GetOrCreateClientSupportThreadAsync(int viewerUserId, int clientUserId);

    Task<ChatMessageDto> PostClientSupportMessageAsync(int senderUserId, int clientUserId, string body);

    Task<List<SupportInboxItemDto>> GetClientSupportInboxAsync(int staffUserId);

    Task<List<StaffPeerDto>> GetStaffPeersAsync(int requesterUserId);

    Task<SupportThreadDto> GetOrCreateStaffDirectThreadAsync(int userId, int peerUserId);

    Task<ChatMessageDto> PostStaffDirectMessageAsync(int senderUserId, int conversationId, string body);

    Task<List<StaffDirectInboxItemDto>> GetStaffDirectInboxAsync(int staffUserId);
}
