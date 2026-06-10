namespace DoAn_CSharp.Models.DTOs
{
    public class AudioFileDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string AudioType { get; set; } = "pre-recorded";
        public string? TTSProvider { get; set; }
        public string? VoiceName { get; set; }
        public DateTime? GeneratedAt { get; set; }
        public bool IsDefault { get; set; }
    }

    public class AudioFileCreateDto
    {
        public int POIId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string AudioType { get; set; } = "pre-recorded";
        public string? TTSProvider { get; set; }
        public string? VoiceName { get; set; }
        public bool IsDefault { get; set; } = false;
    }

    public class AudioFileUpdateDto
    {
        public string? FilePath { get; set; }
        public int? DurationSeconds { get; set; }
        public string? AudioType { get; set; }
        public string? TTSProvider { get; set; }
        public string? VoiceName { get; set; }
        public bool? IsDefault { get; set; }
    }
}
