using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/owner")]
    [Authorize(Roles = "owner")]
    public class OwnerController : ControllerBase
    {
        private readonly IPOIService _poiService;
        private readonly IAnalyticsService _analyticsService;

        public OwnerController(IPOIService poiService, IAnalyticsService analyticsService)
        {
            _poiService = poiService;
            _analyticsService = analyticsService;
        }

        // ── POIs Management ───────────────────────────────────────────

        /// <summary>Lấy danh sách POI của owner</summary>
        [HttpGet("pois")]
        public async Task<IActionResult> GetMyPOIs([FromQuery] string lang = "en")
        {
            var ownerId = GetCurrentOwnerId();
            var pois = await _poiService.GetByOwnerAsync(ownerId, lang);
            return Ok(pois);
        }

        /// <summary>Đăng ký POI mới (sẽ ở trạng thái pending)</summary>
        [HttpPost("pois")]
        public async Task<IActionResult> CreatePOI([FromBody] POICreateDto dto)
        {
            var ownerId = GetCurrentOwnerId();
            var result = await _poiService.CreateAsync(dto, ownerId);
            return CreatedAtAction(nameof(GetMyPOIById), new { id = result.Id }, result);
        }

        /// <summary>Lấy chi tiết POI của chính mình</summary>
        [HttpGet("pois/{id:int}")]
        public async Task<IActionResult> GetMyPOIById(int id, [FromQuery] string lang = "en")
        {
            var poi = await _poiService.GetByIdAsync(id, lang);
            if (poi == null)
                return NotFound(new { error = "NotFound", message = "POI not found." });

            if (poi.OwnerId != GetCurrentOwnerId())
                return Forbid();

            return Ok(poi);
        }

        /// <summary>Cập nhật POI (chỉ update POI của chính mình)</summary>
        [HttpPut("pois/{id:int}")]
        public async Task<IActionResult> UpdatePOI(int id, [FromBody] POIUpdateDto dto)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null)
                return NotFound(new { error = "NotFound", message = "POI not found." });

            if (poi.OwnerId != GetCurrentOwnerId())
                return Forbid();

            var result = await _poiService.UpdateAsync(id, dto);
            return Ok(result);
        }

        // ── Dashboard / Analytics ─────────────────────────────────────

        /// <summary>Lấy tóm tắt thống kê Analytics (Toàn cục - hiện tại cho Demo)</summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Trong thực tế sẽ lọc stats theo OwnerId, 
            // hiện tại gọi GetSummaryAsync() demo.
            var summary = await _analyticsService.GetSummaryAsync();
            return Ok(summary);
        }

        // ── Helpers ───────────────────────────────────────────────────
        private int GetCurrentOwnerId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Owner ID not found in token.");
            return int.Parse(idClaim);
        }
    }
}
