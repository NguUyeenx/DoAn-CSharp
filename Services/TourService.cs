using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public class TourService : ITourService
    {
        private readonly AppDbContext _context;

        public TourService(AppDbContext context)
        {
            _context = context;
        }

        // Constructor for testing / fallback instantiation
        public TourService()
        {
            _context = null!;
        }

        private AppDbContext GetContext(AppDbContext? context)
        {
            return context ?? _context;
        }

        public async Task<IEnumerable<TourListDto>> GetActiveToursAsync(string lang)
        {
            var tours = await _context.Tours
                .Include(t => t.Stops)
                .Where(t => t.IsActive)
                .ToListAsync();

            return tours.Select(t => new TourListDto
            {
                Id = t.Id,
                Name = t.Name, // We can localize tour name later if needed, default to original
                Description = t.Description,
                EstimatedMinutes = t.EstimatedMinutes,
                DistanceKm = t.DistanceKm,
                StopCount = t.Stops.Count
            });
        }

        public async Task<TourDto?> GetTourByIdAsync(int id, string lang)
        {
            var tour = await _context.Tours
                .Include(t => t.Stops)
                    .ThenInclude(ts => ts.POI)
                        .ThenInclude(p => p!.Translations)
                .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

            if (tour == null) return null;

            var stops = tour.Stops
                .OrderBy(ts => ts.StopOrder)
                .Select(ts => {
                    var poi = ts.POI;
                    var name = poi?.Name ?? string.Empty;
                    
                    // Fallback localization for POI Name inside Tour Stops
                    if (poi != null)
                    {
                        var translation = poi.Translations.FirstOrDefault(tr => tr.LanguageCode.ToLower() == lang.ToLower());
                        if (translation != null && !string.IsNullOrEmpty(translation.Name))
                        {
                            name = translation.Name;
                        }
                    }

                    return new TourStopDto
                    {
                        Id = ts.Id,
                        POIId = ts.POIId,
                        POIName = name,
                        POICategory = poi?.Category ?? string.Empty,
                        Latitude = poi?.Latitude ?? 0,
                        Longitude = poi?.Longitude ?? 0,
                        StopOrder = ts.StopOrder,
                        TransitionNote = ts.TransitionNote
                    };
                }).ToList();

            return new TourDto
            {
                Id = tour.Id,
                Name = tour.Name,
                Description = tour.Description,
                EstimatedMinutes = tour.EstimatedMinutes,
                DistanceKm = tour.DistanceKm,
                IsActive = tour.IsActive,
                Stops = stops
            };
        }

        public async Task<TourDto> CreateTourAsync(TourCreateDto dto)
        {
            var tour = new Tour
            {
                Name = dto.Name,
                Description = dto.Description,
                EstimatedMinutes = dto.EstimatedMinutes,
                DistanceKm = dto.DistanceKm,
                IsActive = true
            };

            await _context.Tours.AddAsync(tour);
            await _context.SaveChangesAsync();

            if (dto.Stops != null && dto.Stops.Count > 0)
            {
                var stops = dto.Stops.Select(s => new TourStop
                {
                    TourId = tour.Id,
                    POIId = s.POIId,
                    StopOrder = s.StopOrder,
                    TransitionNote = s.TransitionNote
                }).ToList();

                await _context.TourStops.AddRangeAsync(stops);
                await _context.SaveChangesAsync();
            }

            // Return full TourDto by reusing GetTourByIdAsync
            return (await GetTourByIdAsync(tour.Id, "en"))!;
        }

        public async Task<TourDto?> UpdateTourAsync(int id, TourCreateDto dto)
        {
            var tour = await _context.Tours
                .Include(t => t.Stops)
                .FirstOrDefaultAsync(t => t.Id == id && t.IsActive);

            if (tour == null) return null;

            tour.Name = dto.Name;
            tour.Description = dto.Description;
            tour.EstimatedMinutes = dto.EstimatedMinutes;
            tour.DistanceKm = dto.DistanceKm;

            // Remove old stops
            _context.TourStops.RemoveRange(tour.Stops);

            // Add new stops
            if (dto.Stops != null && dto.Stops.Count > 0)
            {
                var newStops = dto.Stops.Select(s => new TourStop
                {
                    TourId = tour.Id,
                    POIId = s.POIId,
                    StopOrder = s.StopOrder,
                    TransitionNote = s.TransitionNote
                }).ToList();

                await _context.TourStops.AddRangeAsync(newStops);
            }

            await _context.SaveChangesAsync();

            return await GetTourByIdAsync(tour.Id, "en");
        }

        public async Task<bool> DeleteTourAsync(int id)
        {
            var tour = await _context.Tours.FindAsync(id);
            if (tour == null) return false;

            tour.IsActive = false; // Soft delete
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
