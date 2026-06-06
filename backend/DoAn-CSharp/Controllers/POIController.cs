using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/pois")]
    public class POIController : ControllerBase
    {
        private readonly IPOIService _poiService;

        public POIController(IPOIService poiService)
        {
            _poiService = poiService;
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
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] POIUpdateDto dto)
        {
            var result = await _poiService.UpdateAsync(id, dto);
            if (result == null)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            return Ok(result);
        }

        /// <summary>Xóa mềm POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _poiService.DeleteAsync(id);
            if (!success)
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
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
}
