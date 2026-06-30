using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/pois")]
    public class POIController : ControllerBase
    {
        private readonly IPOIService _poiService;
        private readonly AppDbContext _context;

        public POIController(IPOIService poiService, AppDbContext context)
        {
            _poiService = poiService;
            _context = context;
        }

        /// <summary>Lấy danh sách POI (lọc theo category, tìm kiếm theo tên)</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? category,
            [FromQuery] string? q,
            [FromQuery] string lang = "en")
        {
            if (!string.IsNullOrWhiteSpace(q))
            {
                var searchResults = await _poiService.SearchAsync(q, lang);
                return Ok(searchResults);
            }

            var pois = await _poiService.GetAllAsync(category, lang);
            return Ok(pois);
        }

        /// <summary>Tìm kiếm POI theo từ khóa</summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] string lang = "en")
        {
            var results = await _poiService.SearchAsync(q, lang);
            return Ok(results);
        }

        /// <summary>Lấy các POI gần vị trí hiện tại</summary>
        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearby(
            [FromQuery] double lat,
            [FromQuery] double lng,
            [FromQuery] int r = 500,
            [FromQuery] string lang = "en")
        {
            var pois = await _poiService.GetNearbyAsync(lat, lng, r, lang);
            return Ok(pois);
        }

        /// <summary>Lấy chi tiết một POI theo ID</summary>

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] string lang = "en")
        {
            var poi = await _poiService.GetByIdAsync(id, lang);
            if (poi == null)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            return Ok(poi);
        }

        /// <summary>Lấy chi tiết POI theo Slug</summary>
        [HttpGet("slug/{slug}")]
        public async Task<IActionResult> GetBySlug(string slug, [FromQuery] string lang = "en")
        {
            var poi = await _poiService.GetBySlugAsync(slug, lang);
            if (poi == null)
                return NotFound(new { error = "NotFound", message = $"POI '{slug}' not found." });
            return Ok(poi);
        }

        // ── Admin endpoints ───────────────────────────────────────────

        /// <summary>Tạo POI mới (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] POICreateDto dto)
        {
            var result = await _poiService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        /// <summary>Cập nhật POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpPost("{id}/approval")]
        public async Task<IActionResult> UpdateApprovalStatus(int id, [FromBody] UpdateApprovalDto dto)
        {
            var result = await _poiService.UpdateApprovalStatusAsync(id, dto.Status);
            if (!result) return NotFound();
            return Ok(new { message = "Approval status updated successfully" });
        }

        [HttpPost("{id}/reviews")]
        public async Task<IActionResult> AddReview(int id, [FromBody] CreateReviewDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _poiService.AddReviewAsync(id, dto);
                return CreatedAtAction(nameof(GetById), new { id = result.POIId }, result);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "POI not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding the review.", error = ex.Message });
            }
        }

        /// <summary>Cập nhật POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] POIUpdateDto dto)
        {
            var result = await _poiService.UpdateAsync(id, dto);
            if (result == null)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            return Ok(result);
        }

        /// <summary>Xóa mềm POI (Admin only)</summary>
        [HttpGet("test-raw-db-edit")]
        [AllowAnonymous]
        public async Task<IActionResult> TestRawDbEdit()
        {
            // 1. Create a POI directly
            var poi = new POI
            {
                Name = "Test Raw DB Edit",
                Slug = "test-raw-db-edit-" + Guid.NewGuid().ToString().Substring(0, 6),
                Category = "historical",
                IsActive = true,
                ApprovalStatus = "approved"
            };
            _context.POIs.Add(poi);
            await _context.SaveChangesAsync();

            // Add VI translation
            var viTrans = new POITranslation
            {
                POIId = poi.Id,
                LanguageCode = "vi",
                Name = "Test Raw DB Edit",
                AudioText = "xin chào"
            };
            _context.POITranslations.Add(viTrans);
            await _context.SaveChangesAsync();

            // Set the proper hash like UpsertTranslationAsync does
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var rawText = $"{viTrans.Name}|{viTrans.ShortDescription}|{viTrans.FullDescription}|{viTrans.AudioText}";
            var bytes = System.Text.Encoding.UTF8.GetBytes(rawText);
            var hashBytes = sha256.ComputeHash(bytes);
            viTrans.OriginalTextHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            await _context.SaveChangesAsync();

            // 2. Simulate First Scan (en)
            var poiService = HttpContext.RequestServices.GetService<IPOIService>();
            var firstScanResult = await poiService.GetBySlugAsync(poi.Slug, "en");

            // 3. Simulate Manual DB Edit (using raw SQL to bypass EF Core tracking)
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE POITranslations SET AudioText = 'con chó' WHERE POIId = {0} AND LanguageCode = 'vi'", poi.Id);

            // 4. Simulate Second Scan (en) on a new scope to avoid EF Core cache in this request
            using var scope = HttpContext.RequestServices.CreateScope();
            var newPoiService = scope.ServiceProvider.GetRequiredService<IPOIService>();
            var secondScanResult = await newPoiService.GetBySlugAsync(poi.Slug, "en");

            return Ok(new
            {
                FirstScanAudioText = firstScanResult?.AudioText,
                SecondScanAudioText = secondScanResult?.AudioText
            });
        }

        /// <summary>Xóa mềm POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });

            var success = await _poiService.DeleteAsync(id);
            if (!success)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });

            if (poi.OwnerId.HasValue)
            {
                _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
                {
                    OwnerId = poi.OwnerId.Value,
                    Message = $"Địa điểm '{poi.Name}' của bạn đã bị xóa bởi Admin.",
                    Type = "POIDeletedByAdmin",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        /// <summary>Khôi phục POI đã xóa mềm (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpPost("{id:int}/restore")]
        public async Task<IActionResult> Restore(int id)
        {
            var result = await _poiService.RestoreAsync(id);
            if (!result)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            return Ok(new { message = "POI restored successfully." });
        }
    }

    public class UpdateApprovalDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
