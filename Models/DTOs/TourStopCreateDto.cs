namespace DoAn_CSharp.Models.DTOs
{
    public class TourStopCreateDto
    {
        public int POIId { get; set; }
        public int StopOrder { get; set; }
        public string? TransitionNote { get; set; }
    }
}
