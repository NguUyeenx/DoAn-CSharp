using System;

namespace DoAn_CSharp.Models.Entities
{
    public class AnalyticsEvent
    {
        public int Id { get; set; }
        public string AnonymousId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string EventData { get; set; } = string.Empty; // JSON
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
