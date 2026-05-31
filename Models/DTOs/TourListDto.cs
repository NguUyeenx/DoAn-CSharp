namespace DoAn_CSharp.Models.DTOs
{
    public class TourListDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedMinutes { get; set; }
        public double DistanceKm { get; set; }
        public int StopCount { get; set; }
    }
}
