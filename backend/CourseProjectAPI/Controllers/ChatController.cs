using CourseProjectAPI.DTOs;
using CourseProjectAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace CourseProjectAPI.Controllers;

/// <summary>
/// Простые диалоги: клиент ↔ салон (менеджер/администратор) и переписка между сотрудниками.
/// Идентификация по query/body (как в остальном API до внедрения JWT).
/// </summary>
[ApiController]
[Route("api/messages")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet("support/thread")]
    public async Task<ActionResult<SupportThreadDto>> GetSupportThread(
        [FromQuery] int viewerUserId,
        [FromQuery] int clientUserId)
    {
        try
        {
            var thread = await _chatService.GetOrCreateClientSupportThreadAsync(viewerUserId, clientUserId);
            return Ok(thread);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }

    [HttpPost("support/messages")]
    public async Task<ActionResult<ChatMessageDto>> PostSupportMessage([FromBody] PostClientSupportMessageDto dto)
    {
        try
        {
            var msg = await _chatService.PostClientSupportMessageAsync(dto.SenderUserId, dto.ClientUserId, dto.Body);
            return Ok(msg);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("support/inbox")]
    public async Task<ActionResult<List<SupportInboxItemDto>>> GetSupportInbox([FromQuery] int staffUserId)
    {
        try
        {
            return Ok(await _chatService.GetClientSupportInboxAsync(staffUserId));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }

    [HttpGet("staff/peers")]
    public async Task<ActionResult<List<StaffPeerDto>>> GetStaffPeers([FromQuery] int userId)
    {
        try
        {
            return Ok(await _chatService.GetStaffPeersAsync(userId));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }

    [HttpGet("staff/thread")]
    public async Task<ActionResult<SupportThreadDto>> GetStaffThread(
        [FromQuery] int userId,
        [FromQuery] int peerUserId)
    {
        try
        {
            var thread = await _chatService.GetOrCreateStaffDirectThreadAsync(userId, peerUserId);
            return Ok(thread);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }

    [HttpPost("staff/messages")]
    public async Task<ActionResult<ChatMessageDto>> PostStaffMessage([FromBody] PostStaffDirectMessageDto dto)
    {
        try
        {
            var msg = await _chatService.PostStaffDirectMessageAsync(dto.SenderUserId, dto.ConversationId, dto.Body);
            return Ok(msg);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    [HttpGet("staff/inbox")]
    public async Task<ActionResult<List<StaffDirectInboxItemDto>>> GetStaffDirectInbox([FromQuery] int staffUserId)
    {
        try
        {
            return Ok(await _chatService.GetStaffDirectInboxAsync(staffUserId));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { Error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.GetBaseException().Message });
        }
    }
}
