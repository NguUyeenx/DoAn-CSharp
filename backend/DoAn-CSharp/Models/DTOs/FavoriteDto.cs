namespace DoAn_CSharp.Models.DTOs
{
    public class FavoriteDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string POIName { get; set; } = string.Empty;
        public string? POIImageUrl { get; set; }
        public string POICategory { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AddFavoriteDto
    {
        public int POIId { get; set; }
    }
}
