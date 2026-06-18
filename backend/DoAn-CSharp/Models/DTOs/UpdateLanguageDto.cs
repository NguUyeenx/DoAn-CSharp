using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class UpdateLanguageDto
    {
        [Required]
        public int POIId { get; set; }

        [Required]
        public string SessionId { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string LanguageCode { get; set; } = string.Empty;
    }
}
