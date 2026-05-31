namespace DoAn_CSharp.Models.DTOs
{
    public class MenuItemDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string Name { get; set; } = string.Empty; // Original name
        public decimal Price { get; set; }
        public string Currency { get; set; } = "VND";
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public string LocalizedName { get; set; } = string.Empty;
        public string LocalizedDescription { get; set; } = string.Empty;
    }
}
