namespace DoAn_CSharp.Models.DTOs
{
    public class QuizResultDto
    {
        public bool IsCorrect { get; set; }
        public char CorrectOption { get; set; }
        public string ExplanationText { get; set; } = string.Empty;
    }
}
