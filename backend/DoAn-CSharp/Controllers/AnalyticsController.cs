using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
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

        [HttpPost("visit")]
        public async Task<IActionResult> LogVisit([FromBody] VisitCreateDto dto)
        {
            await _analyticsService.LogVisitAsync(dto);
            return Ok(new { success = true, message = "Visit logged successfully." });
        }

        [HttpGet("/api/admin/analytics/summary")]
        public async Task<IActionResult> GetSummary()
        {
            // Note: Authority check placeholder for Phase 5 JWT
            var summary = await _analyticsService.GetSummaryAsync();
            return Ok(summary);
        }
    }
}
