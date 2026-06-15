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
                    var fullCustomUrl = $"{Request.Scheme}://{Request.Host}{customAudio.FilePath}";
                    return Ok(new { url = fullCustomUrl });
                }

                // If not found, call TTS
                string audioUrl = await _ttsService.GenerateAudioAsync(text, lang, poiId);
                var fullUrl = $"{Request.Scheme}://{Request.Host}{audioUrl}";
                return Ok(new { url = fullUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
