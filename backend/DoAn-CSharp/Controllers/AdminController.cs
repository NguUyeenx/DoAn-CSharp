using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPOIService _poiService;

        public AdminController(AppDbContext context, IPOIService poiService)
        {
            _context = context;
            _poiService = poiService;
        }

        // ── Owner Approvals ───────────────────────────────────────────

        /// <summary>Lấy danh sách các Owner đăng ký chờ duyệt</summary>
        [HttpGet("owners/pending")]
        public async Task<IActionResult> GetPendingOwners()
        {
            var owners = await _context.Owners
                .Where(o => o.OwnerStatus == "pending")
                .Select(o => new
                {
                    o.Id,
                    o.Username,
                    o.Email,
                    o.DisplayName,
                    o.CreatedAt
                })
                .ToListAsync();
            
            return Ok(owners);
        }

        /// <summary>Duyệt Owner</summary>
        [HttpPut("owners/{id:int}/approve")]
        public async Task<IActionResult> ApproveOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");
            
            owner.OwnerStatus = "approved";
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner approved successfully." });
        }

        /// <summary>Từ chối Owner</summary>
        [HttpPut("owners/{id:int}/reject")]
        public async Task<IActionResult> RejectOwner(int id, [FromBody] RejectDto dto)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");
            
            owner.OwnerStatus = "rejected";
            owner.AdminNote = dto.Reason;
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner rejected." });
        }

        // ── POI Approvals ─────────────────────────────────────────────

        /// <summary>Lấy danh sách các POI chờ duyệt</summary>
        [HttpGet("pois/pending")]
        public async Task<IActionResult> GetPendingPOIs()
        {
            var pois = await _context.POIs
                .Where(p => p.ApprovalStatus == "pending" && p.DeletedAt == null)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Category,
                    p.OwnerId,
                    p.CreatedAt
                })
                .ToListAsync();
            
            return Ok(pois);
        }

        /// <summary>Lấy danh sách tất cả các POI (bao gồm cả chờ duyệt, bị từ chối, đã xóa) cho Admin quản lý</summary>
        [HttpGet("pois")]
        public async Task<IActionResult> GetAllPOIs([FromQuery] string lang = "en")
        {
            var pois = await _context.POIs
                .Include(p => p.Translations)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = pois.Select(p => {
                var translation = p.Translations?.FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == lang.ToLowerInvariant()) 
                    ?? p.Translations?.FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == "en")
                    ?? p.Translations?.FirstOrDefault();

                return new
                {
                    Id = p.Id,
                    Name = translation?.Name ?? p.Name,
                    Slug = p.Slug,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Category = p.Category,
                    ImageUrl = p.ImageUrl,
                    ShortDescription = translation?.ShortDescription ?? string.Empty,
                    OwnerId = p.OwnerId,
                    ApprovalStatus = p.DeletedAt != null ? "deleted" : p.ApprovalStatus,
                    IsActive = p.IsActive,
                    CreatedAt = p.CreatedAt
                };
            }).ToList();

            return Ok(result);
        }

        /// <summary>Duyệt/Từ chối POI</summary>
        [HttpPut("pois/{id:int}/status")]
        public async Task<IActionResult> UpdatePOIStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            if (dto.Status != "approved" && dto.Status != "rejected" && dto.Status != "pending")
                return BadRequest("Invalid status.");

            var success = await _poiService.UpdateApprovalStatusAsync(id, dto.Status);
            if (!success) return NotFound("POI not found.");

            return Ok(new { message = $"POI status updated to {dto.Status}." });
        }

        // ── Quiz Management ─────────────────────────────────────────────

        [HttpPost("quiz")]
        public async Task<IActionResult> CreateQuiz([FromBody] QuizAdminDto dto)
        {
            var quiz = new DoAn_CSharp.Models.Entities.QuizQuestion
            {
                POIId = dto.POIId,
                QuestionText = dto.QuestionText,
                AnswerA = dto.AnswerA,
                AnswerB = dto.AnswerB,
                AnswerC = dto.AnswerC,
                AnswerD = dto.AnswerD,
                CorrectOption = dto.CorrectOption,
                ExplanationText = dto.ExplanationText
            };
            _context.QuizQuestions.Add(quiz);
            await _context.SaveChangesAsync();
            return Ok(quiz);
        }

        [HttpPut("quiz/{id:int}")]
        public async Task<IActionResult> UpdateQuiz(int id, [FromBody] QuizAdminDto dto)
        {
            var quiz = await _context.QuizQuestions.FindAsync(id);
            if (quiz == null) return NotFound("Quiz not found.");

            quiz.QuestionText = dto.QuestionText;
            quiz.AnswerA = dto.AnswerA;
            quiz.AnswerB = dto.AnswerB;
            quiz.AnswerC = dto.AnswerC;
            quiz.AnswerD = dto.AnswerD;
            quiz.CorrectOption = dto.CorrectOption;
            quiz.ExplanationText = dto.ExplanationText;

            await _context.SaveChangesAsync();
            return Ok(quiz);
        }

        [HttpDelete("quiz/{id:int}")]
        public async Task<IActionResult> DeleteQuiz(int id)
        {
            var quiz = await _context.QuizQuestions.FindAsync(id);
            if (quiz == null) return NotFound("Quiz not found.");

            _context.QuizQuestions.Remove(quiz);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        // ── Phase 4: Analytics & Logging ──────────────────────────────

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs.OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync();
            return Ok(logs);
        }

        [HttpGet("audio")]
        public async Task<IActionResult> GetAudioFiles()
        {
            var audios = await _context.AudioFiles.OrderByDescending(x => x.Id).ToListAsync();
            return Ok(audios);
        }

        [HttpDelete("audio/{id:int}")]
        public async Task<IActionResult> DeleteAudio(int id)
        {
            var audio = await _context.AudioFiles.FindAsync(id);
            if (audio == null) return NotFound();
            _context.AudioFiles.Remove(audio);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("audio/{id:int}/regenerate")]
        public async Task<IActionResult> RegenerateAudio(int id)
        {
            var audio = await _context.AudioFiles.FindAsync(id);
            if (audio == null) return NotFound("Audio not found");
            // Placeholder: Call TTSService to regenerate this specific audio
            return Ok(new { message = $"Audio regeneration triggered for ID {id}." });
        }

        // ── Comprehensive Owner Management ───────────────────────────

        [HttpGet("owners")]
        public async Task<IActionResult> GetAllOwners()
        {
            var owners = await _context.Owners
                .Select(o => new
                {
                    o.Id,
                    o.Username,
                    o.Email,
                    o.DisplayName,
                    o.OwnerStatus,
                    o.CreatedAt,
                    o.LastLoginAt,
                    o.AdminNote,
                    PoiCount = _context.POIs.Count(p => p.OwnerId == o.Id && p.DeletedAt == null)
                })
                .ToListAsync();

            return Ok(owners);
        }

        [HttpPut("owners/{id:int}/lock")]
        public async Task<IActionResult> LockOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");

            owner.OwnerStatus = "suspended";
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner locked/suspended successfully." });
        }

        [HttpPut("owners/{id:int}/unlock")]
        public async Task<IActionResult> UnlockOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");

            owner.OwnerStatus = "approved";
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner unlocked/approved successfully." });
        }

        [HttpPut("owners/{id:int}/reset-password")]
        public async Task<IActionResult> ResetOwnerPassword(int id, [FromBody] ResetPasswordAdminDto dto)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");

            owner.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner password reset successfully." });
        }

        // ── Comprehensive POI Management ─────────────────────────────

        [HttpPut("pois/{id:int}/owner")]
        public async Task<IActionResult> UpdatePOIOwner(int id, [FromBody] ChangePOIOwnerDto dto)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null) return NotFound("POI not found.");

            if (dto.OwnerId.HasValue)
            {
                var owner = await _context.Owners.FindAsync(dto.OwnerId.Value);
                if (owner == null) return BadRequest("Owner not found.");
            }

            poi.OwnerId = dto.OwnerId;
            poi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "POI owner updated successfully." });
        }

        [HttpPost("pois/{id:int}/restore")]
        public async Task<IActionResult> RestorePOI(int id)
        {
            var success = await _poiService.RestoreAsync(id);
            if (!success) return NotFound("POI not found or not deleted.");

            return Ok(new { message = "POI restored successfully." });
        }

        // ── Admin Notifications ───────────────────────────────────────

        [HttpGet("notifications")]
        public async Task<IActionResult> GetAdminNotifications()
        {
            var notifications = await _context.Notifications
                .Where(n => n.OwnerId == null)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
            return Ok(notifications);
        }

        [HttpPut("notifications/{id:int}/read")]
        public async Task<IActionResult> MarkNotificationAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null || notification.OwnerId != null) 
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Notification marked as read." });
        }

        [HttpPut("notifications/read-all")]
        public async Task<IActionResult> MarkAllNotificationsAsRead()
        {
            var notifications = await _context.Notifications
                .Where(n => n.OwnerId == null && !n.IsRead)
                .ToListAsync();

            foreach (var n in notifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "All notifications marked as read." });
        }

        /// <summary>Upload audio thuyết minh riêng cho POI bởi Admin</summary>
        [HttpPost("pois/{id:int}/custom-audio")]
        public async Task<IActionResult> SaveCustomAudio(int id, [FromBody] CustomAudioUploadDto dto)
        {
            var poi = await _poiService.GetByIdAsync(id, "en");
            if (poi == null) return NotFound();

            var existingAudio = await _context.AudioFiles
                .FirstOrDefaultAsync(a => a.TranslationType == Models.Entities.TranslationType.POI
                                       && a.TranslationId == id
                                       && a.LanguageCode.ToLower() == dto.LanguageCode.ToLower()
                                       && a.AudioType == "custom");

            if (existingAudio != null)
            {
                existingAudio.FilePath = dto.FilePath;
                existingAudio.DurationSeconds = dto.DurationSeconds;
                existingAudio.GeneratedAt = DateTime.UtcNow;
            }
            else
            {
                var audioFile = new Models.Entities.AudioFile
                {
                    TranslationType = Models.Entities.TranslationType.POI,
                    TranslationId = id,
                    LanguageCode = dto.LanguageCode,
                    FilePath = dto.FilePath,
                    DurationSeconds = dto.DurationSeconds,
                    AudioType = "custom",
                    IsDefault = true,
                    GeneratedAt = DateTime.UtcNow
                };
                await _context.AudioFiles.AddAsync(audioFile);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Custom audio saved successfully." });
        }
    }

    public class RejectDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty; // approved, rejected, pending
    }

    public class QuizAdminDto
    {
        public int POIId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string AnswerA { get; set; } = string.Empty;
        public string AnswerB { get; set; } = string.Empty;
        public string AnswerC { get; set; } = string.Empty;
        public string AnswerD { get; set; } = string.Empty;
        public char CorrectOption { get; set; }
        public string ExplanationText { get; set; } = string.Empty;
    }

    public class ResetPasswordAdminDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ChangePOIOwnerDto
    {
        public int? OwnerId { get; set; }
    }
}
