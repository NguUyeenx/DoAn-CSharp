using System;

namespace DoAn_CSharp.Models.Entities
{
    public class POIImage
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsCover { get; set; } = false;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
