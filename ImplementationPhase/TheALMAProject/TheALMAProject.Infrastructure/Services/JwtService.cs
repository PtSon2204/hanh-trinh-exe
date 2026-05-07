using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Services
{
    /// <summary>
    /// JwtService — Tạo và verify JWT (JSON Web Token).
    /// 
    /// JWT gồm 3 phần (ngăn cách bởi dấu chấm):
    ///   Header.Payload.Signature
    ///   
    /// Header:  Thuật toán mã hóa (HS256)
    /// Payload: Dữ liệu user (Claims): UserId, Email, Role, Expiration
    /// Signature: Chữ ký số = HMAC-SHA256(Header + Payload, SecretKey)
    /// 
    /// Ví dụ token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkw...
    /// 
    /// Client gửi token trong header: Authorization: Bearer eyJhbGci...
    /// Server verify bằng SecretKey → nếu chữ ký khớp → token hợp lệ → lấy được UserId/Role
    /// </summary>
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Tạo JWT token chứa thông tin user.
        /// </summary>
        public string GenerateToken(User user)
        {
            // Bước 1: Lấy cấu hình từ appsettings.json
            var secretKey = _configuration["JwtSettings:SecretKey"]
                ?? throw new InvalidOperationException("JwtSettings:SecretKey chưa được cấu hình trong appsettings.json");
            var issuer = _configuration["JwtSettings:Issuer"] ?? "TheALMAProject";
            var audience = _configuration["JwtSettings:Audience"] ?? "TheALMAProject";
            var expirationMinutes = int.Parse(_configuration["JwtSettings:ExpirationMinutes"] ?? "60");

            // Bước 2: Tạo key từ SecretKey (phải >= 32 ký tự cho HS256)
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            // Bước 3: Tạo Claims — thông tin được "gắn" vào token
            // Claims giống như "thẻ căn cước" số hóa của user
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()), // UserId → dùng để biết "ai đang request"
                new Claim(ClaimTypes.Email, user.Email),                       // Email
                new Claim(ClaimTypes.Role, user.Role),                         // Role → dùng cho Authorization (phân quyền)
                new Claim(ClaimTypes.Name, user.FullName),                     // FullName
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // JWT ID — mỗi token có ID duy nhất
            };

            // Bước 4: Tạo token descriptor (mô tả token)
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expirationMinutes),  // Thời hạn token
                Issuer = issuer,                                            // Ai phát hành token
                Audience = audience,                                        // Token dành cho ai
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature) // Thuật toán ký
            };

            // Bước 5: Tạo và serialize token thành chuỗi
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token); // → "eyJhbGci..."
        }

        /// <summary>
        /// Verify JWT token và trả về UserId.
        /// </summary>
        public int? ValidateToken(string token)
        {
            try
            {
                var secretKey = _configuration["JwtSettings:SecretKey"]!;
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,  // Kiểm tra token hết hạn chưa
                    ClockSkew = TimeSpan.Zero  // Không cho phép sai lệch thời gian
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);

                return userIdClaim != null ? int.Parse(userIdClaim.Value) : null;
            }
            catch
            {
                return null; // Token không hợp lệ hoặc hết hạn
            }
        }
    }
}
