using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/quizzes")]
    public class QuizController : ControllerBase
    {
        private readonly IQuizService _quizService;

        public QuizController(IQuizService quizService)
        {
            _quizService = quizService;
        }

        [HttpGet("~/api/pois/{poiId:int}/quiz")]
        public async Task<IActionResult> GetQuizByPoiId(int poiId, [FromQuery] string lang = "en")
        {
            var quiz = await _quizService.GetQuizByPoiIdAsync(poiId, lang);
            if (quiz == null)
            {
                return NotFound(new { error = "NotFound", message = $"Quiz for POI {poiId} was not found." });
            }
            return Ok(quiz);
        }

        [HttpPost("~/api/quiz/submit")]
        public async Task<IActionResult> SubmitAnswer([FromBody] QuizSubmissionDto submission, [FromQuery] string lang = "en")
        {
            var result = await _quizService.SubmitAnswerAsync(submission, lang);
            if (result == null)
            {
                return NotFound(new { error = "NotFound", message = $"Quiz Question with ID {submission.QuizQuestionId} was not found." });
            }
            return Ok(result);
        }
    }
}
