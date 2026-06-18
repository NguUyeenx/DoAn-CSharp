using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;
using DoAn_CSharp.Data;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize(Roles = "owner")]
    public class NotificationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var ownerId = GetCurrentOwnerId();
            var notifs = await _context.Notifications
                .Where(n => n.OwnerId == ownerId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
            return Ok(notifs);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var ownerId = GetCurrentOwnerId();
            var count = await _context.Notifications
                .CountAsync(n => n.OwnerId == ownerId && !n.IsRead);
            return Ok(new { count = count });
        }

        [HttpPut("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var ownerId = GetCurrentOwnerId();
            var notif = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.OwnerId == ownerId);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Marked as read" });
        }

        private int GetCurrentOwnerId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new System.UnauthorizedAccessException("Owner ID not found.");
            return int.Parse(idClaim);
        }
    }
}
