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
        private readonly DoAn_CSharp.Data.AppDbContext _context;

        public TourController(ITourService tourService, DoAn_CSharp.Data.AppDbContext context)
        {
            _tourService = tourService;
            _context = context;
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
        [HttpPost("~/api/admin/tours")]
        public async Task<IActionResult> CreateTour([FromBody] TourCreateDto dto)
        {
            var created = await _tourService.CreateTourAsync(dto);
            return CreatedAtAction(nameof(GetTourById), new { id = created.Id }, created);
        }

        [Authorize(Roles = "admin")]
        [HttpPut("~/api/admin/tours/{id:int}")]
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
        [HttpDelete("~/api/admin/tours/{id:int}")]
        public async Task<IActionResult> DeleteTour(int id)
        {
            var success = await _tourService.DeleteTourAsync(id);
            if (!success)
            {
                return NotFound(new { error = "NotFound", message = $"Tour with ID {id} was not found." });
            }
            return Ok(new { success = true, message = "Tour soft-deleted successfully." });
        }

        [Authorize(Roles = "admin")]
        [HttpPost("~/api/admin/tours/{id:int}/stops")]
        public async Task<IActionResult> AddTourStop(int id, [FromBody] TourStopCreateDto dto)
        {
            var tour = await _context.Tours.FindAsync(id);
            if (tour == null) return NotFound("Tour not found");

            var stop = new DoAn_CSharp.Models.Entities.TourStop
            {
                TourId = id,
                POIId = dto.POIId,
                StopOrder = dto.StopOrder,
                TransitionNote = dto.TransitionNote
            };
            _context.TourStops.Add(stop);
            await _context.SaveChangesAsync();
            return Ok(stop);
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("~/api/admin/tours/{id:int}/stops/{poiId:int}")]
        public async Task<IActionResult> RemoveTourStop(int id, int poiId)
        {
            var stop = await _context.TourStops.FindAsync(id, poiId);
            if (stop == null) return NotFound("Tour Stop not found");

            _context.TourStops.Remove(stop);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
