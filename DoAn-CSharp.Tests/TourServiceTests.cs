using Xunit;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;

namespace DoAn_CSharp.Tests
{
    public class TourServiceTests
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
                new POI { Id = 1, Name = "Ốc Oanh", Slug = "oc-oanh", Latitude = 10.7565, Longitude = 106.7015, Category = "restaurant", IsActive = true },
                new POI { Id = 2, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Latitude = 10.7575, Longitude = 106.7020, Category = "restaurant", IsActive = true },
                new POI { Id = 3, Name = "Nhà thờ Xóm Chiếu", Slug = "nha-tho-xom-chieu", Latitude = 10.7550, Longitude = 106.7005, Category = "landmark", IsActive = true }
            };

            await context.POIs.AddRangeAsync(pois);

            var tours = new[]
            {
                new Tour
                {
                    Id = 1,
                    Name = "Vĩnh Khánh Food Tour",
                    Description = "Tour ẩm thực Vĩnh Khánh cực kỳ đặc sắc",
                    EstimatedMinutes = 45,
                    DistanceKm = 1.2,
                    IsActive = true,
                    Stops = new List<TourStop>
                    {
                        new TourStop { Id = 1, TourId = 1, POIId = 1, StopOrder = 1, TransitionNote = "Đi thẳng 100m" },
                        new TourStop { Id = 2, TourId = 1, POIId = 2, StopOrder = 2, TransitionNote = "Rẽ phải ở ngã tư" }
                    }
                },
                new Tour
                {
                    Id = 2,
                    Name = "Văn hóa Vĩnh Khánh",
                    Description = "Khám phá nét đẹp văn hóa",
                    EstimatedMinutes = 30,
                    DistanceKm = 0.8,
                    IsActive = false // Inactive
                }
            };

            await context.Tours.AddRangeAsync(tours);
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetActiveToursAsync_ShouldReturnOnlyActiveTours()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new TourService(context);

            // Act
            var result = await service.GetActiveToursAsync("en");

            // Assert
            Assert.Single(result);
            var tour = result.First();
            Assert.Equal("Vĩnh Khánh Food Tour", tour.Name);
            Assert.Equal(2, tour.StopCount);
        }

        [Fact]
        public async Task GetTourByIdAsync_ShouldReturnDetailedTourWithStops()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new TourService(context);

            // Act
            var tour = await service.GetTourByIdAsync(1, "en");

            // Assert
            Assert.NotNull(tour);
            Assert.Equal("Vĩnh Khánh Food Tour", tour.Name);
            Assert.Equal(2, tour.Stops.Count);
            Assert.Equal("Ốc Oanh", tour.Stops.First().POIName);
        }

        [Fact]
        public async Task CreateTourAsync_ShouldAddTourAndStops()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new TourService(context);

            var newTourDto = new TourCreateDto
            {
                Name = "Tour Di sản",
                Description = "Khám phá di sản tôn giáo",
                EstimatedMinutes = 20,
                DistanceKm = 0.5,
                Stops = new List<TourStopCreateDto>
                {
                    new TourStopCreateDto { POIId = 3, StopOrder = 1, TransitionNote = "Điểm khởi đầu" }
                }
            };

            // Act
            var created = await service.CreateTourAsync(newTourDto);

            // Assert
            Assert.NotNull(created);
            Assert.True(created.Id > 0);
            Assert.Single(created.Stops);
            Assert.Equal("Nhà thờ Xóm Chiếu", created.Stops.First().POIName);
        }

        [Fact]
        public async Task DeleteTourAsync_ShouldSoftDeleteTour()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new TourService(context);

            // Act
            var success = await service.DeleteTourAsync(1);

            // Assert
            Assert.True(success);
            var tour = await context.Tours.FindAsync(1);
            Assert.NotNull(tour);
            Assert.False(tour.IsActive); // Soft deleted
        }
    }
}
