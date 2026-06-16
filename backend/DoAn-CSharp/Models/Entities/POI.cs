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
        public int? CategoryId { get; set; }
        public POICategory? POICategory { get; set; }
        public int Priority { get; set; } = 5; // 1-10

        // Address
        public string? Address { get; set; }
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }

        // Contact
        public string? Phone { get; set; }
        public string? Website { get; set; }
        public string? FacebookUrl { get; set; }

        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? DeletedAt { get; set; } // Soft Delete
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public int? OwnerId { get; set; }
        public Owner? Owner { get; set; }
        public string ApprovalStatus { get; set; } = "approved";
        public double Rating { get; set; } = 4.5;
        public int ReviewCount { get; set; } = 120; // pending, approved, rejected
        public string PriceRange { get; set; } = "1"; // "1" = Budget, "2" = Mid-range, "3" = Upscale
        public string? OperatingHours { get; set; }

        // Navigation properties
        public ICollection<POITranslation> Translations { get; set; } = new List<POITranslation>();
        public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
        public ICollection<QRCode> QRCodes { get; set; } = new List<QRCode>();
        public ICollection<VisitLog> VisitLogs { get; set; } = new List<VisitLog>();
        public ICollection<POIImage> Images { get; set; } = new List<POIImage>();
    }
}
