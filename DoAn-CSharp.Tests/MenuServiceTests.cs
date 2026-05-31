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
    public class MenuServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetMenuByPOIAsync_ReturnsLocalizedMenuItems()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);

            var menuItem = new MenuItem
            {
                Id = 1,
                POIId = 1,
                Name = "Cơm Tấm Sườn",
                Price = 45000,
                Currency = "VND",
                SortOrder = 1
            };
            menuItem.Translations.Add(new MenuItemTranslation
            {
                LanguageCode = "en",
                Name = "Broken Rice with Grilled Pork Chop",
                Description = "Tasty pork chop over rice."
            });
            await context.MenuItems.AddAsync(menuItem);
            await context.SaveChangesAsync();

            var service = new MenuService(context);

            // Act
            var result = await service.GetMenuByPOIAsync(1, "en");

            // Assert
            Assert.Single(result);
            var item = result.First();
            Assert.Equal("Cơm Tấm Sườn", item.Name); // Original name
            Assert.Equal("Broken Rice with Grilled Pork Chop", item.LocalizedName);
            Assert.Equal("Tasty pork chop over rice.", item.LocalizedDescription);
        }

        [Fact]
        public async Task CreateMenuItemAsync_AddsItemToDatabase()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var dto = new MenuItemCreateDto
            {
                Name = "Cơm Tấm Chả",
                Price = 35000,
                Currency = "VND",
                SortOrder = 2
            };

            // Act
            var result = await service.CreateMenuItemAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Cơm Tấm Chả", result.Name);
            Assert.Equal(35000, result.Price);

            var dbItem = await context.MenuItems.FirstOrDefaultAsync(m => m.POIId == 1 && m.Name == "Cơm Tấm Chả");
            Assert.NotNull(dbItem);
            Assert.Equal(35000, dbItem.Price);
        }

        [Fact]
        public async Task UpdateMenuItemAsync_UpdatesFields()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            var item = new MenuItem { Id = 1, POIId = 1, Name = "Cơm Tấm", Price = 40000 };
            await context.MenuItems.AddAsync(item);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var dto = new MenuItemUpdateDto { Price = 42000, Name = "Cơm Tấm Đặc Biệt" };

            // Act
            var result = await service.UpdateMenuItemAsync(1, dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Cơm Tấm Đặc Biệt", result.Name);
            Assert.Equal(42000, result.Price);

            var dbItem = await context.MenuItems.FindAsync(1);
            Assert.NotNull(dbItem);
            Assert.Equal("Cơm Tấm Đặc Biệt", dbItem.Name);
            Assert.Equal(42000, dbItem.Price);
        }

        [Fact]
        public async Task DeleteMenuItemAsync_RemovesItemFromDatabase()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            var item = new MenuItem { Id = 1, POIId = 1, Name = "Cơm Tấm", Price = 40000 };
            await context.MenuItems.AddAsync(item);
            await context.SaveChangesAsync();

            var service = new MenuService(context);

            // Act
            var deleteResult = await service.DeleteMenuItemAsync(1);

            // Assert
            Assert.True(deleteResult);
            var dbItem = await context.MenuItems.FindAsync(1);
            Assert.Null(dbItem);
        }
    }
}
