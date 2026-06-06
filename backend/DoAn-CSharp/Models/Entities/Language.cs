namespace DoAn_CSharp.Models.Entities
{
    public class Language
    {
        public string Code { get; set; } = string.Empty; // "en", "vi", "ja", "ko", "zh"
        public string Name { get; set; } = string.Empty;  // "English"
        public string NativeName { get; set; } = string.Empty; // "English", "Tiếng Việt"
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }
}
