using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class MenuItemCreateDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        public string Currency { get; set; } = "VND";

        public string? ImageUrl { get; set; }

        public int SortOrder { get; set; } = 0;
    }
}
