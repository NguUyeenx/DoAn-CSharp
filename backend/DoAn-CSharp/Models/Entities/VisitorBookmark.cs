using System;

namespace DoAn_CSharp.Models.Entities
{
    public class VisitorBookmark
    {
        public int Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
