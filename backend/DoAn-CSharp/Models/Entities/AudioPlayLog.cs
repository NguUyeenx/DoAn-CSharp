using System;

namespace DoAn_CSharp.Models.Entities
{
    public class AudioPlayLog
    {
        public long Id { get; set; }
        public TranslationType TargetType { get; set; }
        public int TargetId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string? SessionId { get; set; }
        public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    }
}
