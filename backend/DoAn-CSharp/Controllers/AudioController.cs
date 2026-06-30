using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Services;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AudioController : ControllerBase
    {
        private readonly ITTSService _ttsService;
        private readonly AppDbContext _context;

        public AudioController(ITTSService ttsService, AppDbContext context)
        {
            _ttsService = ttsService;
            _context = context;
        }

        [HttpGet("generate")]
        public async Task<IActionResult> GenerateAudio([FromQuery] string text, [FromQuery] string lang, [FromQuery] int poiId)
        {
            if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(lang))
            {
                return BadRequest("Text and lang are required.");
            }

            try
            {
                // First check if there is a custom audio file uploaded for this POI and language
                var customAudio = await _context.AudioFiles
                    .FirstOrDefaultAsync(a => a.TranslationType == TranslationType.POI 
                                           && a.TranslationId == poiId 
                                           && a.LanguageCode.ToLower() == lang.ToLower()
                                           && a.AudioType == "custom");

                if (customAudio != null)
                {
                    return Ok(new { url = customAudio.FilePath });
                }

                // Compute MD5 hash of the text to check against cached TTS
                string textHash = "";
                using (var md5 = System.Security.Cryptography.MD5.Create())
                {
                    var bytes = System.Text.Encoding.UTF8.GetBytes(text);
                    var hashBytes = md5.ComputeHash(bytes);
                    textHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }

                // Find the translation record to match TranslationId (which is POITranslation.Id for TTS)
                var translation = await _context.POITranslations
                    .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode.ToLower() == lang.ToLower());

                int translationId = translation?.Id ?? poiId;

                // Check if a cached TTS audio file exists and its hash matches the current text
                var ttsAudio = await _context.AudioFiles
                    .FirstOrDefaultAsync(a => a.TranslationType == TranslationType.POI 
                                           && (a.TranslationId == translationId || a.TranslationId == poiId)
                                           && a.LanguageCode.ToLower() == lang.ToLower() 
                                           && a.AudioType == "tts");

                if (ttsAudio != null && ttsAudio.TranslatedTextHash == textHash)
                {
                    return Ok(new { url = ttsAudio.FilePath });
                }

                // If not found or text changed, generate new TTS
                var ttsResult = await _ttsService.GenerateAudioAsync(text, lang, poiId);

                if (ttsAudio == null)
                {
                    ttsAudio = new AudioFile
                    {
                        TranslationType = TranslationType.POI,
                        TranslationId = translationId,
                        LanguageCode = lang,
                        FilePath = ttsResult.Url,
                        DurationSeconds = ttsResult.DurationSeconds,
                        AudioType = "tts",
                        TTSProvider = "edge-tts",
                        TranslatedTextHash = textHash,
                        GeneratedAt = DateTime.UtcNow,
                        IsDefault = true
                    };
                    await _context.AudioFiles.AddAsync(ttsAudio);
                }
                else
                {
                    ttsAudio.FilePath = ttsResult.Url;
                    ttsAudio.DurationSeconds = ttsResult.DurationSeconds;
                    ttsAudio.TranslatedTextHash = textHash;
                    ttsAudio.GeneratedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { url = ttsResult.Url });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
