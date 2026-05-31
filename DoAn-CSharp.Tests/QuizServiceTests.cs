using Xunit;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;

namespace DoAn_CSharp.Tests
{
    public class QuizServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        private async Task SeedDatabaseAsync(AppDbContext context)
        {
            var pois = new[]
            {
                new POI { Id = 1, Name = "Ốc Oanh", Slug = "oc-oanh", Latitude = 10.7565, Longitude = 106.7015, Category = "restaurant", IsActive = true }
            };
            await context.POIs.AddRangeAsync(pois);

            var quizzes = new[]
            {
                new QuizQuestion
                {
                    Id = 1,
                    POIId = 1,
                    QuestionText = "Món ăn nào nổi tiếng nhất tại Ốc Oanh?",
                    AnswerA = "Ốc hương xào bơ tỏi",
                    AnswerB = "Cơm tấm sườn bì chả",
                    AnswerC = "Phở bò tái nạm",
                    AnswerD = "Hủ tiếu Nam Vang",
                    CorrectOption = 'A',
                    ExplanationText = "Ốc hương xào bơ tỏi là món ăn đặc trưng tạo nên thương hiệu của quán Ốc Oanh.",
                    Translations = new List<QuizQuestionTranslation>
                    {
                        new QuizQuestionTranslation
                        {
                            Id = 1,
                            QuizQuestionId = 1,
                            LanguageCode = "en",
                            QuestionText = "Which dish is most famous at Oc Oanh?",
                            AnswerA = "Garlic butter sweet snails",
                            AnswerB = "Broken rice with pork chops",
                            AnswerC = "Beef Pho",
                            AnswerD = "Nam Vang noodles",
                            ExplanationText = "Sweet snails stir-fried with garlic butter is the signature dish of Oc Oanh."
                        }
                    }
                }
            };

            await context.QuizQuestions.AddRangeAsync(quizzes);
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task GetQuizByPoiIdAsync_ShouldReturnEnglishQuizWhenRequested()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new QuizService(context);

            // Act
            var quiz = await service.GetQuizByPoiIdAsync(1, "en");

            // Assert
            Assert.NotNull(quiz);
            Assert.Equal("Which dish is most famous at Oc Oanh?", quiz.QuestionText);
            Assert.Equal("Garlic butter sweet snails", quiz.AnswerA);
        }

        [Fact]
        public async Task GetQuizByPoiIdAsync_ShouldFallbackToVietnameseWhenNoTranslationExists()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new QuizService(context);

            // Act
            var quiz = await service.GetQuizByPoiIdAsync(1, "fr"); // Requesting French, should fallback to original VI

            // Assert
            Assert.NotNull(quiz);
            Assert.Equal("Món ăn nào nổi tiếng nhất tại Ốc Oanh?", quiz.QuestionText);
            Assert.Equal("Ốc hương xào bơ tỏi", quiz.AnswerA);
        }

        [Fact]
        public async Task SubmitAnswerAsync_ShouldReturnCorrectScoreResult()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            await SeedDatabaseAsync(context);
            var service = new QuizService(context);

            var correctSubmission = new QuizSubmissionDto { QuizQuestionId = 1, SelectedOption = 'A' };
            var incorrectSubmission = new QuizSubmissionDto { QuizQuestionId = 1, SelectedOption = 'B' };

            // Act
            var correctResult = await service.SubmitAnswerAsync(correctSubmission, "en");
            var incorrectResult = await service.SubmitAnswerAsync(incorrectSubmission, "en");

            // Assert
            Assert.NotNull(correctResult);
            Assert.True(correctResult.IsCorrect);
            Assert.Equal('A', correctResult.CorrectOption);
            Assert.Equal("Sweet snails stir-fried with garlic butter is the signature dish of Oc Oanh.", correctResult.ExplanationText);

            Assert.NotNull(incorrectResult);
            Assert.False(incorrectResult.IsCorrect);
            Assert.Equal('A', incorrectResult.CorrectOption);
        }
    }
}
