using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
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

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string lang = "en")
        {
            var pois = await _poiService.GetAllAsync(category, lang);
            return Ok(pois);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id, [FromQuery] string lang = "en")
        {
            var poi = await _poiService.GetByIdAsync(id, lang);
            if (poi == null)
            {
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            }
            return Ok(poi);
        }

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

        [HttpPost("/api/admin/pois")]
        public async Task<IActionResult> Create([FromBody] POICreateDto dto)
        {
            // Note: Authority check placeholder for Phase 5 JWT
            var result = await _poiService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("/api/admin/pois/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] POIUpdateDto dto)
        {
            var result = await _poiService.UpdateAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            }
            return Ok(result);
        }

        [HttpDelete("/api/admin/pois/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _poiService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { error = "NotFound", message = $"POI with ID {id} was not found." });
            }
            return NoContent();
        }
    }
}
