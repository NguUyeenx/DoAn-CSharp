using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using System.Security.Claims;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Data;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/translations")]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationService _translationService;
        private readonly AppDbContext _context;

        public TranslationController(ITranslationService translationService, AppDbContext context)
        {
            _translationService = translationService;
            _context = context;
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

        [Authorize(Roles = "admin,owner")]
        [HttpPost]
        public async Task<IActionResult> UpsertTranslation([FromBody] TranslationCreateDto dto)
        {
            if (User.IsInRole("owner"))
            {
                var ownerId = GetCurrentOwnerId();
                var poi = await _context.POIs.FindAsync(dto.POIId);
                if (poi == null || poi.OwnerId != ownerId)
                {
                    return Forbid();
                }
            }

            var result = await _translationService.UpsertTranslationAsync(dto);
            return Ok(result);
        }

        private int GetCurrentOwnerId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("Owner ID not found in token.");
            return int.Parse(idClaim);
        }
    }
}
