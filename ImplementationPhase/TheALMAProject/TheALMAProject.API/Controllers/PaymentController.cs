using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Application.DTOs.PaymentDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Helper;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc user phải đăng nhập mới được checkout
    public class PaymentController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly IVietQrService _vietQrService; // 1. Khai báo service VietQR

        // 2. Tiêm IVietQrService vào constructor
        public PaymentController(
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            IVietQrService vietQrService)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _vietQrService = vietQrService;
        }

        // Endpoint này Server VNPay sẽ gọi (Webhook)
        // LƯU Ý: KHÔNG ĐƯỢC để [Authorize] ở đây vì VNPay gọi không có Token của User
        [HttpGet("vnpay-ipn")]
        public async Task<IActionResult> VnPayIpn()
        {
            var vnpayData = Request.Query;
            var pay = new VnPayLibrary();

            // Đưa toàn bộ data VNPay gửi về vào thư viện để check chữ ký
            foreach (var (key, value) in vnpayData)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    pay.AddResponseData(key, value.ToString());
                }
            }

            var orderCode = pay.GetResponseData("vnp_TxnRef");
            var vnp_SecureHash = Request.Query["vnp_SecureHash"];

            // Xác thực chữ ký xem có đúng là VNPay gọi không (chống hacker gọi láo)
            bool checkSignature = pay.ValidateSignature(vnp_SecureHash, _configuration["VnPay:HashSecret"]);

            if (!checkSignature)
            {
                return Ok(new { RspCode = "97", Message = "Invalid signature" });
            }

            // Nếu chữ ký chuẩn, tìm đơn hàng trong DB
            var order = await _unitOfWork.OrderRepo.GetByOrderCodeAsync(orderCode); // Bạn thêm hàm này vào IOrderRepository
            if (order == null)
            {
                return Ok(new { RspCode = "01", Message = "Order not found" });
            }

            if (order.PaymentStatus == "Paid")
            {
                return Ok(new { RspCode = "02", Message = "Order already confirmed" });
            }

            var vnp_ResponseCode = pay.GetResponseData("vnp_ResponseCode");

            if (vnp_ResponseCode == "00") // 00 là mã VNPay quy định giao dịch thành công
            {
                order.PaymentStatus = "Paid";
                order.OrderStatus = "Processing"; // Đổi trạng thái sang đang chuẩn bị hàng
                                                  // Lưu luôn mã giao dịch của VNPay để sau này đối soát (nếu DB bạn có trường TransactionNo)

                await _unitOfWork.SaveChangesAsync();

                // TRẢ CHUẨN ĐỊNH DẠNG VNPAY YÊU CẦU ĐỂ NÓ KHÔNG GỌI LẠI NỮA
                return Ok(new { RspCode = "00", Message = "Confirm Success" });
            }
            else
            {
                // Thanh toán lỗi hoặc khách hủy
                order.PaymentStatus = "Failed";
                await _unitOfWork.SaveChangesAsync();
                return Ok(new { RspCode = "00", Message = "Confirm Success (Failed Transaction)" });
            }
        }

        [HttpPost("checkout-vietqr")]
        // [Authorize] // Nên mở comment cái này để bắt buộc User phải đăng nhập
        public async Task<IActionResult> CheckoutVietQr([FromBody] CheckoutRequestDto request)
        {
            try
            {
                string orderCode = "ALMA" + DateTime.Now.ToString("HHmmss");
                decimal totalAmount = 500000; // Giả sử tổng đơn là 500k
                // ----------------------------------------

                // BƯỚC 2: Chuẩn bị data truyền vào VietQrService
                var paymentModel = new PaymentInformationModel
                {
                    Amount = (double)totalAmount, // Cast về double nếu model của bạn dùng double
                    OrderDescription = orderCode  // Nội dung chuyển khoản BẮT BUỘC có mã đơn để sau này check
                };

                // BƯỚC 3: Sinh URL mã QR
                string qrCodeUrl = _vietQrService.GenerateQrImageUrl(paymentModel);

                // BƯỚC 4: Trả dữ liệu về cho Frontend hiển thị
                return Ok(new
                {
                    Success = true,
                    OrderCode = orderCode,
                    TotalAmount = totalAmount,
                    QrUrl = qrCodeUrl,
                    Message = "Tạo mã QR thanh toán thành công!"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}
