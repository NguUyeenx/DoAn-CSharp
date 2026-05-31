using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class TranslationService : ITranslationService
    {
        private readonly AppDbContext _context;

        public TranslationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TranslationDto?> GetTranslationAsync(int poiId, string lang)
        {
            var targetLang = lang.ToLowerInvariant();
            var translation = await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode.ToLower() == targetLang);

            if (translation == null)
            {
                return null;
            }

            return MapToDto(translation);
        }

        public async Task<TranslationDto> UpsertTranslationAsync(TranslationCreateDto dto)
        {
            var targetLang = dto.LanguageCode.ToLowerInvariant();
            var translation = await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == dto.POIId && t.LanguageCode.ToLower() == targetLang);

            if (translation == null)
            {
                // Create new
                translation = new POITranslation
                {
                    POIId = dto.POIId,
                    LanguageCode = targetLang,
                    Name = dto.Name,
                    ShortDescription = dto.ShortDescription,
                    FullDescription = dto.FullDescription,
                    AudioText = dto.AudioText
                };
                await _context.POITranslations.AddAsync(translation);
            }
            else
            {
                // Update existing
                translation.Name = dto.Name;
                translation.ShortDescription = dto.ShortDescription;
                translation.FullDescription = dto.FullDescription;
                translation.AudioText = dto.AudioText;
            }

            await _context.SaveChangesAsync();

            return MapToDto(translation);
        }

        private static TranslationDto MapToDto(POITranslation entity)
        {
            return new TranslationDto
            {
                Id = entity.Id,
                POIId = entity.POIId,
                LanguageCode = entity.LanguageCode,
                Name = entity.Name,
                ShortDescription = entity.ShortDescription,
                FullDescription = entity.FullDescription,
                AudioText = entity.AudioText
            };
        }
    }
}
