namespace DoAn_CSharp.Models.DTOs
{
    public class TourStopCreateDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("poiId")]
        public int POIId { get; set; }
        public int StopOrder { get; set; }
        public string? TransitionNote { get; set; }
    }
}
