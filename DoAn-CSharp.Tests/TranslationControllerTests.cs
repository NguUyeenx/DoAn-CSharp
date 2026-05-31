using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Controllers;
using DoAn_CSharp.Services;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace DoAn_CSharp.Tests
{
    public class TranslationControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetTranslation_ReturnsOk_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.POITranslations.AddAsync(new POITranslation
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "Ba Lan Broken Rice",
                ShortDescription = "Famous broken rice.",
                FullDescription = "Legendary broken rice.",
                AudioText = "Welcome to Ba Lan."
            });
            await context.SaveChangesAsync();

            var service = new TranslationService(context);
            var controller = new TranslationController(service);

            // Act
            var result = await controller.GetTranslation(1, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<TranslationDto>(okResult.Value);
            Assert.Equal("Ba Lan Broken Rice", dto.Name);
        }

        [Fact]
        public async Task GetTranslation_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new TranslationService(context);
            var controller = new TranslationController(service);

            // Act
            var result = await controller.GetTranslation(1, "ja");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpsertTranslation_ReturnsOk()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new TranslationService(context);
            var controller = new TranslationController(service);
            var dto = new TranslationCreateDto
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "Broken Rice",
                ShortDescription = "Short description",
                FullDescription = "Full description",
                AudioText = "Audio text"
            };

            // Act
            var result = await controller.UpsertTranslation(dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedDto = Assert.IsType<TranslationDto>(okResult.Value);
            Assert.Equal("Broken Rice", returnedDto.Name);
        }
    }
}
