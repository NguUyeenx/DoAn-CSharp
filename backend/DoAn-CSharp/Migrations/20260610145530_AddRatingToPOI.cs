using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoAn_CSharp.Migrations
{
    /// <inheritdoc />
    public partial class AddRatingToPOI : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Rating",
                table: "POIs",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "POIs",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rating",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "POIs");
        }
    }
}
