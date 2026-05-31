namespace DoAn_CSharp.Models.DTOs
{
    public class POIDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; }
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        
        // Localized strings
        public string LocalizedName { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;
        
        public string? QRCode { get; set; }
        public int MenuItemCount { get; set; }
    }
}
