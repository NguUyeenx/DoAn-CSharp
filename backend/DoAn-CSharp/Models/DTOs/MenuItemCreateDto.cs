using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class MenuItemCreateDto
    {
        [Required]
        public int POIId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public string Currency { get; set; } = "VND";

        public string? ImageUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;
        public bool IsAvailable { get; set; } = true;
    }
}
