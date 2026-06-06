using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/audio-progress")]
    [Authorize]
    public class AudioProgressController : ControllerBase
    {
        private readonly IAudioProgressService _progressService;

        public AudioProgressController(IAudioProgressService progressService)
        {
            _progressService = progressService;
        }

        /// <summary>Lấy tiến độ nghe audio của user</summary>
        [HttpGet("{audioFileId:int}")]
        public async Task<ActionResult<AudioProgressDto>> GetProgress(int audioFileId)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.GetProgressAsync(userId, audioFileId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        /// <summary>Lưu tiến độ nghe audio (tạo mới hoặc cập nhật)</summary>
        [HttpPut]
        public async Task<ActionResult<AudioProgressDto>> SaveProgress([FromBody] SaveAudioProgressDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.SaveProgressAsync(userId, dto);
            return Ok(result);
        }

        private int GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User ID not found in token.");
            return int.Parse(idClaim);
        }
    }
}
