using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Controllers;
using DoAn_CSharp.Services;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System;

namespace DoAn_CSharp.Tests
{
    public class AnalyticsControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task LogVisit_ReturnsOk_OnSuccess()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new AnalyticsService(context);
            var controller = new AnalyticsController(service);
            var dto = new VisitCreateDto
            {
                POIId = 1,
                SessionId = "session-1",
                TriggerType = "geofence",
                LanguageCode = "en"
            };

            // Act
            var result = await controller.LogVisit(dto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetSummary_ReturnsOkWithAnalyticsSummary()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var service = new AnalyticsService(context);
            var controller = new AnalyticsController(service);

            // Act
            var result = await controller.GetSummary();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<AnalyticsSummaryDto>(okResult.Value);
            Assert.Equal(0, dto.TotalVisits);
        }
    }
}
