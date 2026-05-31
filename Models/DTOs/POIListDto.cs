namespace DoAn_CSharp.Models.DTOs
{
    public class POIListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Category { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public double? Distance { get; set; } // Distance in meters from request coordinate
    }
}
