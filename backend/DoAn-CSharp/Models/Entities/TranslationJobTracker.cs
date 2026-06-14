using System;

namespace DoAn_CSharp.Models.Entities
{
    public enum JobStatus : byte
    {
        Pending = 1,
        Processing = 2,
        Success = 3,
        Failed = 4
    }

    public class TranslationJobTracker
    {
        public int Id { get; set; }
        public TranslationType EntityType { get; set; }
        public int EntityId { get; set; }
        
        public string BatchLanguages { get; set; } = string.Empty;
        
        public JobStatus Status { get; set; }
        public int RetryCount { get; set; }
        public string? ErrorMessage { get; set; }
        
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? FinishedAt { get; set; }
        public long ProcessingTimeMs { get; set; }
    }
}
