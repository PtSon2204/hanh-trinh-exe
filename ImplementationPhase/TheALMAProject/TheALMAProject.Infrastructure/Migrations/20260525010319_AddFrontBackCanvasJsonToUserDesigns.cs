using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheALMAProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFrontBackCanvasJsonToUserDesigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackCanvasJson",
                table: "UserDesigns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FrontCanvasJson",
                table: "UserDesigns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("UPDATE [UserDesigns] SET [FrontCanvasJson] = [CanvasJson] WHERE [FrontCanvasJson] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackCanvasJson",
                table: "UserDesigns");

            migrationBuilder.DropColumn(
                name: "FrontCanvasJson",
                table: "UserDesigns");
        }
    }
}
