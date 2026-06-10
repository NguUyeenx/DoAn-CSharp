using System;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AudioController : ControllerBase
    {
        private readonly ITTSService _ttsService;

        public AudioController(ITTSService ttsService)
        {
            _ttsService = ttsService;
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
                string audioUrl = await _ttsService.GenerateAudioAsync(text, lang, poiId);
                // Return absolute URL or relative URL based on config, relative is fine
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
