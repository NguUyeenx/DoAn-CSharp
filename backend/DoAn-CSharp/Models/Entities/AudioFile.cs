namespace DoAn_CSharp.Models.Entities
{
    public class AudioFile
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string AudioType { get; set; } = "pre-recorded";
        public bool IsDefault { get; set; } = false;
    }
}
