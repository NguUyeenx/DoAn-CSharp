using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;
using System.Net.Http;
using System.Text.Json;
using System.Text;

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

            if (translation != null)
            {
                return MapToDto(translation);
            }

            // Fallback: translate on the fly if requested language translation is missing
            var baseTranslation = await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode.ToLower() == "vi")
                ?? await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode.ToLower() == "en")
                ?? await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == poiId);

            if (baseTranslation == null)
            {
                return null;
            }

            // Perform automatic translation using Google Translate free endpoint
            string translatedName = baseTranslation.Name;
            if (baseTranslation.LanguageCode.ToLower() != targetLang)
            {
                translatedName = await TranslateTextAsync(baseTranslation.Name, targetLang);
            }
            string translatedShortDesc = await TranslateTextAsync(baseTranslation.ShortDescription, targetLang);
            string translatedFullDesc = await TranslateTextAsync(baseTranslation.FullDescription, targetLang);
            string translatedAudioText = await TranslateTextAsync(baseTranslation.AudioText, targetLang);

            // Save new translation to the database
            translation = new POITranslation
            {
                POIId = poiId,
                LanguageCode = targetLang,
                Name = translatedName,
                ShortDescription = translatedShortDesc,
                FullDescription = translatedFullDesc,
                AudioText = translatedAudioText
            };

            await _context.POITranslations.AddAsync(translation);
            await _context.SaveChangesAsync();

            // Pre-generate audio for the new translation
            if (!string.IsNullOrWhiteSpace(translatedAudioText))
            {
                try
                {
                    string audioUrl = await _ttsService.GenerateAudioAsync(translatedAudioText, targetLang, poiId);
                    var audioFile = new AudioFile
                    {
                        TranslationType = TranslationType.POI,
                        TranslationId = translation.Id,
                        LanguageCode = targetLang,
                        FilePath = audioUrl,
                        AudioType = "tts",
                        TTSProvider = "edge-tts",
                        GeneratedAt = DateTime.UtcNow,
                        IsDefault = true
                    };
                    await _context.AudioFiles.AddAsync(audioFile);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error pre-generating TTS for {targetLang}: {ex.Message}");
                }
            }

            return MapToDto(translation);
        }

        private async Task<string> TranslateTextAsync(string text, string targetLanguage)
        {
            if (string.IsNullOrWhiteSpace(text)) return string.Empty;
            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                
                string url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={targetLanguage}&dt=t&q={Uri.EscapeDataString(text)}";
                var response = await client.GetStringAsync(url);

                using var doc = JsonDocument.Parse(response);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var firstArray = root[0];
                    if (firstArray.ValueKind == JsonValueKind.Array)
                    {
                        var sb = new StringBuilder();
                        foreach (var element in firstArray.EnumerateArray())
                        {
                            if (element.ValueKind == JsonValueKind.Array && element.GetArrayLength() > 0)
                            {
                                var segment = element[0];
                                if (segment.ValueKind == JsonValueKind.String)
                                {
                                    sb.Append(segment.GetString());
                                }
                            }
                        }
                        return sb.ToString();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TranslationService] Translate error: {ex.Message}");
            }
            return text;
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
                    
                    var existingAudio = await _context.AudioFiles.FirstOrDefaultAsync(a => a.TranslationType == TranslationType.POI && a.TranslationId == translation.Id && a.LanguageCode == targetLang && a.AudioType == "tts");
                    if (existingAudio == null)
                    {
                        var audioFile = new AudioFile
                        {
                            TranslationType = TranslationType.POI,
                            TranslationId = translation.Id,
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
