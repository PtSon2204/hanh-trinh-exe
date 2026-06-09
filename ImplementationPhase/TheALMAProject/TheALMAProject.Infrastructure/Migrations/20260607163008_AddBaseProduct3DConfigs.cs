using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheALMAProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBaseProduct3DConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BaseProduct3DConfigs",
                columns: table => new
                {
                    BaseProduct3DConfigId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BaseProductId = table.Column<int>(type: "int", nullable: false),
                    ModelUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CenterOffsetJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FrontPrintPlaneJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BackPrintPlaneJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__BaseProduct3DConfigs", x => x.BaseProduct3DConfigId);
                    table.ForeignKey(
                        name: "FK__BaseProduct3DConfigs__BaseProductId",
                        column: x => x.BaseProductId,
                        principalTable: "BaseProducts",
                        principalColumn: "BaseProductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UQ__BaseProduct3DConfigs__BaseProductId",
                table: "BaseProduct3DConfigs",
                column: "BaseProductId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BaseProduct3DConfigs");
        }
    }
}
