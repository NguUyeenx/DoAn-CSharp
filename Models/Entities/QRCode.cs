using System;

namespace DoAn_CSharp.Models.Entities
{
    public class QRCode
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string Code { get; set; } = string.Empty; // VKE-POI-001
        public string QRImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
