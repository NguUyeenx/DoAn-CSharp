using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Models.DTOs;
using System;
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

            await RecalculateTourDistanceAsync(id);

            return Ok(new {
                id = stop.Id,
                tourId = stop.TourId,
                poiId = stop.POIId,
                stopOrder = stop.StopOrder,
                transitionNote = stop.TransitionNote
            });
        }

        [Authorize(Roles = "admin")]
        [HttpDelete("~/api/admin/tours/{id:int}/stops/{poiId:int}")]
        public async Task<IActionResult> RemoveTourStop(int id, int poiId)
        {
            var stop = await _context.TourStops.FirstOrDefaultAsync(s => s.TourId == id && s.POIId == poiId);
            if (stop == null) return NotFound("Tour Stop not found");

            _context.TourStops.Remove(stop);
            await _context.SaveChangesAsync();

            await RecalculateTourDistanceAsync(id);

            return NoContent();
        }

        [Authorize(Roles = "admin")]
        [HttpPut("~/api/admin/tours/{id:int}/stops/reorder")]
        public async Task<IActionResult> ReorderTourStops(int id, [FromBody] List<DoAn_CSharp.Models.DTOs.TourStopCreateDto> orders)
        {
            var tour = await _context.Tours.Include(t => t.Stops).FirstOrDefaultAsync(t => t.Id == id);
            if (tour == null) return NotFound("Tour not found");

            foreach (var stop in tour.Stops)
            {
                var newOrder = orders.FirstOrDefault(o => o.POIId == stop.POIId);
                if (newOrder != null)
                {
                    stop.StopOrder = newOrder.StopOrder;
                }
            }

            await _context.SaveChangesAsync();
            await RecalculateTourDistanceAsync(id);

            return NoContent();
        }

        private async Task RecalculateTourDistanceAsync(int tourId)
        {
            var tour = await _context.Tours
                .Include(t => t.Stops)
                    .ThenInclude(ts => ts.POI)
                .FirstOrDefaultAsync(t => t.Id == tourId);
                
            if (tour == null) return;

            var stops = tour.Stops.OrderBy(s => s.StopOrder).ToList();
            if (stops.Count < 2)
            {
                tour.DistanceKm = 0;
                await _context.SaveChangesAsync();
                return;
            }

            double totalDistance = 0;
            for (int i = 0; i < stops.Count - 1; i++)
            {
                var p1 = stops[i].POI;
                var p2 = stops[i + 1].POI;
                if (p1 != null && p2 != null)
                {
                    totalDistance += CalculateDistance(p1.Latitude, p1.Longitude, p2.Latitude, p2.Longitude);
                }
            }

            tour.DistanceKm = Math.Round(totalDistance, 2);
            await _context.SaveChangesAsync();
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // Radius of the earth in km
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c; // Distance in km
        }
    }
}
