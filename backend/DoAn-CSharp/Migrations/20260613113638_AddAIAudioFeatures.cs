using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAn_CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddAIAudioFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AudioFiles_POIs_POIId",
                table: "AudioFiles");

            migrationBuilder.DropIndex(
                name: "IX_AudioFiles_POIId",
                table: "AudioFiles");

            migrationBuilder.RenameColumn(
                name: "POIId",
                table: "AudioFiles",
                newName: "TranslationId");

            migrationBuilder.AddColumn<string>(
                name: "OriginalTextHash",
                table: "QuizQuestionTranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TranslatedTextHash",
                table: "QuizQuestionTranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OriginalTextHash",
                table: "POITranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TranslatedTextHash",
                table: "POITranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OriginalTextHash",
                table: "MenuItemTranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TranslatedTextHash",
                table: "MenuItemTranslations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "VoiceName",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TTSProvider",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "LanguageCode",
                table: "AudioFiles",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "TranslatedTextHash",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte>(
                name: "TranslationType",
                table: "AudioFiles",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateTable(
                name: "AudioPlayLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TargetType = table.Column<byte>(type: "tinyint", nullable: false),
                    TargetId = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PlayedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AudioPlayLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TranslationJobTrackers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityType = table.Column<byte>(type: "tinyint", nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    BatchLanguages = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcessingTimeMs = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TranslationJobTrackers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AudioFiles_TranslationType_TranslationId_LanguageCode",
                table: "AudioFiles",
                columns: new[] { "TranslationType", "TranslationId", "LanguageCode" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AudioPlayLogs");

            migrationBuilder.DropTable(
                name: "TranslationJobTrackers");

            migrationBuilder.DropIndex(
                name: "IX_AudioFiles_TranslationType_TranslationId_LanguageCode",
                table: "AudioFiles");

            migrationBuilder.DropColumn(
                name: "OriginalTextHash",
                table: "QuizQuestionTranslations");

            migrationBuilder.DropColumn(
                name: "TranslatedTextHash",
                table: "QuizQuestionTranslations");

            migrationBuilder.DropColumn(
                name: "OriginalTextHash",
                table: "POITranslations");

            migrationBuilder.DropColumn(
                name: "TranslatedTextHash",
                table: "POITranslations");

            migrationBuilder.DropColumn(
                name: "OriginalTextHash",
                table: "MenuItemTranslations");

            migrationBuilder.DropColumn(
                name: "TranslatedTextHash",
                table: "MenuItemTranslations");

            migrationBuilder.DropColumn(
                name: "TranslatedTextHash",
                table: "AudioFiles");

            migrationBuilder.DropColumn(
                name: "TranslationType",
                table: "AudioFiles");

            migrationBuilder.RenameColumn(
                name: "TranslationId",
                table: "AudioFiles",
                newName: "POIId");

            migrationBuilder.AlterColumn<string>(
                name: "VoiceName",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "TTSProvider",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "LanguageCode",
                table: "AudioFiles",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_AudioFiles_POIId",
                table: "AudioFiles",
                column: "POIId");

            migrationBuilder.AddForeignKey(
                name: "FK_AudioFiles_POIs_POIId",
                table: "AudioFiles",
                column: "POIId",
                principalTable: "POIs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
