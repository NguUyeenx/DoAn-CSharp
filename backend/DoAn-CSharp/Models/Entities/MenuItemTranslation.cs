namespace DoAn_CSharp.Models.Entities
{
    public class MenuItemTranslation
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public MenuItem? MenuItem { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string OriginalTextHash { get; set; } = string.Empty;
        public string TranslatedTextHash { get; set; } = string.Empty;
    }
}
