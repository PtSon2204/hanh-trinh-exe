using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheALMAProject.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTableInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    InvoiceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IssueDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    BillingName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    BillingAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BuyerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    BuyerEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    CurrencyCode = table.Column<string>(type: "nchar(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VoucherDiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    ShippingFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InvoiceStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Issued"),
                    PdfUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Invoices", x => x.InvoiceId);
                    table.CheckConstraint("CK_Invoices_Amounts", "[SubTotal] >= 0 AND [VoucherDiscountAmount] >= 0 AND [ShippingFee] >= 0 AND [TotalAmount] >= 0 AND [VoucherDiscountAmount] <= [SubTotal]");
                    table.CheckConstraint("CK_Invoices_Currency", "[CurrencyCode] IN ('VND', 'USD')");
                    table.CheckConstraint("CK_Invoices_Status", "[InvoiceStatus] IN ('Draft', 'Issued', 'Cancelled')");
                    table.CheckConstraint("CK_Invoices_TotalAmount", "[TotalAmount] = [SubTotal] - [VoucherDiscountAmount] + [ShippingFee]");
                    table.ForeignKey(
                        name: "FK__Invoices__OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "OrderId");
                });

            migrationBuilder.CreateIndex(
                name: "UQ__Invoices__InvoiceNumber",
                table: "Invoices",
                column: "InvoiceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ__Invoices__OrderId",
                table: "Invoices",
                column: "OrderId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Invoices");
        }
    }
}
