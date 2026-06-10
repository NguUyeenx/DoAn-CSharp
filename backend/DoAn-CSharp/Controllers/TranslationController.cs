using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/translations")]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationService _translationService;

        public TranslationController(ITranslationService translationService)
        {
            _translationService = translationService;
        }

        [HttpGet("{poiId:int}/{lang}")]
        public async Task<IActionResult> GetTranslation(int poiId, string lang)
        {
            var translation = await _translationService.GetTranslationAsync(poiId, lang);
            if (translation == null)
            {
                return NotFound(new { error = "NotFound", message = $"Translation for POI {poiId} in language '{lang}' was not found." });
            }
            return Ok(translation);
        }

        [Authorize(Roles = "admin")]
        [HttpPost]
        public async Task<IActionResult> UpsertTranslation([FromBody] TranslationCreateDto dto)
        {
            var result = await _translationService.UpsertTranslationAsync(dto);
            return Ok(result);
        }
    }
}
