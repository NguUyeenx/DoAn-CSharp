namespace DoAn_CSharp.Models.DTOs
{
    public class LanguageDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string NativeName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCategoryDto
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; } = 0;
    }
}
