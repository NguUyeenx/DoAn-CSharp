using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;
using QRCoder;

namespace DoAn_CSharp.Services
{
    public class QRCodeService : IQRCodeService
    {
        private readonly AppDbContext _context;

        public QRCodeService(AppDbContext context)
        {
            _context = context;
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

            string code = $"VKE-POI-{poiId:D3}";
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
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode($"https://vkexplorer.com/qr/{code}", QRCodeGenerator.ECCLevel.Q);
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

        private static QRCodeDto MapToDto(QRCode entity)
        {
            return new QRCodeDto
            {
                Id = entity.Id,
                POIId = entity.POIId,
                Code = entity.Code,
                QRImageUrl = entity.QRImageUrl,
                IsActive = entity.IsActive,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
