using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;
using QRCoder;

namespace DoAn_CSharp.Services
{
    public class QRCodeService : IQRCodeService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public QRCodeService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<QRCodeDto?> GetByCodeAsync(string code)
        {
            var qr = await _context.QRCodes
                .FirstOrDefaultAsync(q => q.Code == code && q.IsActive);

            if (qr == null)
            {
                return null;
            }

            return MapToDto(qr);
        }

        public async Task<QRCodeDto> GenerateQRCodeAsync(int poiId)
        {
            var poi = await _context.POIs.FindAsync(poiId);
            if (poi == null)
            {
                throw new ArgumentException($"POI with ID {poiId} not found.");
            }

            // Append a short random string or timestamp to ensure uniqueness
            string uniqueSuffix = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            string code = $"VKE-POI-{poiId:D3}-{uniqueSuffix}";
            string relativePath = $"/qrcodes/{code}.png";

            // Deactivate previous active QR codes for this POI
            var activeQrs = await _context.QRCodes
                .Where(q => q.POIId == poiId && q.IsActive)
                .ToListAsync();

            foreach (var oldQr in activeQrs)
            {
                oldQr.IsActive = false;
            }

            // Generate QR Code bytes using QRCoder
            var baseUrl = _config.GetValue<string>("App:BaseUrl") ?? "http://localhost:5173";
            baseUrl = baseUrl.TrimEnd('/');

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode($"{baseUrl}/qr/{code}", QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrCodeData);
            byte[] qrCodeBytes = qrCode.GetGraphic(20);

            // Write image to wwwroot/qrcodes
            string qrDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes");
            if (!Directory.Exists(qrDir))
            {
                Directory.CreateDirectory(qrDir);
            }

            string physicalPath = Path.Combine(qrDir, $"{code}.png");
            await File.WriteAllBytesAsync(physicalPath, qrCodeBytes);

            // Save QRCode entity
            var qrEntity = new QRCode
            {
                POIId = poiId,
                Code = code,
                QRImageUrl = relativePath,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.QRCodes.AddAsync(qrEntity);
            await _context.SaveChangesAsync();

            return MapToDto(qrEntity);
        }

        public async Task<bool> DeleteQRCodeAsync(int id)
        {
            var qr = await _context.QRCodes.FindAsync(id);
            if (qr == null)
            {
                return false;
            }

            // Remove physical file
            string qrDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "qrcodes");
            string physicalPath = Path.Combine(qrDir, $"{qr.Code}.png");
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            _context.QRCodes.Remove(qr);
            await _context.SaveChangesAsync();
            return true;
        }

        private static QRCodeDto MapToDto(QRCode entity)
        {
            return new QRCodeDto
            {
                Id = entity.Id,
                POIId = entity.POIId,
                Code = entity.Code,
                QRImageUrl = entity.QRImageUrl,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt,
                ScanCount = entity.ScanCount
            };
        }
    }
}
