using Xunit;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace DoAn_CSharp.Tests
{
    public class AnalyticsServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task LogVisitAsync_InsertsRecordIntoDatabase()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new AnalyticsService(context);
            var dto = new VisitCreateDto
            {
                POIId = 1,
                SessionId = "anon-session-123",
                TriggerType = "qr",
                LanguageCode = "en"
            };

            // Act
            await service.LogVisitAsync(dto);

            // Assert
            var log = await context.VisitLogs.FirstOrDefaultAsync();
            Assert.NotNull(log);
            Assert.Equal(1, log.POIId);
            Assert.Equal("anon-session-123", log.SessionId);
            Assert.Equal("qr", log.TriggerType);
            Assert.Equal("en", log.LanguageCode);
        }

        [Fact]
        public async Task GetSummaryAsync_ComputesCorrectAggregations()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi1 = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            var poi2 = new POI { Id = 2, Name = "Chùa Vĩnh Khánh", Slug = "chua-vinh-khanh", Category = "temple", IsActive = true };
            await context.POIs.AddRangeAsync(poi1, poi2);

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            await context.VisitLogs.AddRangeAsync(
                new VisitLog { POIId = 1, SessionId = "s1", TriggerType = "geofence", LanguageCode = "en", VisitedAt = today },
                new VisitLog { POIId = 1, SessionId = "s2", TriggerType = "qr", LanguageCode = "en", VisitedAt = today },
                new VisitLog { POIId = 2, SessionId = "s3", TriggerType = "manual", LanguageCode = "vi", VisitedAt = yesterday }
            );
            await context.SaveChangesAsync();

            var service = new AnalyticsService(context);

            // Act
            var result = await service.GetSummaryAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(3, result.TotalVisits);

            // VisitsOverTime asserts
            Assert.Equal(2, result.VisitsOverTime.Count);
            var todayCount = result.VisitsOverTime.First(v => v.Date == today.ToString("yyyy-MM-dd")).Count;
            var yesterdayCount = result.VisitsOverTime.First(v => v.Date == yesterday.ToString("yyyy-MM-dd")).Count;
            Assert.Equal(2, todayCount);
            Assert.Equal(1, yesterdayCount);

            // PopularPOIs asserts
            Assert.Equal(2, result.PopularPOIs.Count);
            var firstPopular = result.PopularPOIs.First();
            Assert.Equal(1, firstPopular.POIId);
            Assert.Equal("Cơm Tấm Bà Lan", firstPopular.POIName);
            Assert.Equal(2, firstPopular.Count);
        }
    }
}
