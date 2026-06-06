namespace DoAn_CSharp.Models.Entities
{
    public class POICategory
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty; // "restaurant", "cafe", "temple"
        public string Name { get; set; } = string.Empty;  // "Nhà hàng"
        public string? IconUrl { get; set; }
        public string? Color { get; set; } // hex color e.g. "#FF5733"
        public int SortOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        // Navigation
        public ICollection<POI> POIs { get; set; } = new List<POI>();
    }
}
