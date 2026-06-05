namespace DoAn_CSharp.Models.DTOs
{
    public class TranslationDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;
    }
}
