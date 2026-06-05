using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class VisitCreateDto
    {
        [Required]
        public int POIId { get; set; }

        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(geofence|qr|manual)$", ErrorMessage = "TriggerType must be 'geofence', 'qr', or 'manual'.")]
        public string TriggerType { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string LanguageCode { get; set; } = string.Empty;
    }
}
