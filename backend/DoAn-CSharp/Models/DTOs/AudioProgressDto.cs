namespace DoAn_CSharp.Models.DTOs
{
    public class AudioProgressDto
    {
        public int Id { get; set; }
        public int AudioFileId { get; set; }
        public double CurrentSecond { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SaveAudioProgressDto
    {
        public int AudioFileId { get; set; }
        public double CurrentSecond { get; set; }
    }
}
