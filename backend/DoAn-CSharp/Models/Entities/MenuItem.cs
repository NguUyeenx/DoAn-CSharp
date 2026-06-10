using System.Collections.Generic;

namespace DoAn_CSharp.Models.Entities
{
    public class MenuItem
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Currency { get; set; } = "VND";
        public string? ImageUrl { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsAvailable { get; set; } = true;

        public ICollection<MenuItemTranslation> Translations { get; set; } = new List<MenuItemTranslation>();
    }
}
