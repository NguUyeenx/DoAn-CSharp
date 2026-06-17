using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

using DoAn_CSharp.Data;
using Microsoft.EntityFrameworkCore;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/owner")]
    [Authorize(Roles = "owner")]
    public class OwnerController : ControllerBase
    {
        private readonly IPOIService _poiService;
        private readonly IAnalyticsService _analyticsService;
        private readonly IMenuService _menuService;
        private readonly AppDbContext _context;

        public OwnerController(IPOIService poiService, IAnalyticsService analyticsService, IMenuService menuService, AppDbContext context)
        {
            _poiService = poiService;
            _analyticsService = analyticsService;
            _menuService = menuService;
            _context = context;
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

            // Send Admin notification
            _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
            {
                OwnerId = null,
                Message = $"Có yêu cầu đăng ký địa điểm mới '{result.Name}' đang chờ duyệt.",
                Type = "POIPending",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

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

            // Force pending review for owner updates
            dto.ApprovalStatus = "pending";

            var result = await _poiService.UpdateAsync(id, dto);

            // Send Admin notification
            _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
            {
                OwnerId = null,
                Message = $"Địa điểm '{poi.Name}' đã được cập nhật bởi chủ quán và đang chờ duyệt lại.",
                Type = "POIUpdated",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return Ok(result);
        }

        /// <summary>Upload audio thuyết minh riêng cho POI</summary>
        [HttpPost("pois/{id:int}/custom-audio")]
        public async Task<IActionResult> UploadCustomAudio(int id, [FromBody] CustomAudioUploadDto dto)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null) return NotFound();
            if (poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            var existingAudio = await _context.AudioFiles
                .FirstOrDefaultAsync(a => a.TranslationType == Models.Entities.TranslationType.POI
                                       && a.TranslationId == id
                                       && a.LanguageCode.ToLower() == dto.LanguageCode.ToLower()
                                       && a.AudioType == "custom");

            if (existingAudio != null)
            {
                existingAudio.FilePath = dto.FilePath;
                existingAudio.DurationSeconds = dto.DurationSeconds;
                existingAudio.GeneratedAt = DateTime.UtcNow;
            }
            else
            {
                var audioFile = new Models.Entities.AudioFile
                {
                    TranslationType = Models.Entities.TranslationType.POI,
                    TranslationId = id,
                    LanguageCode = dto.LanguageCode,
                    FilePath = dto.FilePath,
                    DurationSeconds = dto.DurationSeconds,
                    AudioType = "custom",
                    IsDefault = true,
                    GeneratedAt = DateTime.UtcNow
                };
                await _context.AudioFiles.AddAsync(audioFile);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Custom audio saved successfully." });
        }

        // ── Menu Management ───────────────────────────────────────────
        [HttpPost("menu-items")]
        public async Task<IActionResult> CreateMenuItem([FromBody] MenuItemCreateDto dto)
        {
            var poi = await _poiService.GetByIdAsync(dto.POIId, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();
            
            var result = await _menuService.CreateMenuItemAsync(dto);
            return Ok(result);
        }

        [HttpPut("menu-items/{id:int}")]
        public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] MenuItemUpdateDto dto)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null) return NotFound();
            var poi = await _poiService.GetByIdAsync(menuItem.POIId, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            var result = await _menuService.UpdateMenuItemAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("menu-items/{id:int}")]
        public async Task<IActionResult> DeleteMenuItem(int id)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null) return NotFound();
            var poi = await _poiService.GetByIdAsync(menuItem.POIId, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            await _menuService.DeleteMenuItemAsync(id);
            return NoContent();
        }

        [HttpPut("menu-items/{id:int}/availability")]
        public async Task<IActionResult> ToggleMenuAvailability(int id, [FromBody] bool isAvailable)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null) return NotFound();
            var poi = await _poiService.GetByIdAsync(menuItem.POIId, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            menuItem.IsAvailable = isAvailable;
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Availability updated to {isAvailable}" });
        }

        // ── Image Management ──────────────────────────────────────────
        [HttpPost("pois/{id:int}/images")]
        public async Task<IActionResult> AddImages(int id, [FromBody] List<string> imageUrls)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            foreach(var url in imageUrls)
            {
                _context.POIImages.Add(new DoAn_CSharp.Models.Entities.POIImage { POIId = id, ImageUrl = url });
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Images added successfully" });
        }

        [HttpDelete("pois/{id:int}/images/{imageId:int}")]
        public async Task<IActionResult> DeleteImage(int id, int imageId)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            var img = await _context.POIImages.FirstOrDefaultAsync(i => i.Id == imageId && i.POIId == id);
            if (img == null) return NotFound();

            _context.POIImages.Remove(img);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("pois/{id:int}/cover-image")]
        public async Task<IActionResult> SetCoverImage(int id, [FromBody] int imageId)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            var images = await _context.POIImages.Where(i => i.POIId == id).ToListAsync();
            foreach(var img in images) {
                img.IsCover = (img.Id == imageId);
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cover image updated" });
        }

        [HttpPut("pois/{id:int}/images/reorder")]
        public async Task<IActionResult> ReorderImages(int id, [FromBody] Dictionary<int, int> imageOrders)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null || poi.OwnerId != GetCurrentOwnerId()) return Forbid();

            var images = await _context.POIImages.Where(i => i.POIId == id).ToListAsync();
            foreach(var img in images) {
                if (imageOrders.ContainsKey(img.Id)) {
                    img.DisplayOrder = imageOrders[img.Id];
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Images reordered" });
        }

        [HttpGet("dashboard/charts")]
        public async Task<IActionResult> GetDashboardCharts()
        {
            var ownerId = GetCurrentOwnerId();
            var charts = await _context.VisitLogs
                .Where(v => v.POI != null && v.POI.OwnerId == ownerId)
                .GroupBy(v => v.VisitedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .OrderBy(g => g.Date)
                .ToListAsync();

            var result = charts.Select(c => new {
                Date = c.Date.ToString("MM-dd"),
                Count = c.Count
            }).ToList();

            return Ok(result);
        }

        /// <summary>Lấy tóm tắt thống kê Analytics theo OwnerId</summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var ownerId = GetCurrentOwnerId();
            var totalPOIs = await _context.POIs.CountAsync(p => p.OwnerId == ownerId && p.DeletedAt == null);
            var totalViews = await _context.VisitLogs.CountAsync(v => v.POI != null && v.POI.OwnerId == ownerId);
            var totalAudioPlays = await _context.AudioPlayLogs.CountAsync(a => a.TargetType == Models.Entities.TranslationType.POI && _context.POIs.Any(p => p.Id == a.TargetId && p.OwnerId == ownerId));
            var totalQrScans = await _context.VisitLogs.CountAsync(v => v.POI != null && v.POI.OwnerId == ownerId && v.TriggerType == "qr");
            var totalBookmarks = await _context.VisitorBookmarks.CountAsync(b => _context.POIs.Any(p => p.Id == b.POIId && p.OwnerId == ownerId));

            // Calculate stats per POI
            var pois = await _context.POIs
                .Where(p => p.OwnerId == ownerId && p.DeletedAt == null)
                .ToListAsync();

            var poiStats = new List<object>();
            foreach(var p in pois)
            {
                var scans = await _context.VisitLogs.CountAsync(v => v.POIId == p.Id && v.TriggerType == "qr");
                var views = await _context.VisitLogs.CountAsync(v => v.POIId == p.Id);
                var plays = await _context.AudioPlayLogs.CountAsync(a => a.TargetType == Models.Entities.TranslationType.POI && a.TargetId == p.Id);
                var likes = await _context.VisitorBookmarks.CountAsync(b => b.POIId == p.Id);
                poiStats.Add(new { id = p.Id, name = p.Name, scans, views, audioPlays = plays, bookmarks = likes });
            }

            // Calculate languages percentage
            var langLogs = await _context.VisitLogs
                .Where(v => v.POI != null && v.POI.OwnerId == ownerId)
                .GroupBy(v => v.LanguageCode)
                .Select(g => new { Code = g.Key, Count = g.Count() })
                .ToListAsync();

            var totalLogs = langLogs.Sum(l => l.Count);
            var languages = langLogs.Select(l => new {
                code = l.Code,
                count = l.Count,
                percentage = totalLogs > 0 ? (int)Math.Round((double)l.Count / totalLogs * 100) : 0
            }).OrderByDescending(l => l.count).ToList();

            return Ok(new
            {
                totalPOIs,
                totalViews,
                totalAudioPlays,
                totalQrScans,
                totalBookmarks,
                poiStats,
                languages
            });
        }

        // ── Helpers ───────────────────────────────────────────────────
        private int GetCurrentOwnerId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Owner ID not found in token.");
            return int.Parse(idClaim);
        }
    }

    public class CustomAudioUploadDto
    {
        public string LanguageCode { get; set; } = "en";
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
    }
}
