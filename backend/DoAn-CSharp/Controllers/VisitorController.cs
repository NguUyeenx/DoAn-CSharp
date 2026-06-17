using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/visitor")]
    public class VisitorController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VisitorController(AppDbContext context)
        {
            _context = context;
        }

        private DateTime GetVietnamTime()
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus([FromQuery] string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
            {
                return BadRequest("SessionId is required.");
            }

            var vnNow = GetVietnamTime();
            var activation = await _context.VisitorActivations
                .Where(a => a.SessionId == sessionId && a.ExpiresAt > vnNow)
                .OrderByDescending(a => a.ExpiresAt)
                .FirstOrDefaultAsync();

            var bookmarks = await _context.VisitorBookmarks
                .Where(b => b.SessionId == sessionId)
                .Select(b => b.POIId)
                .ToListAsync();

            return Ok(new
            {
                sessionId,
                isActivated = activation != null,
                expiresAt = activation != null ? activation.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ss+07:00") : null,
                bookmarks
            });
        }

        [HttpPost("activate")]
        public async Task<IActionResult> Activate([FromBody] ActivateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SessionId))
            {
                return BadRequest("SessionId is required.");
            }

            if (string.IsNullOrWhiteSpace(request.CardNumber) || request.CardNumber.Length < 16)
            {
                return BadRequest("Thông tin thẻ tín dụng không hợp lệ.");
            }

            // Card payment validation simulation (starts with 42)
            if (!request.CardNumber.StartsWith("4242"))
            {
                return BadRequest("Giao dịch bị từ chối. Vui lòng sử dụng thẻ test (bắt đầu bằng 4242).");
            }

            // Create or extend activation by 24 hours
            var vnNow = GetVietnamTime();
            var activation = new VisitorActivation
            {
                SessionId = request.SessionId,
                ActivatedAt = vnNow,
                ExpiresAt = vnNow.AddHours(24),
                IsPaid = true,
                AmountPaid = 20000,
                CardNumberMasked = "**** **** **** " + request.CardNumber.Substring(request.CardNumber.Length - 4)
            };

            await _context.VisitorActivations.AddAsync(activation);
            await _context.SaveChangesAsync();

            // Get POI slug if QR code was scanned
            string? redirectSlug = null;
            if (!string.IsNullOrWhiteSpace(request.Code))
            {
                var qr = await _context.QRCodes
                    .Include(q => q.POI)
                    .FirstOrDefaultAsync(q => q.Code == request.Code);
                if (qr != null && qr.POI != null)
                {
                    redirectSlug = qr.POI.Slug;
                }
            }

            return Ok(new
            {
                message = "Kích hoạt thành công!",
                expiresAt = activation.ExpiresAt.ToString("yyyy-MM-ddTHH:mm:ss+07:00"),
                redirectSlug
            });
        }

        [HttpPost("bookmark")]
        public async Task<IActionResult> Bookmark([FromBody] BookmarkRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SessionId) || request.POIId <= 0)
            {
                return BadRequest("Invalid request.");
            }

            var exists = await _context.VisitorBookmarks
                .AnyAsync(b => b.SessionId == request.SessionId && b.POIId == request.POIId);

            if (exists)
                return Conflict("Đã được lưu thích.");

            var bookmark = new VisitorBookmark
            {
                SessionId = request.SessionId,
                POIId = request.POIId
            };

            await _context.VisitorBookmarks.AddAsync(bookmark);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã thích địa điểm." });
        }

        [HttpDelete("bookmark")]
        public async Task<IActionResult> Unbookmark([FromBody] BookmarkRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SessionId) || request.POIId <= 0)
            {
                return BadRequest("Invalid request.");
            }

            var bookmark = await _context.VisitorBookmarks
                .FirstOrDefaultAsync(b => b.SessionId == request.SessionId && b.POIId == request.POIId);

            if (bookmark == null)
                return NotFound("Bookmark not found.");

            _context.VisitorBookmarks.Remove(bookmark);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã bỏ thích địa điểm." });
        }
    }

    public class ActivateRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string CardNumber { get; set; } = string.Empty;
        public string CardHolder { get; set; } = string.Empty;
    }

    public class BookmarkRequest
    {
        public string SessionId { get; set; } = string.Empty;
        public int POIId { get; set; }
    }
}
