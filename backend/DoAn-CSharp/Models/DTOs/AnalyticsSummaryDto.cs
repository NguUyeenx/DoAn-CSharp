using System.Collections.Generic;

namespace DoAn_CSharp.Models.DTOs
{
    public class AnalyticsSummaryDto
    {
        public int TotalVisits { get; set; }
        public int TotalQrScans { get; set; }
        public int TotalAudioPlays { get; set; }
        public List<VisitsOverTimeDto> VisitsOverTime { get; set; } = new List<VisitsOverTimeDto>();
        public List<PopularPOIDto> PopularPOIs { get; set; } = new List<PopularPOIDto>();
        public List<LanguageStatDto> LanguageBreakdown { get; set; } = new List<LanguageStatDto>();
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

    public class LanguageStatDto
    {
        public string LanguageCode { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
