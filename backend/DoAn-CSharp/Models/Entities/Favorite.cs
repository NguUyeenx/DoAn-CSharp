namespace DoAn_CSharp.Models.Entities
{
    public class Favorite
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
