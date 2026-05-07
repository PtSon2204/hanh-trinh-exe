using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;
using TheALMAProject.Application.DTOs.AuthDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    /// <summary>
    /// AuthService — Bộ não xử lý toàn bộ logic xác thực người dùng.
    /// 
    /// Luồng hoạt động tổng quát:
    /// Controller nhận request → gọi AuthService → AuthService dùng Repository đọc/ghi DB
    ///                                            → dùng JwtService tạo token
    ///                                            → dùng EmailService gửi email
    ///                                            → dùng MemoryCache lưu OTP tạm thời
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;

        public AuthService(
            IUnitOfWork unitOfWork,
            IJwtService jwtService,
            IEmailService emailService,
            IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _jwtService = jwtService;
            _emailService = emailService;
            _cache = cache;
        }

       
        //Register
        public async Task<string> RegisterAsync(RegisterDto dto)
        {
            var existingUser = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (existingUser != null)
            {
                throw new Exception("Email này đã được đăng ký. Vui lòng dùng email khác.");
            }
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var newUser = new User
            {
                Email = dto.Email,
                PasswordHash = hashedPassword,
                FullName = dto.FullName,
                Phone = dto.Phone,
                Role = "Customer",
                IsActive = false,        
                CreatedAt = DateTime.Now
            };

            await _unitOfWork.UserRepo.CreateUser(newUser);
            await _unitOfWork.SaveChangesAsync();

            
            await SendOtpAsync(dto.Email);

            return "Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP xác thực.";
        }

       
        public async Task SendOtpAsync(string email)
        {
            // Tạo mã OTP ngẫu nhiên 6 chữ số
            var otp = new Random().Next(100000, 999999).ToString();

            // Lưu OTP vào MemoryCache với key = "OTP_{email}", hết hạn sau 5 phút
            // MemoryCache lưu trong RAM server → nhanh, đơn giản, phù hợp MVP
            // Lưu ý: Nếu server restart → OTP mất. Production nên dùng Redis.
            var cacheKey = $"OTP_{email}";
            _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

            // Gửi OTP qua email
            var subject = "ALMA - Mã xác thực OTP";
            var body = $@"
                <h2>Xin chào!</h2>
                <p>Mã OTP của bạn là: <strong style='font-size:24px; color:#2563eb;'>{otp}</strong></p>
                <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
                <br/>
                <p>— Đội ngũ ALMA Custom Threads</p>";

            await _emailService.SendEmailAsync(email, subject, body);
        }

       
        // Xác thực OTP → Kích hoạt tài khoản
        public async Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto)
        {
            // Bước 1: Lấy OTP từ cache
            var cacheKey = $"OTP_{dto.Email}";
            if (!_cache.TryGetValue(cacheKey, out string? cachedOtp))
            {
                throw new Exception("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.");
            }

            // Bước 2: So sánh OTP
            if (cachedOtp != dto.OtpCode)
            {
                throw new Exception("Mã OTP không chính xác.");
            }

            // Bước 3: Kích hoạt tài khoản
            var user = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (user == null)
            {
                throw new Exception("Không tìm thấy tài khoản với email này.");
            }

            user.IsActive = true;
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();

            // Bước 4: Xóa OTP khỏi cache (đã dùng xong)
            _cache.Remove(cacheKey);

            // Bước 5: Tạo JWT token và trả về
            var token = _jwtService.GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                Expiration = DateTime.UtcNow.AddMinutes(60)
            };
        }

       
        //Login (Đăng nhập Email + Password)
        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            // Bước 1: Tìm user theo email
            var user = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (user == null)
            {
                throw new Exception("Email hoặc mật khẩu không chính xác.");
            }

            // Bước 2: Kiểm tra tài khoản có bị khóa không
            if (!user.IsActive)
            {
                throw new Exception("Tài khoản chưa được kích hoạt hoặc đã bị khóa.");
            }

            // Bước 3: Verify password
            // BCrypt.Verify so sánh password plaintext với hash đã lưu trong DB
            // Nó tự extract salt từ hash → hash lại password → so sánh
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                throw new Exception("Email hoặc mật khẩu không chính xác.");
            }

            // Bước 4: Tạo JWT token
            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                Expiration = DateTime.UtcNow.AddMinutes(60)
            };
        }

        // Xác thực (Google/Facebook)
       
        // Luồng: Nhận IdToken từ frontend → Verify với Google/Facebook API → Lấy email/name
        //         → Tìm hoặc tạo user → Tạo JWT → Trả token
        public async Task<AuthResponseDto> OAuthLoginAsync(OAuthLoginDto dto)
        {
            string email;
            string fullName;
            string oauthId;

            // Bước 1: Verify IdToken với provider tương ứng
            if (dto.Provider.Equals("Google", StringComparison.OrdinalIgnoreCase))
            {
                // Google.Apis.Auth sẽ verify token với Google servers
                // Nếu token giả/hết hạn → throw exception
                var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(dto.IdToken);
                email = payload.Email;
                fullName = payload.Name ?? payload.Email;
                oauthId = payload.Subject; // Google User ID
            }
            else if (dto.Provider.Equals("Facebook", StringComparison.OrdinalIgnoreCase))
            {
                // Facebook: Gọi Graph API để verify access token
                using var httpClient = new HttpClient();
                var fbResponse = await httpClient.GetAsync(
                    $"https://graph.facebook.com/me?fields=id,name,email&access_token={dto.IdToken}");

                if (!fbResponse.IsSuccessStatusCode)
                {
                    throw new Exception("Facebook token không hợp lệ.");
                }

                var fbData = await fbResponse.Content.ReadFromJsonAsync<FacebookUserData>();
                if (fbData == null || string.IsNullOrEmpty(fbData.Email))
                {
                    throw new Exception("Không lấy được thông tin từ Facebook. Hãy đảm bảo app có quyền đọc email.");
                }

                email = fbData.Email;
                fullName = fbData.Name ?? fbData.Email;
                oauthId = fbData.Id;
            }
            else
            {
                throw new Exception($"Provider '{dto.Provider}' không được hỗ trợ. Chỉ hỗ trợ: Google, Facebook.");
            }

            // Bước 2: Tìm user theo OAuth (provider + oauthId)
            var user = await _unitOfWork.UserRepo.GetUserByOAuth(dto.Provider, oauthId);

            if (user == null)
            {
                // Bước 2b: Kiểm tra email đã đăng ký thường chưa
                user = await _unitOfWork.UserRepo.GetUserByEmail(email);

                if (user != null)
                {
                    // User đã đăng ký bằng email → liên kết thêm OAuth
                    user.OAuthProvider = dto.Provider;
                    user.OAuthId = oauthId;
                    _unitOfWork.UserRepo.UpdateUser(user);
                }
                else
                {
                    // Bước 2c: Tạo user mới hoàn toàn
                    user = new User
                    {
                        Email = email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // random password vì login bằng OAuth
                        FullName = fullName,
                        Role = "Customer",
                        IsActive = true,            // OAuth đã verify email → active luôn
                        OAuthProvider = dto.Provider,
                        OAuthId = oauthId,
                        CreatedAt = DateTime.Now
                    };
                    await _unitOfWork.UserRepo.CreateUser(user);
                }
                await _unitOfWork.SaveChangesAsync();
            }

            // Bước 3: Kiểm tra tài khoản có bị khóa không
            if (!user.IsActive)
            {
                throw new Exception("Tài khoản đã bị khóa. Vui lòng liên hệ admin.");
            }

            // Bước 4: Tạo JWT token
            var token = _jwtService.GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                Expiration = DateTime.UtcNow.AddMinutes(60)
            };
        }

        //Logout
        public async Task LogoutAsync(int userId)
        {
            var user = await _unitOfWork.UserRepo.GetById(userId);
            if (user == null)
            {
                throw new Exception("Không tìm thấy người dùng.");
            }

            // Xóa RefreshToken → ngăn không cho refresh JWT cũ
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();
        }

        //Forgot Password   
        public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (user == null)
            {
                // QUAN TRỌNG về bảo mật: KHÔNG trả lỗi "email không tồn tại"
                // → Kẻ xấu có thể exploit để kiểm tra email nào đã đăng ký
                // → Luôn trả message chung chung
                return; // Im lặng, không throw exception
            }

            // Tạo reset token (GUID dài, khó đoán)
            var resetToken = Guid.NewGuid().ToString("N"); // "N" = không có dấu gạch ngang, 32 ký tự hex

            // Lưu vào cache với thời hạn 15 phút
            var cacheKey = $"RESET_{dto.Email}";
            _cache.Set(cacheKey, resetToken, TimeSpan.FromMinutes(15));

            // Gửi email chứa link reset (frontend sẽ gọi API reset-password kèm token này)
            var resetLink = $"https://thealma.vn/reset-password?email={dto.Email}&token={resetToken}";
            var subject = "ALMA - Đặt lại mật khẩu";
            var body = $@"
                <h2>Yêu cầu đặt lại mật khẩu</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ALMA.</p>
                <p>Nhấn vào link sau để đặt mật khẩu mới:</p>
                <p><a href='{resetLink}' style='background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;'>Đặt lại mật khẩu</a></p>
                <p>Link có hiệu lực trong <strong>15 phút</strong>.</p>
                <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                <br/>
                <p>— Đội ngũ ALMA Custom Threads</p>";

            await _emailService.SendEmailAsync(dto.Email, subject, body);
        }

        //Reset Password bằng token
        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            // Bước 1: Verify reset token từ cache
            var cacheKey = $"RESET_{dto.Email}";
            if (!_cache.TryGetValue(cacheKey, out string? cachedToken))
            {
                throw new Exception("Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.");
            }

            if (cachedToken != dto.ResetToken)
            {
                throw new Exception("Token không hợp lệ.");
            }

            // Bước 2: Tìm user và cập nhật password
            var user = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (user == null)
            {
                throw new Exception("Không tìm thấy tài khoản.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();

            // Bước 3: Xóa reset token khỏi cache
            _cache.Remove(cacheKey);
        }

        //Change Password 
        public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _unitOfWork.UserRepo.GetById(userId);
            if (user == null)
            {
                throw new Exception("Không tìm thấy người dùng.");
            }

            // Bước 1: Verify mật khẩu cũ
            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            {
                throw new Exception("Mật khẩu hiện tại không chính xác.");
            }

            // Bước 2: Kiểm tra mật khẩu mới không trùng mật khẩu cũ
            if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, user.PasswordHash))
            {
                throw new Exception("Mật khẩu mới không được trùng với mật khẩu cũ.");
            }

            // Bước 3: Hash và lưu mật khẩu mới
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Model nội bộ để deserialize response từ Facebook Graph API.
    /// </summary>
    internal class FacebookUserData
    {
        public string Id { get; set; } = null!;
        public string? Name { get; set; }
        public string? Email { get; set; }
    }
}
