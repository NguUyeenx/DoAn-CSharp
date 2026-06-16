using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Data;
using Microsoft.EntityFrameworkCore;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/qr")]
    public class QRController : ControllerBase
    {
        private readonly IQRCodeService _qrCodeService;
        private readonly IPOIService _poiService;
        private readonly IAnalyticsService _analyticsService;
        private readonly AppDbContext _context;

        public QRController(
            IQRCodeService qrCodeService,
            IPOIService poiService,
            IAnalyticsService analyticsService,
            AppDbContext context)
        {
            _qrCodeService = qrCodeService;
            _poiService = poiService;
            _analyticsService = analyticsService;
            _context = context;
        }

        /// <summary>Quét QR Code - trả về thông tin POI và ghi log</summary>
        [HttpGet("{code}")]
        public async Task<IActionResult> ScanQR(
            string code,
            [FromQuery] string lang = "en",
            [FromQuery] string? sessionId = null)
        {
            var qr = await _qrCodeService.GetByCodeAsync(code);
            if (qr == null || !qr.IsActive)
                return NotFound(new { error = "NotFound", message = $"QR Code '{code}' was not found or is inactive." });

            // Tăng ScanCount
            var qrEntity = await _context.QRCodes.FirstOrDefaultAsync(q => q.Code == code);
            if (qrEntity != null)
            {
                qrEntity.ScanCount++;
                await _context.SaveChangesAsync();
            }

            // Ghi VisitLog
            await _analyticsService.LogVisitAsync(new VisitCreateDto
            {
                POIId = qr.POIId,
                SessionId = sessionId,
                TriggerType = "qr",
                LanguageCode = lang
            });

            var poi = await _poiService.GetByIdAsync(qr.POIId, lang);
            if (poi == null)
                return NotFound(new { error = "NotFound", message = $"POI not found." });

            return Ok(poi);
        }

        /// <summary>Tạo mã QR cho POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpPost("~/api/admin/pois/{poiId:int}/generate-qr")]
        public async Task<IActionResult> GenerateQR(int poiId)
        {
            try
            {
                var result = await _qrCodeService.GenerateQRCodeAsync(poiId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }

        /// <summary>Lấy danh sách QR codes của một POI (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpGet("~/api/admin/pois/{poiId:int}/qr")]
        public async Task<IActionResult> GetByPoi(int poiId)
        {
            var qrCodes = await _context.QRCodes
                .Where(q => q.POIId == poiId)
                .Select(q => new QRCodeDto
                {
                    Id = q.Id,
                    POIId = q.POIId,
                    Code = q.Code,
                    QRImageUrl = q.QRImageUrl,
                    ScanCount = q.ScanCount,
                    IsActive = q.IsActive
                })
                .ToListAsync();
            return Ok(qrCodes);
        }

        /// <summary>Lấy danh sách tất cả QR codes (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpGet("~/api/admin/qr")]
        public async Task<IActionResult> GetAllQRCodes()
        {
            var qrCodes = await _context.QRCodes
                .Select(q => new QRCodeDto
                {
                    Id = q.Id,
                    POIId = q.POIId,
                    Code = q.Code,
                    QRImageUrl = q.QRImageUrl,
                    ScanCount = q.ScanCount,
                    IsActive = q.IsActive
                })
                .ToListAsync();
            return Ok(qrCodes);
        }

        /// <summary>Xóa QR code không sử dụng (Admin only)</summary>
        [Authorize(Roles = "admin")]
        [HttpDelete("~/api/admin/qr/{id:int}")]
        public async Task<IActionResult> DeleteQR(int id)
        {
            try
            {
                var success = await _qrCodeService.DeleteQRCodeAsync(id);
                if (!success)
                {
                    return NotFound(new { error = "NotFound", message = "QR code not found." });
                }
                return Ok(new { message = "QR code deleted successfully." });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { error = "BadRequest", message = ex.Message });
            }
        }
    }
}
