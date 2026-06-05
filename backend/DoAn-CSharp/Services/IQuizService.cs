using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IQuizService
    {
        Task<QuizQuestionDto?> GetQuizByPoiIdAsync(int poiId, string lang);
        Task<QuizResultDto?> SubmitAnswerAsync(QuizSubmissionDto submission, string lang);
    }
}
