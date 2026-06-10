namespace DoAn_CSharp.Models.DTOs
{
    // ── Full detail POI ───────────────────────────────────────────────
    public class POIDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; }
        public string Category { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public int Priority { get; set; }
        public int? OwnerId { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;

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
        public bool IsActive { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }

        // Localized strings (filled based on lang param)
        public string LocalizedName { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;

        public string? QRCode { get; set; }
        public int MenuItemCount { get; set; }
        public double? DistanceMeters { get; set; } // for nearby queries
        public bool IsFavorite { get; set; }        // for authenticated user

        public ICollection<POIImageDto> Images { get; set; } = new List<POIImageDto>();

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class POIImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsCover { get; set; }
    }

    // ── List item (lighter) ───────────────────────────────────────────
    public class POIListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string ShortDescription { get; set; } = string.Empty;
        public double? DistanceMeters { get; set; }
        public int? OwnerId { get; set; }
        public string ApprovalStatus { get; set; } = string.Empty;
        public bool IsFavorite { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
    }

    // ── Create / Update ───────────────────────────────────────────────
    public class POICreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; } = 30;
        public string Category { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public int Priority { get; set; } = 5;
        public string? Address { get; set; }
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string? Phone { get; set; }
        public string? Website { get; set; }
        public string? FacebookUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
    }

    public class POIUpdateDto
    {
        public string? Name { get; set; }
        public string? Slug { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? TriggerRadiusMeters { get; set; }
        public string? Category { get; set; }
        public int? CategoryId { get; set; }
        public int? Priority { get; set; }
        public string? Address { get; set; }
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string? Phone { get; set; }
        public string? Website { get; set; }
        public string? FacebookUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool? IsActive { get; set; }
        public string? ApprovalStatus { get; set; }
    }
}

