using System;

namespace DoAn_CSharp.Models.DTOs
{
    public class QRCodeDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string QRImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
