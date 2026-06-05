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
    public class TranslationServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetTranslationAsync_ReturnsCorrectTranslation_WhenExists()
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

            // Act
            var result = await service.GetTranslationAsync(1, "en");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Ba Lan Broken Rice", result.Name);
            Assert.Equal("en", result.LanguageCode);
        }

        [Fact]
        public async Task GetTranslationAsync_ReturnsNull_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new TranslationService(context);

            // Act
            var result = await service.GetTranslationAsync(1, "fr");

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task UpsertTranslationAsync_CreatesNewTranslation_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new TranslationService(context);
            var dto = new TranslationCreateDto
            {
                POIId = 1,
                LanguageCode = "ja",
                Name = "バラン砕き米",
                ShortDescription = "有名な砕き米",
                FullDescription = "伝説の砕き米",
                AudioText = "バランへようこそ"
            };

            // Act
            var result = await service.UpsertTranslationAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("ja", result.LanguageCode);
            Assert.Equal("バラン砕き米", result.Name);

            var dbTranslation = await context.POITranslations.FirstOrDefaultAsync(t => t.POIId == 1 && t.LanguageCode == "ja");
            Assert.NotNull(dbTranslation);
            Assert.Equal("バラン砕き米", dbTranslation.Name);
        }

        [Fact]
        public async Task UpsertTranslationAsync_UpdatesExistingTranslation_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.POITranslations.AddAsync(new POITranslation
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "Old Name",
                ShortDescription = "Old",
                FullDescription = "Old full",
                AudioText = "Old audio"
            });
            await context.SaveChangesAsync();

            var service = new TranslationService(context);
            var dto = new TranslationCreateDto
            {
                POIId = 1,
                LanguageCode = "en",
                Name = "New Name",
                ShortDescription = "New",
                FullDescription = "New full",
                AudioText = "New audio"
            };

            // Act
            var result = await service.UpsertTranslationAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("New Name", result.Name);

            var dbTranslation = await context.POITranslations.FirstOrDefaultAsync(t => t.POIId == 1 && t.LanguageCode == "en");
            Assert.NotNull(dbTranslation);
            Assert.Equal("New Name", dbTranslation.Name);
        }
    }
}
