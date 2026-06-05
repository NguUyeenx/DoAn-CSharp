using System.Collections.Generic;

namespace DoAn_CSharp.Models.Entities
{
    public class Tour
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int EstimatedMinutes { get; set; }
        public double DistanceKm { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<TourStop> Stops { get; set; } = new List<TourStop>();
    }
}
