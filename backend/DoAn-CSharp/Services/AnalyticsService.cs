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

        public async Task UpdateVisitLanguageAsync(UpdateLanguageDto dto)
        {
            var cutoff = DateTime.UtcNow.AddMinutes(-30);
            var log = await _context.VisitLogs
                .Where(v => v.SessionId == dto.SessionId && v.POIId == dto.POIId && v.VisitedAt >= cutoff)
                .OrderByDescending(v => v.VisitedAt)
                .FirstOrDefaultAsync();

            if (log != null)
            {
                log.LanguageCode = dto.LanguageCode.ToLowerInvariant();
                await _context.SaveChangesAsync();
            }
        }

        public async Task<AnalyticsSummaryDto> GetSummaryAsync()
        {
            var totalVisits = await _context.VisitLogs.CountAsync();
            var totalQrScans = await _context.VisitLogs.CountAsync(v => v.TriggerType.ToLower() == "qr");
            var totalAudioPlays = await _context.VisitLogs
                .Where(v => v.TriggerType.ToLower() == "geofence" || v.TriggerType.ToLower() == "manual")
                .CountAsync();

            // Visits over time (last 30 days)
            var cutoff = DateTime.UtcNow.AddDays(-30);
            var visitedDates = await _context.VisitLogs
                .Where(v => v.VisitedAt >= cutoff)
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

            // Top 10 popular POIs
            var popularGroups = await _context.VisitLogs
                .GroupBy(v => v.POIId)
                .Select(g => new { POIId = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .Take(10)
                .ToListAsync();

            var popularPOIs = new List<PopularPOIDto>();
            foreach (var pg in popularGroups)
            {
                var poi = await _context.POIs.FindAsync(pg.POIId);
                popularPOIs.Add(new PopularPOIDto
                {
                    POIId = pg.POIId,
                    POIName = poi?.Name ?? "Unknown",
                    Count = pg.Count
                });
            }

            // Language breakdown
            var langBreakdown = await _context.VisitLogs
                .GroupBy(v => v.LanguageCode)
                .Select(g => new LanguageStatDto
                {
                    LanguageCode = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(l => l.Count)
                .ToListAsync();

            return new AnalyticsSummaryDto
            {
                TotalVisits = totalVisits,
                TotalQrScans = totalQrScans,
                TotalAudioPlays = totalAudioPlays,
                VisitsOverTime = visitsOverTime,
                PopularPOIs = popularPOIs,
                LanguageBreakdown = langBreakdown
            };
        }
    }
}
