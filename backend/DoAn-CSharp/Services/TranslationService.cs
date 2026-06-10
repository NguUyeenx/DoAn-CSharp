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
        private readonly ITTSService _ttsService;

        public TranslationService(AppDbContext context, ITTSService ttsService)
        {
            _context = context;
            _ttsService = ttsService;
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

            bool shouldGenerateAudio = false;
            string textToGenerate = string.Empty;

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

                if (!string.IsNullOrWhiteSpace(dto.AudioText))
                {
                    shouldGenerateAudio = true;
                    textToGenerate = dto.AudioText;
                }
            }
            else
            {
                if (translation.AudioText != dto.AudioText && !string.IsNullOrWhiteSpace(dto.AudioText))
                {
                    shouldGenerateAudio = true;
                    textToGenerate = dto.AudioText;
                }

                // Update existing
                translation.Name = dto.Name;
                translation.ShortDescription = dto.ShortDescription;
                translation.FullDescription = dto.FullDescription;
                translation.AudioText = dto.AudioText;
            }

            await _context.SaveChangesAsync();

            if (shouldGenerateAudio)
            {
                try
                {
                    var audioUrl = await _ttsService.GenerateAudioAsync(textToGenerate, targetLang, dto.POIId);
                    
                    var existingAudio = await _context.AudioFiles.FirstOrDefaultAsync(a => a.POIId == dto.POIId && a.LanguageCode == targetLang && a.AudioType == "tts");
                    if (existingAudio == null)
                    {
                        var audioFile = new AudioFile
                        {
                            POIId = dto.POIId,
                            LanguageCode = targetLang,
                            FilePath = audioUrl,
                            AudioType = "tts",
                            TTSProvider = "edge-tts",
                            GeneratedAt = DateTime.UtcNow,
                            IsDefault = true
                        };
                        await _context.AudioFiles.AddAsync(audioFile);
                    }
                    else
                    {
                        existingAudio.FilePath = audioUrl;
                        existingAudio.GeneratedAt = DateTime.UtcNow;
                    }
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error generating TTS: {ex.Message}");
                }
            }

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
