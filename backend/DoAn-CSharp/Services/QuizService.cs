using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public class QuizService : IQuizService
    {
        private readonly AppDbContext _context;

        public QuizService(AppDbContext context)
        {
            _context = context;
        }

        public QuizService()
        {
            _context = null!;
        }

        public async Task<QuizQuestionDto?> GetQuizByPoiIdAsync(int poiId, string lang)
        {
            var quiz = await _context.QuizQuestions
                .Include(q => q.Translations)
                .FirstOrDefaultAsync(q => q.POIId == poiId);

            if (quiz == null) return null;

            var questionText = quiz.QuestionText;
            var answerA = quiz.AnswerA;
            var answerB = quiz.AnswerB;
            var answerC = quiz.AnswerC;
            var answerD = quiz.AnswerD;

            // Apply translation fallback logic (fallback to Vietnamese/original if requested language translation is not found)
            if (!string.IsNullOrEmpty(lang) && lang.ToLower() != "vi" && lang.ToLower() != "vi-vn")
            {
                var translation = quiz.Translations
                    .FirstOrDefault(t => t.LanguageCode.ToLower() == lang.ToLower());

                if (translation != null)
                {
                    if (!string.IsNullOrEmpty(translation.QuestionText)) questionText = translation.QuestionText;
                    if (!string.IsNullOrEmpty(translation.AnswerA)) answerA = translation.AnswerA;
                    if (!string.IsNullOrEmpty(translation.AnswerB)) answerB = translation.AnswerB;
                    if (!string.IsNullOrEmpty(translation.AnswerC)) answerC = translation.AnswerC;
                    if (!string.IsNullOrEmpty(translation.AnswerD)) answerD = translation.AnswerD;
                }
            }

            return new QuizQuestionDto
            {
                Id = quiz.Id,
                POIId = quiz.POIId,
                QuestionText = questionText,
                AnswerA = answerA,
                AnswerB = answerB,
                AnswerC = answerC,
                AnswerD = answerD
            };
        }

        public async Task<QuizResultDto?> SubmitAnswerAsync(QuizSubmissionDto submission, string lang)
        {
            var quiz = await _context.QuizQuestions
                .Include(q => q.Translations)
                .FirstOrDefaultAsync(q => q.Id == submission.QuizQuestionId);

            if (quiz == null) return null;

            // Character casing safety (always compare in uppercase)
            var selected = char.ToUpper(submission.SelectedOption);
            var correct = char.ToUpper(quiz.CorrectOption);
            var isCorrect = selected == correct;

            var explanation = quiz.ExplanationText;

            // Apply translation fallback for explanation text
            if (!string.IsNullOrEmpty(lang) && lang.ToLower() != "vi" && lang.ToLower() != "vi-vn")
            {
                var translation = quiz.Translations
                    .FirstOrDefault(t => t.LanguageCode.ToLower() == lang.ToLower());

                if (translation != null && !string.IsNullOrEmpty(translation.ExplanationText))
                {
                    explanation = translation.ExplanationText;
                }
            }

            return new QuizResultDto
            {
                IsCorrect = isCorrect,
                CorrectOption = correct,
                ExplanationText = explanation
            };
        }
    }
}
