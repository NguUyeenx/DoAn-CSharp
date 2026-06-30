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
            
            // Find base translation (prefer 'vi', fallback to 'en', then any)
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

            var translation = await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == poiId && t.LanguageCode.ToLower() == targetLang);

            // If we are requesting the base translation language itself, just return it
            if (baseTranslation.LanguageCode.ToLower() == targetLang)
            {
                if (translation != null) return MapToDto(translation);
                return MapToDto(baseTranslation);
            }

            // Compute hash of the base translation content
            string baseHash = ComputeTextHash(baseTranslation.Name, baseTranslation.ShortDescription, baseTranslation.FullDescription, baseTranslation.AudioText);

            // If translation exists and matches the base translation hash, return it
            if (translation != null && translation.OriginalTextHash == baseHash)
            {
                return MapToDto(translation);
            }

            // Otherwise, we perform the translation (either it doesn't exist or hash is outdated)
            string translatedName = baseTranslation.Name;
            if (baseTranslation.LanguageCode.ToLower() != targetLang)
            {
                translatedName = await TranslateTextAsync(baseTranslation.Name, targetLang);
            }
            string translatedShortDesc = await TranslateTextAsync(baseTranslation.ShortDescription, targetLang);
            string translatedFullDesc = await TranslateTextAsync(baseTranslation.FullDescription, targetLang);
            string translatedAudioText = await TranslateTextAsync(baseTranslation.AudioText, targetLang);

            if (translation == null)
            {
                translation = new POITranslation
                {
                    POIId = poiId,
                    LanguageCode = targetLang
                };
                await _context.POITranslations.AddAsync(translation);
            }

            translation.Name = translatedName;
            translation.ShortDescription = translatedShortDesc;
            translation.FullDescription = translatedFullDesc;
            translation.AudioText = translatedAudioText;
            translation.OriginalTextHash = baseHash;
            
            await _context.SaveChangesAsync();

            // Pre-generation of TTS audio removed to avoid automatic Edge-TTS generation during translation updates.

            return MapToDto(translation);
        }

        private static string ComputeTextHash(string name, string shortDesc, string fullDesc, string audioText)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var rawText = $"{name ?? ""}|{shortDesc ?? ""}|{fullDesc ?? ""}|{audioText ?? ""}";
            var bytes = System.Text.Encoding.UTF8.GetBytes(rawText);
            var hashBytes = sha256.ComputeHash(bytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
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

            var baseTranslation = await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == dto.POIId && t.LanguageCode.ToLower() == "vi")
                ?? await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == dto.POIId && t.LanguageCode.ToLower() == "en")
                ?? await _context.POITranslations
                .FirstOrDefaultAsync(t => t.POIId == dto.POIId);

            string baseHash = string.Empty;
            if (baseTranslation != null)
            {
                baseHash = ComputeTextHash(baseTranslation.Name, baseTranslation.ShortDescription, baseTranslation.FullDescription, baseTranslation.AudioText);
            }

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
                    AudioText = dto.AudioText,
                    OriginalTextHash = baseHash
                };
                await _context.POITranslations.AddAsync(translation);
            }
            else
            {
                bool isTextModified = translation.AudioText != dto.AudioText || 
                                      translation.Name != dto.Name || 
                                      translation.ShortDescription != dto.ShortDescription || 
                                      translation.FullDescription != dto.FullDescription;

                // Update existing
                translation.Name = dto.Name;
                translation.ShortDescription = dto.ShortDescription;
                translation.FullDescription = dto.FullDescription;
                translation.AudioText = dto.AudioText;
                
                // Only update OriginalTextHash if the user actually modified the target language text
                // OR if they are updating the base language ('vi').
                if (isTextModified || targetLang == "vi")
                {
                    translation.OriginalTextHash = baseHash;
                }
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
