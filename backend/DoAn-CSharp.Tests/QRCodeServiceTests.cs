using Xunit;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.IO;

namespace DoAn_CSharp.Tests
{
    public class QRCodeServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetByCodeAsync_ReturnsCorrectQRCode_WhenExists()
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
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();

            var service = new QRCodeService(context);

            // Act
            var result = await service.GetByCodeAsync("VKE-POI-001");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("VKE-POI-001", result.Code);
            Assert.Equal(1, result.POIId);
        }

        [Fact]
        public async Task GenerateQRCodeAsync_CreatesRecordAndPhysicalPNG()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Cơm Tấm Bà Lan", Slug = "com-tam-ba-lan", Category = "restaurant", IsActive = true };
            await context.POIs.AddAsync(poi);
            await context.SaveChangesAsync();

            var service = new QRCodeService(context);

            // Ensure wwwroot/qrcodes directory exists
            var qrDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes");
            if (!Directory.Exists(qrDir))
            {
                Directory.CreateDirectory(qrDir);
            }

            // Act
            var result = await service.GenerateQRCodeAsync(1);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("VKE-POI-001", result.Code);
            Assert.Equal(1, result.POIId);

            var dbQr = await context.QRCodes.FirstOrDefaultAsync(q => q.POIId == 1 && q.IsActive);
            Assert.NotNull(dbQr);
            Assert.Equal("VKE-POI-001", dbQr.Code);

            var physicalFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes", "VKE-POI-001.png");
            Assert.True(File.Exists(physicalFilePath), $"QR Code PNG file should exist at: {physicalFilePath}");

            // Cleanup generated QR Code file from test
            if (File.Exists(physicalFilePath))
            {
                File.Delete(physicalFilePath);
            }
        }
    }
}
