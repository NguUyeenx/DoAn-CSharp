namespace DoAn_CSharp.Models.DTOs
{
    public class QuizQuestionDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string AnswerA { get; set; } = string.Empty;
        public string AnswerB { get; set; } = string.Empty;
        public string AnswerC { get; set; } = string.Empty;
        public string AnswerD { get; set; } = string.Empty;
    }
}
