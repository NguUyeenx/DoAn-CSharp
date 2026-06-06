using System;

namespace DoAn_CSharp.Models.Entities
{
    public class VisitLog
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public int? UserId { get; set; }       // null if guest
        public User? User { get; set; }
        public string? SessionId { get; set; }  // null if logged in user
        public string TriggerType { get; set; } = string.Empty; // geofence, qr, manual, search
        public string LanguageCode { get; set; } = string.Empty;
        public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
    }
}
