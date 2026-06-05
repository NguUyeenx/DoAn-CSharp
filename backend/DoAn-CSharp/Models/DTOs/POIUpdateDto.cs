namespace DoAn_CSharp.Models.DTOs
{
    public class POIUpdateDto
    {
        public string? Name { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? TriggerRadiusMeters { get; set; }
        public string? Category { get; set; }
        public int? Priority { get; set; }
        public string? ImageUrl { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}
