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
using System.Collections.Generic;
using System;

namespace DoAn_CSharp.Tests
{
    public class TourControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetActiveTours_ReturnsOkWithList()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var tour = new Tour { Id = 1, Name = "Tour 1", Description = "Desc 1", EstimatedMinutes = 10, DistanceKm = 0.5, IsActive = true };
            await context.Tours.AddAsync(tour);
            await context.SaveChangesAsync();

            var service = new TourService(context);
            var controller = new TourController(service);

            // Act
            var result = await controller.GetActiveTours("en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var list = Assert.IsAssignableFrom<IEnumerable<TourListDto>>(okResult.Value);
            Assert.Single(list);
            Assert.Equal("Tour 1", list.First().Name);
        }

        [Fact]
        public async Task GetTourById_ReturnsOk_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var tour = new Tour { Id = 1, Name = "Tour 1", Description = "Desc 1", EstimatedMinutes = 10, DistanceKm = 0.5, IsActive = true };
            await context.Tours.AddAsync(tour);
            await context.SaveChangesAsync();

            var service = new TourService(context);
            var controller = new TourController(service);

            // Act
            var result = await controller.GetTourById(1, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<TourDto>(okResult.Value);
            Assert.Equal("Tour 1", dto.Name);
        }

        [Fact]
        public async Task GetTourById_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new TourService(context);
            var controller = new TourController(service);

            // Act
            var result = await controller.GetTourById(99, "en");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
