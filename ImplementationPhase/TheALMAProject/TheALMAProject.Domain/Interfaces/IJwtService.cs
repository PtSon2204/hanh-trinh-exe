using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    /// <summary>
    /// Interface tạo và verify JWT token.
    /// JWT (JSON Web Token) = chuỗi mã hóa chứa thông tin user (email, role).
    /// Client gửi kèm JWT trong header "Authorization: Bearer {token}" ở mọi request.
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// Tạo JWT token từ thông tin user.
        /// Token chứa Claims: UserId, Email, Role và có thời hạn (expiration).
        /// </summary>
        string GenerateToken(User user);

        /// <summary>
        /// Verify JWT token và trả về UserId nếu token hợp lệ.
        /// Trả null nếu token không hợp lệ hoặc đã hết hạn.
        /// </summary>
        int? ValidateToken(string token);
    }
}
