namespace DoAn_CSharp.Models.DTOs
{
    public class QuizSubmissionDto
    {
        public int QuizQuestionId { get; set; }
        public char SelectedOption { get; set; } // 'A' | 'B' | 'C' | 'D'
    }
}
