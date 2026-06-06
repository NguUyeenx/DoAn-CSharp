namespace DoAn_CSharp.Models.Entities
{
    public class AudioProgress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int AudioFileId { get; set; }
        public AudioFile? AudioFile { get; set; }
        public double CurrentSecond { get; set; } = 0;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
