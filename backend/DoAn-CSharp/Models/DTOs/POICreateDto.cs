namespace DoAn_CSharp.Models.DTOs
{
    public class POICreateDto
    {
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int TriggerRadiusMeters { get; set; } = 30;
        public string Category { get; set; } = string.Empty;
        public int Priority { get; set; } = 5;
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
    }
}
