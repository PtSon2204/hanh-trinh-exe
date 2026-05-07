using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Phone { get; set; }

    public string? AvatarUrl { get; set; }

    public string Role { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    // OAuth fields - dùng khi đăng nhập bằng Google/Facebook
    public string? OAuthProvider { get; set; }  // "Google", "Facebook", hoặc null (đăng ký thường)
    public string? OAuthId { get; set; }         // ID duy nhất từ Google/Facebook

    // Refresh Token fields
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public virtual ICollection<Address> Addresses { get; set; } = new List<Address>();

    public virtual Cart? Cart { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<UserDesign> UserDesigns { get; set; } = new List<UserDesign>();
}
