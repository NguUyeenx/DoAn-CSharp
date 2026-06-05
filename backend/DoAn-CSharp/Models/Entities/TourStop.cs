namespace DoAn_CSharp.Models.Entities
{
    public class TourStop
    {
        public int Id { get; set; }
        public int TourId { get; set; }
        public Tour? Tour { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public int StopOrder { get; set; }
        public string? TransitionNote { get; set; }
    }
}
