using System;
using System.Collections.Generic;

namespace DoAn_CSharp.Models.Entities
{
    public class POI
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; } = 30;
        public string Category { get; set; } = string.Empty; // restaurant, cafe, temple, market, park, landmark, street_art
        public int Priority { get; set; } = 5; // 1-10
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<POITranslation> Translations { get; set; } = new List<POITranslation>();
        public ICollection<AudioFile> AudioFiles { get; set; } = new List<AudioFile>();
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
        public ICollection<QRCode> QRCodes { get; set; } = new List<QRCode>();
        public ICollection<VisitLog> VisitLogs { get; set; } = new List<VisitLog>();
    }
}
