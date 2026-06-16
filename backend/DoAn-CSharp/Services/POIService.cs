using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class POIService : IPOIService
    {
        private readonly AppDbContext _context;
        private readonly ITranslationService _translationService;

        public POIService(AppDbContext context, ITranslationService translationService)
        {
            _context = context;
            _translationService = translationService;
        }

        public async Task<IEnumerable<POIListDto>> GetAllAsync(string? category, string lang)
        {
            var query = _context.POIs
                .Include(p => p.Translations)
                .Where(p => p.IsActive && p.DeletedAt == null && p.ApprovalStatus == "approved");

            if (!string.IsNullOrWhiteSpace(category))
            {
                var lowerCategory = category.ToLowerInvariant();
                query = query.Where(p => p.Category == lowerCategory);
            }

            var pois = await query.OrderByDescending(p => p.Priority).ToListAsync();
            await EnsureTranslationsExistAsync(pois, lang);
            return pois.Select(p => MapToPOIListDto(p, lang)).ToList();
        }

        public async Task<IEnumerable<POIListDto>> SearchAsync(string queryText, string lang)
        {
            var lower = queryText.ToLowerInvariant();
            var pois = await _context.POIs
                .Include(p => p.Translations)
                .Where(p => p.IsActive && p.DeletedAt == null && p.ApprovalStatus == "approved" &&
                    (p.Name.ToLower().Contains(lower) ||
                     p.Translations.Any(t => t.Name.ToLower().Contains(lower) ||
                                            t.ShortDescription.ToLower().Contains(lower))))
                .OrderByDescending(p => p.Priority)
                .ToListAsync();
            await EnsureTranslationsExistAsync(pois, lang);
            return pois.Select(p => MapToPOIListDto(p, lang)).ToList();
        }

        public async Task<POIDto?> GetBySlugAsync(string slug, string lang)
        {
            var poi = await _context.POIs
                .Include(p => p.Translations)
                .Include(p => p.MenuItems)
                .Include(p => p.QRCodes)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive && p.DeletedAt == null && p.ApprovalStatus == "approved");
            if (poi == null) return null;
            await EnsureTranslationsExistAsync(new[] { poi }, lang);
            return MapToPOIDto(poi, lang);
        }

        public async Task<POIDto?> GetByIdAsync(int id, string lang)
        {
            var poi = await _context.POIs
                .Include(p => p.Translations)
                .Include(p => p.MenuItems)
                .Include(p => p.QRCodes)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (poi == null) return null;
            await EnsureTranslationsExistAsync(new[] { poi }, lang);
            return MapToPOIDto(poi, lang);
        }

        public async Task<IEnumerable<POIListDto>> GetNearbyAsync(double lat, double lng, int radiusMeters, string lang)
        {
            var activePois = await _context.POIs
                .Include(p => p.Translations)
                .Where(p => p.IsActive && p.DeletedAt == null && p.ApprovalStatus == "approved")
                .ToListAsync();

            await EnsureTranslationsExistAsync(activePois, lang);

            var nearbyPois = new List<(POIListDto dto, double dist, int priority)>();

            foreach (var poi in activePois)
            {
                double distance = ComputeHaversine(lat, lng, poi.Latitude, poi.Longitude);
                if (distance <= radiusMeters)
                {
                    var dto = MapToPOIListDto(poi, lang);
                    dto.DistanceMeters = Math.Round(distance, 1);
                    nearbyPois.Add((dto, distance, poi.Priority));
                }
            }

            return nearbyPois
                .OrderBy(n => n.dist)
                .ThenByDescending(n => n.priority)
                .Select(n => n.dto)
                .ToList();
        }

        public async Task<POIDto> CreateAsync(POICreateDto dto, int? ownerId = null)
        {
            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? await GenerateUniqueSlugAsync(dto.Name)
                : dto.Slug;

            var poi = new POI
            {
                Name = dto.Name,
                Slug = slug,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                TriggerRadiusMeters = dto.TriggerRadiusMeters,
                Category = dto.Category.ToLowerInvariant(),
                CategoryId = dto.CategoryId,
                Priority = dto.Priority,
                Address = dto.Address,
                Ward = dto.Ward,
                District = dto.District,
                City = dto.City,
                Phone = dto.Phone,
                Website = dto.Website,
                FacebookUrl = dto.FacebookUrl,
                ImageUrl = dto.ImageUrl,
                GoogleMapsUrl = dto.GoogleMapsUrl,
                IsActive = true,
                OwnerId = ownerId,
                ApprovalStatus = ownerId.HasValue ? "pending" : "approved",
                OperatingHours = dto.OperatingHours,
                PriceRange = dto.PriceRange,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.POIs.AddAsync(poi);
            await _context.SaveChangesAsync();

            return MapToPOIDto(poi, "en");
        }

        public async Task<POIDto?> UpdateAsync(int id, POIUpdateDto dto)
        {
            var poi = await _context.POIs
                .Include(p => p.Translations)
                .Include(p => p.MenuItems)
                .Include(p => p.QRCodes)
                .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null);

            if (poi == null) return null;

            if (dto.Name != null && !string.IsNullOrWhiteSpace(dto.Name) && poi.Name != dto.Name)
            {
                poi.Name = dto.Name;
                poi.Slug = await GenerateUniqueSlugAsync(dto.Name);
            }

            if (dto.Latitude.HasValue) poi.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) poi.Longitude = dto.Longitude.Value;
            if (dto.TriggerRadiusMeters.HasValue) poi.TriggerRadiusMeters = dto.TriggerRadiusMeters.Value;
            if (dto.Category != null) poi.Category = dto.Category.ToLowerInvariant();
            if (dto.CategoryId.HasValue) poi.CategoryId = dto.CategoryId.Value;
            if (dto.Priority.HasValue) poi.Priority = dto.Priority.Value;
            if (dto.Address != null) poi.Address = dto.Address;
            if (dto.Ward != null) poi.Ward = dto.Ward;
            if (dto.District != null) poi.District = dto.District;
            if (dto.City != null) poi.City = dto.City;
            if (dto.Phone != null) poi.Phone = dto.Phone;
            if (dto.Website != null) poi.Website = dto.Website;
            if (dto.FacebookUrl != null) poi.FacebookUrl = dto.FacebookUrl;
            if (dto.ImageUrl != null) poi.ImageUrl = dto.ImageUrl;
            if (dto.GoogleMapsUrl != null) poi.GoogleMapsUrl = dto.GoogleMapsUrl;
            if (dto.IsActive.HasValue) poi.IsActive = dto.IsActive.Value;
            if (dto.ApprovalStatus != null) poi.ApprovalStatus = dto.ApprovalStatus;
            if (dto.OperatingHours != null) poi.OperatingHours = dto.OperatingHours;
            if (dto.PriceRange != null) poi.PriceRange = dto.PriceRange;

            poi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapToPOIDto(poi, "en");
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null || poi.DeletedAt != null) return false;

            poi.DeletedAt = DateTime.UtcNow;  // Soft delete
            poi.IsActive = false;
            poi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestoreAsync(int id)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null || poi.DeletedAt == null) return false;

            poi.DeletedAt = null;
            poi.IsActive = true;
            poi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        
        public async Task<IEnumerable<POIListDto>> GetByOwnerAsync(int ownerId, string lang)
        {
            var pois = await _context.POIs
                .Include(p => p.Translations)
                .Where(p => p.OwnerId == ownerId && p.DeletedAt == null)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return pois.Select(p => MapToPOIListDto(p, lang)).ToList();
        }

        public async Task<bool> UpdateApprovalStatusAsync(int id, string status)
        {
            var poi = await _context.POIs.FindAsync(id);
            if (poi == null) return false;
            poi.ApprovalStatus = status.ToLowerInvariant();
            poi.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        #region Helpers


        private static POIListDto MapToPOIListDto(POI poi, string lang)
        {
            var translation = GetTranslation(poi, lang);
            return new POIListDto
            {
                Id = poi.Id,
                Name = translation?.Name ?? poi.Name,
                Slug = poi.Slug,
                Latitude = poi.Latitude,
                Longitude = poi.Longitude,
                Category = poi.Category,
                ImageUrl = poi.ImageUrl,
                ShortDescription = translation?.ShortDescription ?? string.Empty,
                OwnerId = poi.OwnerId,
                ApprovalStatus = poi.ApprovalStatus,
                Rating = poi.Rating,
                ReviewCount = poi.ReviewCount,
                PriceRange = poi.PriceRange,
                DistanceMeters = null // Populated in GetNearbyAsync
            };
        }

        private static POIDto MapToPOIDto(POI poi, string lang)
        {
            var translation = GetTranslation(poi, lang);
            var activeQrCode = poi.QRCodes?.FirstOrDefault(q => q.IsActive)?.Code;

            return new POIDto
            {
                Id = poi.Id,
                Name = poi.Name,
                Slug = poi.Slug,
                Latitude = poi.Latitude,
                Longitude = poi.Longitude,
                TriggerRadiusMeters = poi.TriggerRadiusMeters,
                Category = poi.Category,
                CategoryId = poi.CategoryId,
                Priority = poi.Priority,
                Address = poi.Address,
                Ward = poi.Ward,
                District = poi.District,
                City = poi.City,
                Phone = poi.Phone,
                Website = poi.Website,
                FacebookUrl = poi.FacebookUrl,
                ImageUrl = poi.ImageUrl,
                GoogleMapsUrl = poi.GoogleMapsUrl,
                IsActive = poi.IsActive,
                OwnerId = poi.OwnerId,
                ApprovalStatus = poi.ApprovalStatus,
                Rating = poi.Rating,
                ReviewCount = poi.ReviewCount,
                PriceRange = poi.PriceRange,
                LocalizedName = translation?.Name ?? poi.Name,
                ShortDescription = translation?.ShortDescription ?? string.Empty,
                FullDescription = translation?.FullDescription ?? string.Empty,
                AudioText = translation?.AudioText ?? string.Empty,
                QRCode = activeQrCode,
                MenuItemCount = poi.MenuItems?.Count ?? 0,
                OperatingHours = poi.OperatingHours,
                CreatedAt = poi.CreatedAt,
                UpdatedAt = poi.UpdatedAt,
                Images = poi.Images?.Select(i => new POIImageDto 
                { 
                    Id = i.Id, 
                    ImageUrl = i.ImageUrl, 
                    IsCover = i.IsCover 
                }).ToList() ?? new List<POIImageDto>()
            };
        }

        private static POITranslation? GetTranslation(POI poi, string lang)
        {
            if (poi.Translations == null || !poi.Translations.Any())
            {
                return null;
            }

            // Find matching language code (case-insensitive)
            var targetLang = lang.ToLowerInvariant();
            var translation = poi.Translations
                .FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == targetLang);

            // Fallback to English (en) if requested language not found
            if (translation == null && targetLang != "en")
            {
                translation = poi.Translations
                    .FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == "en");
            }

            // Ultimate fallback to first available translation if English is also missing
            if (translation == null)
            {
                translation = poi.Translations.FirstOrDefault();
            }

            return translation;
        }

        private static double ComputeHaversine(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000.0; // Bán kính Trái Đất (mét)
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private async Task<string> GenerateUniqueSlugAsync(string name)
        {
            // Convert to lowercase and replace accents
            string slug = name.ToLowerInvariant().Trim();
            
            // Remove accents using a basic mapping or regex (simple replacement for common Vietnamese characters)
            slug = ReplaceVietnameseAccents(slug);

            // Regex strip non-alphanumeric and spaces
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');

            string baseSlug = slug;
            int count = 1;

            while (await _context.POIs.AnyAsync(p => p.Slug == slug))
            {
                slug = $"{baseSlug}-{count++}";
            }

            return slug;
        }

        private static string ReplaceVietnameseAccents(string text)
        {
            string[] arr1 = new string[] { "á", "à", "ả", "ã", "ạ", "â", "ấ", "ầ", "ẩ", "ẫ", "ậ", "ă", "ắ", "ằ", "ẳ", "ẵ", "ặ",
                                            "đ",
                                            "é", "è", "ẻ", "ẽ", "ẹ", "ê", "ế", "ề", "ể", "ễ", "ệ",
                                            "í", "ì", "ỉ", "ĩ", "ị",
                                            "ó", "ò", "ỏ", "õ", "ọ", "ô", "ố", "ồ", "ổ", "ỗ", "ộ", "ơ", "ớ", "ờ", "ở", "ỡ", "ợ",
                                            "ú", "ù", "ủ", "ũ", "ụ", "ư", "ứ", "ừ", "ử", "ữ", "ự",
                                            "ý", "ỳ", "ỷ", "ỹ", "ỵ" };
            string[] arr2 = new string[] { "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a",
                                            "d",
                                            "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e",
                                            "i", "i", "i", "i", "i",
                                            "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o",
                                            "u", "u", "u", "u", "u", "u", "u", "u", "u", "u", "u",
                                            "y", "y", "y", "y", "y" };
            for (int i = 0; i < arr1.Length; i++)
            {
                text = text.Replace(arr1[i], arr2[i]);
            }
            return text;
        }

        private async Task EnsureTranslationsExistAsync(IEnumerable<POI> pois, string lang)
        {
            var targetLang = lang.ToLowerInvariant();
            foreach (var poi in pois)
            {
                if (!poi.Translations.Any(t => t.LanguageCode.ToLowerInvariant() == targetLang))
                {
                    var newTransDto = await _translationService.GetTranslationAsync(poi.Id, targetLang);
                    if (newTransDto != null)
                    {
                        var newTrans = await _context.POITranslations.FindAsync(newTransDto.Id);
                        if (newTrans != null)
                        {
                            poi.Translations.Add(newTrans);
                        }
                    }
                }
            }
        }

        #endregion
    }
}
