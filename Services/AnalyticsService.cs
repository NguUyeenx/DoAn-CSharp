using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly AppDbContext _context;

        public AnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogVisitAsync(VisitCreateDto dto)
        {
            var log = new VisitLog
            {
                POIId = dto.POIId,
                SessionId = dto.SessionId,
                TriggerType = dto.TriggerType.ToLowerInvariant(),
                LanguageCode = dto.LanguageCode.ToLowerInvariant(),
                VisitedAt = DateTime.UtcNow
            };

            await _context.VisitLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync()
        {
            var totalVisits = await _context.VisitLogs.CountAsync();

            // Load dates to group in memory, avoiding SQL dialect translation issues for VisitedAt.Date
            var visitedDates = await _context.VisitLogs
                .Select(v => v.VisitedAt)
                .ToListAsync();

            var visitsOverTime = visitedDates
                .GroupBy(d => d.ToString("yyyy-MM-dd"))
                .Select(g => new VisitsOverTimeDto
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(v => v.Date)
                .ToList();

            var popularGroups = await _context.VisitLogs
                .GroupBy(v => v.POIId)
                .Select(g => new
                {
                    POIId = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(g => g.Count)
                .ToListAsync();

            var popularPOIs = new List<PopularPOIDto>();
            foreach (var pg in popularGroups)
            {
                var poi = await _context.POIs.FindAsync(pg.POIId);
                popularPOIs.Add(new PopularPOIDto
                {
                    POIId = pg.POIId,
                    POIName = poi?.Name ?? "Unknown POI",
                    Count = pg.Count
                });
            }

            return new AnalyticsSummaryDto
            {
                TotalVisits = totalVisits,
                VisitsOverTime = visitsOverTime,
                PopularPOIs = popularPOIs
            };
        }
    }
}
