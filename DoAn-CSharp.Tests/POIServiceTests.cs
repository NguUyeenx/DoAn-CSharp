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
    public class POIServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private async Task SeedDatabaseAsync(AppDbContext context)
        {
            var pois = new[]
            {
                new POI
                {
                    Id = 1,
                    Name = "Cơm Tấm Bà Lan",
                    Slug = "com-tam-ba-lan",
                    Latitude = 10.7575,
                    Longitude = 106.7020,
                    Category = "restaurant",
                    IsActive = true
                },
                new POI
                {
                    Id = 2,
                    Name = "Chùa Vĩnh Khánh",
                    Slug = "chua-vinh-khanh",
                    Latitude = 10.7558,
                    Longitude = 106.7010,
                    Category = "temple",
                    IsActive = true
                },
                new POI
                {
                    Id = 3,
                    Name = "Chợ Vĩnh Khánh",
                    Slug = "cho-vinh-khanh",
                    Latitude = 10.7555,
                    Longitude = 106.7035,
                    Category = "market",
                    IsActive = false // Inactive
                }
            };

            await context.POIs.AddRangeAsync(pois);

            // Add translations
            context.POITranslations.Add(new POITranslation
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "Ba Lan Broken Rice",
                ShortDescription = "Famous broken rice.",
                FullDescription = "Legendary broken rice.",
                AudioText = "Welcome to Ba Lan."
            });
            context.POITranslations.Add(new POITranslation
            {
                POIId = 2,
                LanguageCode = "en",
                Name = "Vinh Khanh Pagoda",
                ShortDescription = "Peaceful pagoda.",
                FullDescription = "Buddhist pagoda.",
                AudioText = "Welcome to the Pagoda."
            });

            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetAllAsync_ReturnsOnlyActivePOIs()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new POIService(context);

            // Act
            var result = await service.GetAllAsync(null, "en");

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Contains(result, x => x.Name == "Ba Lan Broken Rice");
            Assert.DoesNotContain(result, x => x.Name == "Chợ Vĩnh Khánh");
        }

        [Fact]
        public async Task GetNearbyAsync_FiltersAndSortsByProximity()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new POIService(context);

            // Act
            // (10.7575, 106.7020) is exactly Cơm Tấm Bà Lan's coordinate
            var result = await service.GetNearbyAsync(10.7575, 106.7020, 500, "en");

            // Assert
            Assert.Equal(2, result.Count());
            Assert.Equal("Ba Lan Broken Rice", result.First().Name);
        }

        [Fact]
        public async Task DeleteAsync_PerformsSoftDelete()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new POIService(context);

            // Act
            var deleteResult = await service.DeleteAsync(1);

            // Assert
            Assert.True(deleteResult);
            var poi = await context.POIs.FindAsync(1);
            Assert.NotNull(poi);
            Assert.False(poi.IsActive);
        }
    }
}
