using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;
using System;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/qr")]
    public class QRController : ControllerBase
    {
        private readonly IQRCodeService _qrCodeService;
        private readonly IPOIService _poiService;

        public QRController(IQRCodeService qrCodeService, IPOIService poiService)
        {
            _qrCodeService = qrCodeService;
            _poiService = poiService;
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> LookupQR(string code, [FromQuery] string lang = "en")
        {
            var qr = await _qrCodeService.GetByCodeAsync(code);
            if (qr == null)
            {
                return NotFound(new { error = "NotFound", message = $"QR Code '{code}' was not found or is inactive." });
            }

            var poi = await _poiService.GetByIdAsync(qr.POIId, lang);
            if (poi == null)
            {
                return NotFound(new { error = "NotFound", message = $"POI with ID {qr.POIId} associated with QR Code '{code}' was not found or is inactive." });
            }

            return Ok(poi);
        }

        [HttpPost("/api/admin/qr/generate/{poiId:int}")]
        public async Task<IActionResult> GenerateQR(int poiId)
        {
            try
            {
                // Note: Authority check placeholder for Phase 5 JWT
                var result = await _qrCodeService.GenerateQRCodeAsync(poiId);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { error = "NotFound", message = ex.Message });
            }
        }
    }
}
