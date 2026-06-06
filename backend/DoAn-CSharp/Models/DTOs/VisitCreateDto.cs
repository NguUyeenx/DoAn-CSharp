using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class VisitCreateDto
    {
        [Required]
        public int POIId { get; set; }

        public int? UserId { get; set; }       // null if guest

        public string? SessionId { get; set; } // null if logged in

        [Required]
        [RegularExpression("^(geofence|qr|manual|search)$", ErrorMessage = "TriggerType must be 'geofence', 'qr', 'manual', or 'search'.")]
        public string TriggerType { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string LanguageCode { get; set; } = string.Empty;
    }
}
