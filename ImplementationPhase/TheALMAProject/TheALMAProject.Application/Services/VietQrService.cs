using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Web;
using TheALMAProject.Application.DTOs.PaymentDtos;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.Application.Services
{
    public class VietQrService : IVietQrService
    {
        private readonly IConfiguration _configuration;

        public VietQrService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateQrImageUrl(PaymentInformationModel model)
        {
            var bankId = _configuration["VietQR:BankId"];
            var accountNo = _configuration["VietQR:AccountNo"];
            var accountName = HttpUtility.UrlEncode(_configuration["VietQR:AccountName"]);
            var template = _configuration["VietQR:Template"];

            var amount = model.Amount.ToString("0"); // Đảm bảo không có số thập phân

            // Nội dung chuyển khoản (BẮT BUỘC PHẢI CHỨA MÃ ĐƠN HÀNG)
            var addInfo = HttpUtility.UrlEncode(model.OrderDescription);

            // Ráp thành URL hoàn chỉnh gọi đến API của VietQR.io
            string qrUrl = $"https://img.vietqr.io/image/{bankId}-{accountNo}-{template}.png?amount={amount}&addInfo={addInfo}&accountName={accountName}";

            return qrUrl;
        }
    }
}
