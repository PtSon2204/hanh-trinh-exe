using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using TheALMAProject.Application.DTOs.InvoiceDtos;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.Application.Services
{
    public class PdfService : IPdfService
    {
        public PdfService()
        {
            // Cấu hình bắt buộc của QuestPDF để dùng bản Community (miễn phí)
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GenerateInvoicePdf(InvoiceResponseDto invoiceData)
        {
            // Sử dụng QuestPDF để vẽ giao diện hoá đơn
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header().Element(ComposeHeader);

                    // Truyền data vào thân hoá đơn
                    page.Content().Element(x => ComposeContent(x, invoiceData));

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });

            // Lệnh quan trọng nhất: Chuyển toàn bộ bản vẽ thành mảng byte
            return document.GeneratePdf();
        }

        // Vẽ Header
        private void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("THE ALMA UNIFORM").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text("Email: contact@thealma.vn");
                    column.Item().Text("SĐT: 0987.654.321");
                });

                row.ConstantItem(100).Height(50).Placeholder(); // Chỗ này bạn có thể thay bằng logo công ty
            });
        }

        // Vẽ Nội dung chính
        private void ComposeContent(IContainer container, InvoiceResponseDto data)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(5);

                column.Item().Text($"Hoá đơn #: {data.InvoiceNumber}").FontSize(14).SemiBold();
                column.Item().Text($"Ngày xuất: {data.IssueDate:dd/MM/yyyy}");

                column.Item().PaddingTop(10).Text("Khách hàng:").SemiBold();
                column.Item().Text(data.BillingName);
                column.Item().Text(data.BillingAddress);
                column.Item().Text($"SĐT: {data.BuyerPhone}");

                // Kẻ bảng thông tin thanh toán
                column.Item().PaddingTop(20).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Text("Mô tả").SemiBold();
                        header.Cell().AlignRight().Text("Số tiền").SemiBold();
                    });

                    table.Cell().Text("Tiền hàng");
                    table.Cell().AlignRight().Text($"{data.SubTotal:N0} {data.CurrencyCode}");

                    table.Cell().Text("Phí vận chuyển");
                    table.Cell().AlignRight().Text($"{data.ShippingFee:N0} {data.CurrencyCode}");

                    table.Cell().Text("Giảm giá");
                    table.Cell().AlignRight().Text($"-{data.VoucherDiscountAmount:N0} {data.CurrencyCode}");

                    table.Cell().PaddingTop(10).Text("Tổng cộng").SemiBold();
                    table.Cell().PaddingTop(10).AlignRight().Text($"{data.TotalAmount:N0} {data.CurrencyCode}").SemiBold();
                });
            });
        }
    }
}
