using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheALMAProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlacementGuideUrlToUserDesigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlacementGuideUrl",
                table: "UserDesigns",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlacementGuideUrl",
                table: "UserDesigns");
        }
    }
}
