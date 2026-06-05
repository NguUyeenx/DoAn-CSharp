namespace DoAn_CSharp.Models.DTOs
{
    public class TourStopDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string POIName { get; set; } = string.Empty;
        public string POICategory { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int StopOrder { get; set; }
        public string? TransitionNote { get; set; }
        public string POIShortDescription { get; set; } = string.Empty;
    }
}
