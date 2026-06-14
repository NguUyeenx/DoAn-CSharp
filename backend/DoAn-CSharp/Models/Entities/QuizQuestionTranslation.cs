namespace DoAn_CSharp.Models.Entities
{
    public class QuizQuestionTranslation
    {
        public int Id { get; set; }
        public int QuizQuestionId { get; set; }
        public QuizQuestion? QuizQuestion { get; set; }
        public string LanguageCode { get; set; } = "en";
        
        public string QuestionText { get; set; } = string.Empty;
        public string AnswerA { get; set; } = string.Empty;
        public string AnswerB { get; set; } = string.Empty;
        public string AnswerC { get; set; } = string.Empty;
        public string AnswerD { get; set; } = string.Empty;
        public string ExplanationText { get; set; } = string.Empty;
        public string OriginalTextHash { get; set; } = string.Empty;
        public string TranslatedTextHash { get; set; } = string.Empty;
    }
}
