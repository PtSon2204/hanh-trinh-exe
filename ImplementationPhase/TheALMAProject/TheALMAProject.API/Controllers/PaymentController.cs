using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Helper;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;

        public PaymentController(IUnitOfWork unitOfWork, IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
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
    }
}
