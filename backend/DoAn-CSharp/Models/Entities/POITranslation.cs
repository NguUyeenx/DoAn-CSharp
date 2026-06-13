namespace DoAn_CSharp.Models.Entities
{
    public class POITranslation
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        public string LanguageCode { get; set; } = string.Empty; // en, ja, ko, zh
        public string Name { get; set; } = string.Empty;
        public string ShortDescription { get; set; } = string.Empty;
        public string FullDescription { get; set; } = string.Empty;
        public string AudioText { get; set; } = string.Empty;
        public string OriginalTextHash { get; set; } = string.Empty;
        public string TranslatedTextHash { get; set; } = string.Empty;
    }
}
