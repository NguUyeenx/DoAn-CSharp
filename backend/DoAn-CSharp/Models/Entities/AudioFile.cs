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
        public string AudioType { get; set; } = "pre-recorded"; // "pre-recorded" | "tts"
        public string? TTSProvider { get; set; } // "azure" | "google"
        public string? VoiceName { get; set; }
        public DateTime? GeneratedAt { get; set; }
        public bool IsDefault { get; set; } = false;

        // Navigation
        public ICollection<AudioProgress> AudioProgresses { get; set; } = new List<AudioProgress>();
    }
}
