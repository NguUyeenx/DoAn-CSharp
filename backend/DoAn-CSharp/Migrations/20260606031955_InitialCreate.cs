using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAn_CSharp.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Languages",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NativeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Languages", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "POICategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POICategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EstimatedMinutes = table.Column<int>(type: "int", nullable: false),
                    DistanceKm = table.Column<double>(type: "float", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tours", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvatarUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DefaultLanguage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RefreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RefreshTokenExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "POIs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    TriggerRadiusMeters = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: true),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ward = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    District = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Website = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FacebookUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GoogleMapsUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POIs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_POIs_POICategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "POICategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AudioFiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DurationSeconds = table.Column<int>(type: "int", nullable: false),
                    AudioType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TTSProvider = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VoiceName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioFiles_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favorites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favorites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favorites_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favorites_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MenuItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItems_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "POITranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ShortDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FullDescription = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AudioText = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_POITranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_POITranslations_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QRCodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    QRImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ScanCount = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QRCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QRCodes_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizQuestions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerA = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerB = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerC = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerD = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CorrectOption = table.Column<string>(type: "nvarchar(1)", nullable: false),
                    ExplanationText = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizQuestions_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourStops",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TourId = table.Column<int>(type: "int", nullable: false),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    StopOrder = table.Column<int>(type: "int", nullable: false),
                    TransitionNote = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourStops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourStops_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourStops_Tours_TourId",
                        column: x => x.TourId,
                        principalTable: "Tours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VisitLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    POIId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TriggerType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VisitedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitLogs_POIs_POIId",
                        column: x => x.POIId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VisitLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AudioProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AudioFileId = table.Column<int>(type: "int", nullable: false),
                    CurrentSecond = table.Column<double>(type: "float", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioProgresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AudioProgresses_AudioFiles_AudioFileId",
                        column: x => x.AudioFileId,
                        principalTable: "AudioFiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AudioProgresses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MenuItemTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MenuItemId = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuItemTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MenuItemTranslations_MenuItems_MenuItemId",
                        column: x => x.MenuItemId,
                        principalTable: "MenuItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuizQuestionTranslations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuizQuestionId = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerA = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerB = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerC = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AnswerD = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExplanationText = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizQuestionTranslations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizQuestionTranslations_QuizQuestions_QuizQuestionId",
                        column: x => x.QuizQuestionId,
                        principalTable: "QuizQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminUsers_Username",
                table: "AdminUsers",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AudioFiles_POIId",
                table: "AudioFiles",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioProgresses_AudioFileId",
                table: "AudioProgresses",
                column: "AudioFileId");

            migrationBuilder.CreateIndex(
                name: "IX_AudioProgresses_UserId_AudioFileId",
                table: "AudioProgresses",
                columns: new[] { "UserId", "AudioFileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_POIId",
                table: "Favorites",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_Favorites_UserId_POIId",
                table: "Favorites",
                columns: new[] { "UserId", "POIId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuItems_POIId",
                table: "MenuItems",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_MenuItemTranslations_MenuItemId_LanguageCode",
                table: "MenuItemTranslations",
                columns: new[] { "MenuItemId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_POICategories_Slug",
                table: "POICategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_POIs_Category",
                table: "POIs",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_CategoryId",
                table: "POIs",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_DeletedAt",
                table: "POIs",
                column: "DeletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_IsActive",
                table: "POIs",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_Slug",
                table: "POIs",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_POITranslations_POIId_LanguageCode",
                table: "POITranslations",
                columns: new[] { "POIId", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_Code",
                table: "QRCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QRCodes_POIId",
                table: "QRCodes",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestions_POIId",
                table: "QuizQuestions",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizQuestionTranslations_QuizQuestionId",
                table: "QuizQuestionTranslations",
                column: "QuizQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_TourStops_POIId",
                table: "TourStops",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_TourStops_TourId",
                table: "TourStops",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VisitLogs_POIId",
                table: "VisitLogs",
                column: "POIId");

            migrationBuilder.CreateIndex(
                name: "IX_VisitLogs_UserId",
                table: "VisitLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminUsers");

            migrationBuilder.DropTable(
                name: "AudioProgresses");

            migrationBuilder.DropTable(
                name: "Favorites");

            migrationBuilder.DropTable(
                name: "Languages");

            migrationBuilder.DropTable(
                name: "MenuItemTranslations");

            migrationBuilder.DropTable(
                name: "POITranslations");

            migrationBuilder.DropTable(
                name: "QRCodes");

            migrationBuilder.DropTable(
                name: "QuizQuestionTranslations");

            migrationBuilder.DropTable(
                name: "TourStops");

            migrationBuilder.DropTable(
                name: "VisitLogs");

            migrationBuilder.DropTable(
                name: "AudioFiles");

            migrationBuilder.DropTable(
                name: "MenuItems");

            migrationBuilder.DropTable(
                name: "QuizQuestions");

            migrationBuilder.DropTable(
                name: "Tours");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "POIs");

            migrationBuilder.DropTable(
                name: "POICategories");
        }
    }
}
