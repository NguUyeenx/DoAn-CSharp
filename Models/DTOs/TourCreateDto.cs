using System.Collections.Generic;

namespace DoAn_CSharp.Models.DTOs
{
    public class TourCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedMinutes { get; set; }
        public double DistanceKm { get; set; }
        
        public List<TourStopCreateDto> Stops { get; set; } = new List<TourStopCreateDto>();
    }
}
