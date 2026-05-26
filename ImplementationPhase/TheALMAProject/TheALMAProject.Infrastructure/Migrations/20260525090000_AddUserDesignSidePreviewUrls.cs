using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheALMAProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Migration("20260525090000_AddUserDesignSidePreviewUrls")]
    public partial class AddUserDesignSidePreviewUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackPreviewImageUrl",
                table: "UserDesigns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FrontPreviewImageUrl",
                table: "UserDesigns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("UPDATE [UserDesigns] SET [FrontPreviewImageUrl] = [PreviewImageUrl] WHERE [FrontPreviewImageUrl] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackPreviewImageUrl",
                table: "UserDesigns");

            migrationBuilder.DropColumn(
                name: "FrontPreviewImageUrl",
                table: "UserDesigns");
        }
    }
}
