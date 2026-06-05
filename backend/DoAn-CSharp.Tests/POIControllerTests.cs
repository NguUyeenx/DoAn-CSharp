using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Controllers;
using DoAn_CSharp.Services;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using System;

namespace DoAn_CSharp.Tests
{
    public class POIControllerTests
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
                }
            };

            await context.POIs.AddRangeAsync(pois);

            context.POITranslations.Add(new POITranslation
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "Ba Lan Broken Rice",
                ShortDescription = "Famous broken rice.",
                FullDescription = "Legendary broken rice.",
                AudioText = "Welcome to Ba Lan."
            });

            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetAll_ReturnsOkWithPOIs()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new POIService(context);
            var controller = new POIController(service);

            // Act
            var result = await controller.GetAll(null, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<IEnumerable<POIListDto>>(okResult.Value);
            Assert.Equal(2, list.Count());
        }

        [Fact]
        public async Task GetById_ReturnsNotFoundWhenPOIMissing()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new POIService(context);
            var controller = new POIController(service);

            // Act
            var result = await controller.GetById(99, "en");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GetById_ReturnsOkWithPOI()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new POIService(context);
            var controller = new POIController(service);

            // Act
            var result = await controller.GetById(1, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<POIDto>(okResult.Value);
            Assert.Equal("Ba Lan Broken Rice", dto.LocalizedName);
        }

        [Fact]
        public async Task Create_ReturnsCreatedResponse()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new POIService(context);
            var controller = new POIController(service);
            var createDto = new POICreateDto
            {
                Name = "Quán Bún Bò",
                Latitude = 10.7570,
                Longitude = 106.7012,
                Category = "restaurant",
                Priority = 5
            };

            // Act
            var result = await controller.Create(createDto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var dto = Assert.IsType<POIDto>(createdResult.Value);
            Assert.Equal("Quán Bún Bò", dto.Name);
            Assert.Equal("quan-bun-bo", dto.Slug);
        }
    }
}
