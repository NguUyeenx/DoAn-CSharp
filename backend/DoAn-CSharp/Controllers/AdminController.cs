using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;
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
        private readonly ITTSService _ttsService;
        private readonly ITranslationService _translationService;
        private readonly ICloudStorageService _cloudStorageService;

        public AdminController(
            AppDbContext context, 
            IPOIService poiService, 
            ITTSService ttsService, 
            ITranslationService translationService,
            ICloudStorageService cloudStorageService)
        {
            _context = context;
            _poiService = poiService;
            _ttsService = ttsService;
            _translationService = translationService;
            _cloudStorageService = cloudStorageService;
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

            var poi = await _context.POIs.FindAsync(id);
            if (poi == null) return NotFound("POI not found.");

            var success = await _poiService.UpdateApprovalStatusAsync(id, dto.Status);
            if (!success) return NotFound("POI not found.");

            if (poi.OwnerId.HasValue)
            {
                string statusText = dto.Status == "approved" ? "được duyệt" : (dto.Status == "rejected" ? "bị từ chối" : "đưa về trạng thái chờ duyệt");
                _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
                {
                    OwnerId = poi.OwnerId.Value,
                    Message = $"Địa điểm '{poi.Name}' của bạn đã {statusText} bởi Admin.",
                    Type = "POIStatusChanged",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

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

        [HttpGet("quiz")]
        public async Task<IActionResult> GetQuizQuestions([FromQuery] int? poiId = null)
        {
            var query = _context.QuizQuestions.AsQueryable();
            if (poiId.HasValue)
            {
                query = query.Where(q => q.POIId == poiId.Value);
            }

            var quizList = await query
                .Select(q => new
                {
                    q.Id,
                    q.POIId,
                    POIName = _context.POIs.Where(p => p.Id == q.POIId).Select(p => p.Name).FirstOrDefault(),
                    q.QuestionText,
                    q.AnswerA,
                    q.AnswerB,
                    q.AnswerC,
                    q.AnswerD,
                    q.CorrectOption,
                    q.ExplanationText
                })
                .ToListAsync();

            return Ok(quizList);
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

        // ── Category Management ─────────────────────────────────────────

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.POICategories
                .Select(c => new
                {
                    c.Id,
                    c.Slug,
                    c.Name,
                    c.IconUrl,
                    c.Color,
                    c.SortOrder,
                    c.IsActive,
                    PoiCount = _context.POIs.Count(p => p.Category == c.Slug && p.DeletedAt == null)
                })
                .OrderBy(c => c.SortOrder)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Slug))
            {
                return BadRequest("Name and Slug are required.");
            }

            var category = new POICategory
            {
                Slug = dto.Slug,
                Name = dto.Name,
                IconUrl = dto.IconUrl,
                Color = dto.Color,
                SortOrder = dto.SortOrder,
                IsActive = true
            };

            _context.POICategories.Add(category);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_CATEGORY", "Category", category.Id, $"Created category {category.Slug}");

            return Ok(category);
        }

        [HttpPut("categories/{id:int}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryDto dto)
        {
            var category = await _context.POICategories.FindAsync(id);
            if (category == null) return NotFound("Category not found.");

            category.Name = dto.Name;
            category.Slug = dto.Slug;
            category.IconUrl = dto.IconUrl;
            category.Color = dto.Color;
            category.SortOrder = dto.SortOrder;
            category.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpDelete("categories/{id:int}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.POICategories
                .Include(c => c.POIs)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) return NotFound("Category not found.");

            if (category.POIs.Any())
            {
                return BadRequest("Cannot delete category because it contains active POIs.");
            }

            _context.POICategories.Remove(category);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_CATEGORY", "Category", category.Id, $"Deleted category {category.Slug}");
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
            
            // Pre-load POI translations mapping (TranslationId -> POIId)
            var poiTranslations = await _context.POITranslations.ToDictionaryAsync(t => t.Id, t => t.POIId);
            // Pre-load POI names (POIId -> Name)
            var pois = await _context.POIs.ToDictionaryAsync(p => p.Id, p => p.Name);

            var dtos = audios.Select(x => {
                int poiId = 0;
                if (x.TranslationType == Models.Entities.TranslationType.POI)
                {
                    if (x.AudioType == "custom")
                    {
                        poiId = x.TranslationId;
                    }
                    else // tts
                    {
                        if (poiTranslations.TryGetValue(x.TranslationId, out var mappedPoiId))
                        {
                            poiId = mappedPoiId;
                        }
                    }
                }

                pois.TryGetValue(poiId, out var poiName);

                bool isCloudUrl = x.FilePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                                  x.FilePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
                
                bool fileExists = isCloudUrl;
                if (!isCloudUrl)
                {
                    var physicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", x.FilePath.TrimStart('/'));
                    fileExists = System.IO.File.Exists(physicalPath);
                }

                return new
                {
                    x.Id,
                    POIId = poiId,
                    PoiName = poiName ?? $"Food Spot #{poiId}",
                    x.LanguageCode,
                    x.FilePath,
                    x.DurationSeconds,
                    x.AudioType,
                    x.TTSProvider,
                    x.VoiceName,
                    x.GeneratedAt,
                    x.IsDefault,
                    FileExists = fileExists
                };
            }).Where(d => d.FileExists).ToList();

            return Ok(dtos);
        }

        [HttpDelete("audio/{id:int}")]
        public async Task<IActionResult> DeleteAudio(int id)
        {
            var audio = await _context.AudioFiles.FindAsync(id);
            if (audio == null) return NotFound();

            bool isCloudUrl = audio.FilePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || 
                              audio.FilePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase);

            if (isCloudUrl)
            {
                try
                {
                    await _cloudStorageService.DeleteFileAsync(audio.FilePath, "audio");
                }
                catch (System.Exception ex)
                {
                    System.Console.WriteLine($"Error deleting cloud audio file: {ex.Message}");
                }
            }
            else
            {
                // Delete physical file if exists
                var physicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", audio.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(physicalPath))
                {
                    try
                    {
                        System.IO.File.Delete(physicalPath);
                    }
                    catch (System.Exception ex)
                    {
                        System.Console.WriteLine($"Error deleting physical audio file: {ex.Message}");
                    }
                }
            }

            _context.AudioFiles.Remove(audio);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("audio/{id:int}/regenerate")]
        public async Task<IActionResult> RegenerateAudio(int id)
        {
            var audio = await _context.AudioFiles.FindAsync(id);
            if (audio == null) return NotFound("Audio not found");

            if (audio.AudioType == "custom")
            {
                return BadRequest(new { error = "BadRequest", message = "Cannot regenerate custom uploaded audio files using TTS." });
            }

            if (audio.TranslationType != Models.Entities.TranslationType.POI)
            {
                return BadRequest(new { error = "BadRequest", message = "Regeneration is only supported for POI audio translations." });
            }

            var translation = await _context.POITranslations.FindAsync(audio.TranslationId);
            if (translation == null)
            {
                return NotFound(new { error = "NotFound", message = $"POI translation (ID: {audio.TranslationId}) not found." });
            }

            if (string.IsNullOrWhiteSpace(translation.AudioText))
            {
                return BadRequest(new { error = "BadRequest", message = "Translation audio text is empty." });
            }

            // Delete existing physical file if exists
            var physicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", audio.FilePath.TrimStart('/'));
            if (System.IO.File.Exists(physicalPath))
            {
                try
                {
                    System.IO.File.Delete(physicalPath);
                }
                catch (System.Exception ex)
                {
                    System.Console.WriteLine($"Error deleting physical audio file before regeneration: {ex.Message}");
                }
            }

            try
            {
                // Generate new audio via edge-tts
                var ttsResult = await _ttsService.GenerateAudioAsync(translation.AudioText, audio.LanguageCode, translation.POIId);

                audio.FilePath = ttsResult.Url;
                audio.DurationSeconds = ttsResult.DurationSeconds;
                audio.GeneratedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Audio file regenerated successfully.",
                    id = audio.Id,
                    filePath = audio.FilePath,
                    durationSeconds = audio.DurationSeconds,
                    generatedAt = audio.GeneratedAt
                });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "InternalServerError", message = $"Failed to generate TTS audio: {ex.Message}" });
            }
        }

        [HttpPost("audio/regenerate-all")]
        public async Task<IActionResult> RegenerateAllAudio([FromBody] RegenerateAudioRequest? request)
        {
            if (request?.Languages == null || !request.Languages.Any())
            {
                return BadRequest(new { error = "BadRequest", message = "Vui lòng chọn ít nhất một ngôn ngữ để tái tạo." });
            }

            var targetLangs = request.Languages.Select(l => l.ToLowerInvariant()).ToList();
            
            // Get all active POIs
            var pois = await _context.POIs
                .Where(p => p.DeletedAt == null && p.ApprovalStatus == "approved")
                .ToListAsync();

            int successCount = 0;
            int failCount = 0;

            foreach (var poi in pois)
            {
                foreach (var langCode in targetLangs)
                {
                    try
                    {
                        // Check if translation exists
                        var translation = await _context.POITranslations
                            .FirstOrDefaultAsync(t => t.POIId == poi.Id && t.LanguageCode.ToLower() == langCode);

                        if (translation == null)
                        {
                            // If translation doesn't exist, use translation service to automatically translate on-the-fly
                            // This translates text and automatically creates/saves POITranslation and AudioFile records
                            var newTranslationDto = await _translationService.GetTranslationAsync(poi.Id, langCode);
                            if (newTranslationDto != null)
                            {
                                successCount++;
                            }
                            else
                            {
                                failCount++;
                            }
                        }
                        else
                        {
                            if (string.IsNullOrWhiteSpace(translation.AudioText))
                            {
                                failCount++;
                                continue;
                            }

                            // If translation exists, find its corresponding AudioFile record
                            var audio = await _context.AudioFiles
                                .FirstOrDefaultAsync(x => x.TranslationId == translation.Id && x.AudioType == "tts" && x.TranslationType == Models.Entities.TranslationType.POI);

                            if (audio != null)
                            {
                                // Delete existing physical file if it exists
                                var physicalPath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "wwwroot", audio.FilePath.TrimStart('/'));
                                if (System.IO.File.Exists(physicalPath))
                                {
                                    try
                                    {
                                        System.IO.File.Delete(physicalPath);
                                    }
                                    catch (System.Exception ex)
                                    {
                                        System.Console.WriteLine($"Error deleting physical audio file before regeneration: {ex.Message}");
                                    }
                                }
                            }

                            // Generate new audio using edge-tts
                            var ttsResult = await _ttsService.GenerateAudioAsync(translation.AudioText, langCode, poi.Id);

                            if (audio == null)
                            {
                                // Create new AudioFile record if it didn't exist
                                audio = new AudioFile
                                {
                                    TranslationType = Models.Entities.TranslationType.POI,
                                    TranslationId = translation.Id,
                                    LanguageCode = langCode,
                                    FilePath = ttsResult.Url,
                                    DurationSeconds = ttsResult.DurationSeconds,
                                    AudioType = "tts",
                                    TTSProvider = "edge-tts",
                                    GeneratedAt = DateTime.UtcNow,
                                    IsDefault = true
                                };
                                await _context.AudioFiles.AddAsync(audio);
                            }
                            else
                            {
                                // Update existing AudioFile record
                                audio.FilePath = ttsResult.Url;
                                audio.DurationSeconds = ttsResult.DurationSeconds;
                                audio.GeneratedAt = DateTime.UtcNow;
                            }

                            await _context.SaveChangesAsync();
                            successCount++;
                        }
                    }
                    catch (System.Exception ex)
                    {
                        System.Console.WriteLine($"Error regenerating TTS audio for POI ID {poi.Id} and language {langCode}: {ex.Message}");
                        failCount++;
                    }
                }
            }

            return Ok(new
            {
                message = "Regeneration of selected TTS audio files completed.",
                total = pois.Count * targetLangs.Count,
                success = successCount,
                failed = failCount
            });
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

            await LogAuditAsync("LOCK_OWNER", "Owner", owner.Id, $"Locked owner {owner.Username}");

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

            await LogAuditAsync("UNLOCK_OWNER", "Owner", owner.Id, $"Unlocked owner {owner.Username}");

            return Ok(new { message = "Owner unlocked/approved successfully." });
        }

        [HttpPut("owners/{id:int}/reset-password")]
        public async Task<IActionResult> ResetOwnerPassword(int id, [FromBody] ResetPasswordAdminDto dto)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");

            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length <= 6)
                return BadRequest("Mật khẩu phải trên 6 ký tự.");

            owner.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            owner.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Owner password reset successfully." });
        }

        [HttpPost("owners")]
        public async Task<IActionResult> CreateOwner([FromBody] CreateOwnerAdminDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password) || 
                string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.DisplayName))
            {
                return BadRequest("Tất cả các thông tin là bắt buộc.");
            }

            if (dto.Password.Length <= 6)
            {
                return BadRequest("Mật khẩu phải trên 6 ký tự.");
            }

            if (await _context.Owners.AnyAsync(o => o.Username == dto.Username))
            {
                return BadRequest("Tên đăng nhập đã tồn tại.");
            }

            if (await _context.Owners.AnyAsync(o => o.Email == dto.Email))
            {
                return BadRequest("Email đã tồn tại.");
            }

            var owner = new Owner
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                DisplayName = dto.DisplayName,
                OwnerStatus = "approved",
                IsPaid = true,
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Owners.AddAsync(owner);
            await _context.SaveChangesAsync();

            await LogAuditAsync("CREATE_OWNER", "Owner", owner.Id, $"Created owner {owner.Username}");

            return CreatedAtAction(nameof(GetAllOwners), new { id = owner.Id }, new
            {
                owner.Id,
                owner.Username,
                owner.Email,
                owner.DisplayName,
                owner.OwnerStatus,
                owner.CreatedAt
            });
        }

        [HttpDelete("owners/{id:int}")]
        public async Task<IActionResult> DeleteOwner(int id)
        {
            var owner = await _context.Owners.FindAsync(id);
            if (owner == null) return NotFound("Owner not found.");

            // Set OwnerId to null for all POIs owned by this owner
            var pois = await _context.POIs.Where(p => p.OwnerId == id).ToListAsync();
            foreach (var poi in pois)
            {
                poi.OwnerId = null;
            }

            // Delete notifications for this owner
            var notifications = await _context.Notifications.Where(n => n.OwnerId == id).ToListAsync();
            _context.Notifications.RemoveRange(notifications);

            // Delete the owner
            _context.Owners.Remove(owner);
            await _context.SaveChangesAsync();

            await LogAuditAsync("DELETE_OWNER", "Owner", id, $"Deleted owner {owner.Username}");

            return NoContent();
        }

        /// <summary>Lấy nhật ký chuyến đi / hoạt động của du khách</summary>
        [HttpGet("visit-logs")]
        public async Task<IActionResult> GetVisitLogs()
        {
            var logs = await _context.VisitLogs
                .Include(v => v.POI)
                .OrderByDescending(v => v.VisitedAt)
                .Select(v => new
                {
                    v.Id,
                    v.POIId,
                    PoiName = v.POI != null ? v.POI.Name : "N/A",
                    Latitude = v.POI != null ? v.POI.Latitude : 0.0,
                    Longitude = v.POI != null ? v.POI.Longitude : 0.0,
                    v.SessionId,
                    v.TriggerType,
                    v.LanguageCode,
                    v.VisitedAt
                })
                .ToListAsync();

            return Ok(logs);
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

            // Notify new owner if assigned
            if (dto.OwnerId.HasValue)
            {
                _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
                {
                    OwnerId = dto.OwnerId.Value,
                    Message = $"Bạn đã được gán quyền sở hữu địa điểm '{poi.Name}' bởi Admin.",
                    Type = "POIOwnerAssigned",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();

            return Ok(new { message = "POI owner updated successfully." });
        }

        [HttpPost("pois/{id:int}/restore")]
        public async Task<IActionResult> RestorePOI(int id)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null) return NotFound("POI not found.");

            var success = await _poiService.RestoreAsync(id);
            if (!success) return NotFound("POI not found or not deleted.");

            if (poi.OwnerId.HasValue)
            {
                _context.Notifications.Add(new DoAn_CSharp.Models.Entities.Notification
                {
                    OwnerId = poi.OwnerId.Value,
                    Message = $"Địa điểm '{poi.Name}' của bạn đã được khôi phục bởi Admin.",
                    Type = "POIRestored",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

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

        private async Task LogAuditAsync(string action, string entityName, int? entityId, string details)
        {
            var username = User?.Identity?.Name ?? "admin";
            var log = new Models.Entities.AuditLog
            {
                UserId = 1,
                UserName = username,
                UserRole = "admin",
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
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

    public class CreateOwnerAdminDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    public class RegenerateAudioRequest
    {
        public System.Collections.Generic.List<string>? Languages { get; set; }
    }
}
