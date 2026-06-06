using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        /// <summary>Ghi nhận lượt truy cập (Guest hoặc User)</summary>
        [HttpPost("visit")]
        public async Task<IActionResult> LogVisit([FromBody] VisitCreateDto dto)
        {
            await _analyticsService.LogVisitAsync(dto);
            return Ok(new { success = true, message = "Visit logged successfully." });
        }

        /// <summary>Lấy tổng quan thống kê (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var summary = await _analyticsService.GetSummaryAsync();
            return Ok(summary);
        }

        // Backward compat alias
        [Authorize(Roles = "admin")]
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var summary = await _analyticsService.GetSummaryAsync();
            return Ok(summary);
        }
    }
}
