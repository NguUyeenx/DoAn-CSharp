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
using System.IO;

namespace DoAn_CSharp.Tests
{
    public class QRControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task LookupQR_ReturnsOkWithPOIDto_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.QRCodes.AddAsync(new QRCode
            {
                POIId = 1,
                Code = "VKE-POI-001",
                QRImageUrl = "/qrcodes/VKE-POI-001.png",
                IsActive = true
            });
            await context.SaveChangesAsync();

            var poiService = new POIService(context);
            var qrService = new QRCodeService(context);
            var controller = new QRController(qrService, poiService);

            // Act
            var result = await controller.LookupQR("VKE-POI-001", "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<POIDto>(okResult.Value);
            Assert.Equal("Cơm Tấm Bà Lan", dto.Name);
        }

        [Fact]
        public async Task LookupQR_ReturnsNotFound_WhenNotExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poiService = new POIService(context);
            var qrService = new QRCodeService(context);
            var controller = new QRController(qrService, poiService);

            // Act
            var result = await controller.LookupQR("INVALID", "en");

            // Assert
            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task GenerateQR_ReturnsOkWithQRCodeDto()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm", Slug = "com-tam", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var poiService = new POIService(context);
            var qrService = new QRCodeService(context);
            var controller = new QRController(qrService, poiService);

            // Ensure directory exists for physical file generation
            var qrDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes");
            if (!Directory.Exists(qrDir))
            {
                Directory.CreateDirectory(qrDir);
            }

            // Act
            var result = await controller.GenerateQR(1);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<QRCodeDto>(okResult.Value);
            Assert.Equal("VKE-POI-001", dto.Code);

            // Cleanup
            var filePath = Path.Combine(qrDir, "VKE-POI-001.png");
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
    }
}
