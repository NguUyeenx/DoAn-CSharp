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
    public class MenuControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetMenu_ReturnsOkWithMenuItems()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            var item = new MenuItem { Id = 1, POIId = 1, Name = "Sườn", Price = 45000 };
            await context.MenuItems.AddAsync(item);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var controller = new MenuController(service);

            // Act
            var result = await controller.GetMenu(1, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<IEnumerable<MenuItemDto>>(okResult.Value);
            Assert.Single(list);
            Assert.Equal("Sườn", list.First().Name);
        }

        [Fact]
        public async Task Create_ReturnsCreatedResponse()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var controller = new MenuController(service);
            var dto = new MenuItemCreateDto { Name = "Sườn Nướng", Price = 45000 };

            // Act
            var result = await controller.Create(1, dto);

            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            var returned = Assert.IsType<MenuItemDto>(createdResult.Value);
            Assert.Equal("Sườn Nướng", returned.Name);
        }

        [Fact]
        public async Task Update_ReturnsOk_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            var item = new MenuItem { Id = 1, POIId = 1, Name = "Sườn", Price = 40000 };
            await context.MenuItems.AddAsync(item);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var controller = new MenuController(service);
            var dto = new MenuItemUpdateDto { Price = 42000 };

            // Act
            var result = await controller.Update(1, dto);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returned = Assert.IsType<MenuItemDto>(okResult.Value);
            Assert.Equal(42000, returned.Price);
        }

        [Fact]
        public async Task Delete_ReturnsNoContent_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            var item = new MenuItem { Id = 1, POIId = 1, Name = "Sườn", Price = 40000 };
            await context.MenuItems.AddAsync(item);
            await context.SaveChangesAsync();

            var service = new MenuService(context);
            var controller = new MenuController(service);

            // Act
            var result = await controller.Delete(1);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }
    }
}
