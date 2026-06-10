using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class MenuItemUpdateDto
    {
        public string? Name { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }

        public string? Currency { get; set; }

        public string? ImageUrl { get; set; }

        public int? DisplayOrder { get; set; }
        public bool? IsAvailable { get; set; }
    }
}
