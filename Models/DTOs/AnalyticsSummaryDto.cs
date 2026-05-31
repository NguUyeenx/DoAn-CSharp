using System.Collections.Generic;

namespace DoAn_CSharp.Models.DTOs
{
    public class AnalyticsSummaryDto
    {
        public int TotalVisits { get; set; }
        public List<VisitsOverTimeDto> VisitsOverTime { get; set; } = new List<VisitsOverTimeDto>();
        public List<PopularPOIDto> PopularPOIs { get; set; } = new List<PopularPOIDto>();
    }

    public class VisitsOverTimeDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class PopularPOIDto
    {
        public int POIId { get; set; }
        public string POIName { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
