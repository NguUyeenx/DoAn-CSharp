using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPOIService _poiService;

        public AdminController(AppDbContext context, IPOIService poiService)
        {
            _context = context;
            _poiService = poiService;
        }

        // ── Owner Approvals ───────────────────────────────────────────

        /// <summary>Lấy danh sách các Owner đăng ký chờ duyệt</summary>
        [HttpGet("owners/pending")]
        public async Task<IActionResult> GetPendingOwners()
        {
            var owners = await _context.Owners
                .Where(o => o.OwnerStatus == "pending")
                .Select(o => new
                {
                    o.Id,
                    o.Username,
                    o.Email,
                    o.DisplayName,
                    o.CreatedAt
                })
                .ToListAsync();
            
            return Ok(owners);
        }

        /// <summary>Duyệt Owner</summary>
        [HttpPut("owners/{id:int}/approve")]
        public async Task<IActionResult> ApproveOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");
            
            owner.OwnerStatus = "approved";
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner approved successfully." });
        }

        /// <summary>Từ chối Owner</summary>
        [HttpPut("owners/{id:int}/reject")]
        public async Task<IActionResult> RejectOwner(int id, [FromBody] RejectDto dto)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");
            
            owner.OwnerStatus = "rejected";
            owner.AdminNote = dto.Reason;
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner rejected." });
        }

        // ── POI Approvals ─────────────────────────────────────────────

        /// <summary>Lấy danh sách các POI chờ duyệt</summary>
        [HttpGet("pois/pending")]
        public async Task<IActionResult> GetPendingPOIs()
        {
            var pois = await _context.POIs
                .Where(p => p.ApprovalStatus == "pending" && p.DeletedAt == null)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Category,
                    p.OwnerId,
                    p.CreatedAt
                })
                .ToListAsync();
            
            return Ok(pois);
        }

        /// <summary>Duyệt/Từ chối POI</summary>
        [HttpPut("pois/{id:int}/status")]
        public async Task<IActionResult> UpdatePOIStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            if (dto.Status != "approved" && dto.Status != "rejected" && dto.Status != "pending")
                return BadRequest("Invalid status.");

            var success = await _poiService.UpdateApprovalStatusAsync(id, dto.Status);
            if (!success) return NotFound("POI not found.");

            return Ok(new { message = $"POI status updated to {dto.Status}." });
        }
    }

    public class RejectDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty; // approved, rejected, pending
    }
}
