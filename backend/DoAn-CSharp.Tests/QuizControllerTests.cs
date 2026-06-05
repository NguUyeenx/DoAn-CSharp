using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Controllers;
using DoAn_CSharp.Services;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.Entities;
using DoAn_CSharp.Models.DTOs;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using System;

namespace DoAn_CSharp.Tests
{
    public class QuizControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task GetQuizByPoiId_ReturnsOk_WhenExists()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var poi = new POI { Id = 1, Name = "Ốc Đào", Slug = "oc-dao", Category = "restaurant", IsActive = true };
            var quiz = new QuizQuestion
            {
                Id = 1,
                POIId = 1,
                QuestionText = "Câu hỏi 1?",
                AnswerA = "A",
                AnswerB = "B",
                AnswerC = "C",
                AnswerD = "D",
                CorrectOption = 'A',
                ExplanationText = "Lý do"
            };
            await context.POIs.AddAsync(poi);
            await context.QuizQuestions.AddAsync(quiz);
            await context.SaveChangesAsync();

            var service = new QuizService(context);
            var controller = new QuizController(service);

            // Act
            var result = await controller.GetQuizByPoiId(1, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<QuizQuestionDto>(okResult.Value);
            Assert.Equal("Câu hỏi 1?", dto.QuestionText);
        }

        [Fact]
        public async Task SubmitAnswer_ReturnsOkWithScoring()
        {
            // Arrange
            var context = GetInMemoryDbContext();
            var quiz = new QuizQuestion
            {
                Id = 1,
                POIId = 1,
                QuestionText = "Câu hỏi 1?",
                AnswerA = "A",
                AnswerB = "B",
                AnswerC = "C",
                AnswerD = "D",
                CorrectOption = 'A',
                ExplanationText = "Lý do"
            };
            await context.QuizQuestions.AddAsync(quiz);
            await context.SaveChangesAsync();

            var service = new QuizService(context);
            var controller = new QuizController(service);
            var submission = new QuizSubmissionDto { QuizQuestionId = 1, SelectedOption = 'A' };

            // Act
            var result = await controller.SubmitAnswer(submission, "en");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var dto = Assert.IsType<QuizResultDto>(okResult.Value);
            Assert.True(dto.IsCorrect);
            Assert.Equal("Lý do", dto.ExplanationText);
        }
    }
}
