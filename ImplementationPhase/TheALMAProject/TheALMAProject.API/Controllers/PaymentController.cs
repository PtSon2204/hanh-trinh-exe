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
        private readonly IVietQrService _vietQrService;
        private readonly IEmailService _emailService;

        public PaymentController(
            IUnitOfWork unitOfWork,
            IConfiguration configuration,
            IVietQrService vietQrService,
            IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _vietQrService = vietQrService;
            _emailService = emailService;
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

        // Endpoint SePay Webhook nhận kết quả chuyển tiền thành công qua ngân hàng
        [AllowAnonymous]
        [HttpPost("sepay-webhook")]
        public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookModel model)
        {
            try
            {
                // 1. Kiểm tra API Key (nếu cấu hình) để bảo mật webhook
                var apiKey = _configuration["SePay:ApiKey"];
                if (!string.IsNullOrEmpty(apiKey))
                {
                    var authHeader = Request.Headers["Authorization"].ToString();
                    
                    // In log debug ra Terminal để chẩn đoán
                    Console.WriteLine($"[SePay Auth Debug] Header nhan duoc: '{authHeader}'");
                    Console.WriteLine($"[SePay Auth Debug] ApiKey cau hinh: '{apiKey}'");

                    bool isValidAuth = !string.IsNullOrEmpty(authHeader) && 
                                       authHeader.Contains(apiKey, StringComparison.OrdinalIgnoreCase);
                         
                    if (!isValidAuth)
                    {
                        Console.WriteLine("[SePay Auth Debug] Xac thuc that bai! Tra ve 401 Unauthorized.");
                        return Unauthorized(new { message = "Không có quyền truy cập SePay Webhook." });
                    }
                    Console.WriteLine("[SePay Auth Debug] Xac thuc thanh cong!");
                }

                // 2. Chỉ xử lý giao dịch nhận tiền chuyển khoản vào
                if (string.IsNullOrEmpty(model.TransferType) || !model.TransferType.Equals("in", StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(new { success = false, message = "Không phải giao dịch nhận tiền." });
                }

                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { success = false, message = "Không tìm thấy nội dung chuyển khoản trong giao dịch." });
                }

                // Tự động trả về 200 OK đối với các request Ping/Test mặc định từ SePay Dashboard
                if (model.Content.Contains("sepay", StringComparison.OrdinalIgnoreCase) || 
                    model.Content.Contains("test", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("[SePay Webhook Debug] Nhan tin hieu Ping/Test mac dinh tu SePay Dashboard. Tra ve HTTP 200 OK thanh cong.");
                    return Ok(new { success = true, message = "Kết nối Webhook SePay thành công!" });
                }

                // 3. Tìm mã đơn hàng từ trường code hoặc từ nội dung chuyển khoản
                string? matchedCode = null;
                if (!string.IsNullOrEmpty(model.Code) && model.Code.StartsWith("ALMA", StringComparison.OrdinalIgnoreCase))
                {
                    matchedCode = model.Code;
                }
                else
                {
                    var matchWithHyphen = System.Text.RegularExpressions.Regex.Match(model.Content, @"ALMA-\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                    if (matchWithHyphen.Success)
                    {
                        matchedCode = matchWithHyphen.Value;
                    }
                    else
                    {
                        var matchNoHyphen = System.Text.RegularExpressions.Regex.Match(model.Content, @"ALMA\d+", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (matchNoHyphen.Success)
                        {
                            matchedCode = matchNoHyphen.Value.Replace("ALMA", "ALMA-", StringComparison.OrdinalIgnoreCase);
                        }
                    }
                }

                if (string.IsNullOrEmpty(matchedCode))
                {
                    return BadRequest(new { success = false, message = "Không phân tích được mã đơn hàng từ giao dịch." });
                }

                // 4. Tìm đơn hàng tương ứng trong hệ thống
                var order = await _unitOfWork.OrderRepo.GetByOrderCodeAsync(matchedCode);
                if (order == null)
                {
                    return NotFound(new { success = false, message = $"Không tìm thấy đơn hàng {matchedCode}." });
                }

                // 5. Nếu đơn hàng chưa được thanh toán, tiến hành cập nhật trạng thái
                if (order.PaymentStatus == "Unpaid" || order.PaymentStatus == "Pending")
                {
                    order.PaymentStatus = "Paid";
                    order.OrderStatus = "Processing"; // Chuyển trạng thái sang Đang xử lý
                    await _unitOfWork.SaveChangesAsync();

                    // Gửi email thông báo xác nhận đơn hàng thành công tự động
                    try
                    {
                        var user = await _unitOfWork.UserRepo.GetById(order.UserId);
                        if (user != null)
                        {
                            await _emailService.SendOrderConfirmationAsync(user.Email, user.FullName, order.OrderCode, order.TotalAmount);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Email Error]: Lỗi gửi email tự động xác nhận đơn hàng: {ex.Message}");
                    }

                    return Ok(new { success = true, message = $"Xác nhận thanh toán thành công cho đơn hàng {matchedCode}." });
                }

                return Ok(new { success = true, message = $"Đơn hàng {matchedCode} đã thanh toán trước đó." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, Message = ex.Message });
            }
        }
    }

    public class SePayWebhookModel
    {
        public long? Id { get; set; }
        public string? Gateway { get; set; }
        public string? TransactionDate { get; set; }
        public string? AccountNumber { get; set; }
        public string? Code { get; set; }
        public string? Content { get; set; }
        public string? TransferType { get; set; }
        public decimal? TransferAmount { get; set; }
        public string? ReferenceCode { get; set; }
    }
}
