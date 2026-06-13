using System;

namespace DoAn_CSharp.Models.Entities
{
    public enum TranslationType : byte
    {
        POI = 1,
        MenuItem = 2,
        QuizQuestion = 3,
        Tour = 4,
        Category = 5,
        Notification = 6
    }

    public class AudioFile
    {
        public int Id { get; set; }
        public TranslationType TranslationType { get; set; }
        public int TranslationId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string AudioType { get; set; } = "tts"; 
        public string TTSProvider { get; set; } = "openai"; 
        public string VoiceName { get; set; } = "alloy";
        public string TranslatedTextHash { get; set; } = string.Empty;
        public DateTime? GeneratedAt { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}
