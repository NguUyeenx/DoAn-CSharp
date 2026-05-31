using System.Collections.Generic;

namespace DoAn_CSharp.Models.Entities
{
    public class QuizQuestion
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public POI? POI { get; set; }
        
        public string QuestionText { get; set; } = string.Empty; // Nội dung gốc (tiếng Việt)
        public string AnswerA { get; set; } = string.Empty;
        public string AnswerB { get; set; } = string.Empty;
        public string AnswerC { get; set; } = string.Empty;
        public string AnswerD { get; set; } = string.Empty;
        public char CorrectOption { get; set; } // 'A' | 'B' | 'C' | 'D'
        public string ExplanationText { get; set; } = string.Empty;
        
        public ICollection<QuizQuestionTranslation> Translations { get; set; } = new List<QuizQuestionTranslation>();
    }
}
