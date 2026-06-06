using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/tours")]
    public class TourController : ControllerBase
    {
        private readonly ITourService _tourService;

        public TourController(ITourService tourService)
        {
            _tourService = tourService;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveTours([FromQuery] string lang = "en")
        {
            var tours = await _tourService.GetActiveToursAsync(lang);
            return Ok(tours);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTourById(int id, [FromQuery] string lang = "en")
        {
            var tour = await _tourService.GetTourByIdAsync(id, lang);
            if (tour == null)
            {
                return NotFound(new { error = "NotFound", message = $"Tour with ID {id} was not found." });
            }
            return Ok(tour);
        }

        [Authorize(Roles = "admin")]
        [HttpPost]
        public async Task<IActionResult> CreateTour([FromBody] TourCreateDto dto)
        {
            var created = await _tourService.CreateTourAsync(dto);
            return CreatedAtAction(nameof(GetTourById), new { id = created.Id }, created);
        }

        [Authorize(Roles = "admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTour(int id, [FromBody] TourCreateDto dto)
        {
            var updated = await _tourService.UpdateTourAsync(id, dto);
            if (updated == null)
            {
                return NotFound(new { error = "NotFound", message = $"Tour with ID {id} was not found." });
            }
            return Ok(updated);
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTour(int id)
        {
            var success = await _tourService.DeleteTourAsync(id);
            if (!success)
            {
                return NotFound(new { error = "NotFound", message = $"Tour with ID {id} was not found." });
            }
            return Ok(new { success = true, message = "Tour soft-deleted successfully." });
        }
    }
}
