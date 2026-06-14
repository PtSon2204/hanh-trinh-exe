using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using System.Threading.RateLimiting;
using TheALMAProject.API.Middleware;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Application.Mappings;
using TheALMAProject.Application.Services;
using TheALMAProject.Application.Validator.UserValidators;

namespace TheALMAProject.API.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddCustomServices(this IServiceCollection services, IConfiguration configuration)
        {
            //Đăng kí serivce
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAdminUserService, AdminUserService>();
            services.AddScoped<IAdminBaseProductService, AdminBaseProductService>();
            services.AddScoped<IAdminStoreProductService, AdminStoreProductService>();
            services.AddScoped<IAdminIconService, AdminIconService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<ICartService, CartService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IPdfService, PdfService>();
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddScoped<IAdminInvoiceService, AdminInvoiceService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IUserDesignService, UserDesignService>();
            services.AddScoped<IAdminVoucherService, AdminVoucherService>();
            services.AddScoped<IAdminUniversityService, AdminUniversityService>();
            services.AddScoped<INotificationService, NotificationService>();
            services.AddScoped<IProfileService, ProfileService>();
            services.AddScoped<IAdminOrderService, AdminOrderService>();
            services.AddScoped<IAdminUserDesignService, AdminUserDesignService>();
            services.AddScoped<IVnPayService, VnPayService>();
            services.AddScoped<IVietQrService, VietQrService>();
            services.AddScoped<IPrintFileRenderer, PrintFileRenderer>();
            services.AddHttpContextAccessor();

            //Đăng kí fluentValidation
            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblyContaining<CreateUserDtoValidator>();

            //Đăng kí map entity -> dto
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(UserMapping).Assembly));
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(OrderMapping).Assembly));
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(ReviewMapping).Assembly));

            // Đăng ký cấu hình CORS
            services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", builder =>
                {
                    builder.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175") // Điền link Frontend của bạn vào đây
                           .AllowAnyHeader()
                           .AllowAnyMethod()
                           .AllowCredentials(); 
                });
            });

            return services;
        }

        // =====================================================
        // CẤU HÌNH CHỐNG DDOS
        // - Global Rate Limiting: 60 req/phút/IP cho toàn bộ API
        // - Concurrency Limit: tối đa 10 request đồng thời/IP
        // - IP Blacklist: block thủ công + auto-block vượt ngưỡng
        // - Kestrel Body Limit: tối đa 10MB/request
        // =====================================================
        public static IServiceCollection AddDDoSProtection(this IServiceCollection services, IConfiguration configuration)
        {
            // Bind IpBlacklistOptions từ appsettings.json
            services.Configure<IpBlacklistOptions>(configuration.GetSection("IpBlacklist"));

            // Giới hạn kích thước request body — chống large payload attack
            services.Configure<KestrelServerOptions>(options =>
            {
                options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
            });

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

                // Global Limiter: áp dụng cho TOÀN BỘ request, không cần khai báo trên từng endpoint
                // 60 request/phút/IP — chặn DDoS flood
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
                                      ?? httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim()
                                      ?? httpContext.Connection.RemoteIpAddress?.ToString()
                                      ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 60,
                            Window = TimeSpan.FromMinutes(1),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Giới hạn đăng ký: 5 lần / 15 phút / IP
                // Ngăn kẻ tấn công tạo hàng loạt tài khoản giả
                options.AddPolicy("register-limit", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 5,
                            Window = TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Giới hạn đăng nhập: 10 lần / 15 phút / IP
                // Ngăn brute-force password
                options.AddPolicy("login-limit", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Giới hạn gửi lại OTP: 3 lần / 15 phút / IP
                // Ngăn brute-force OTP qua nhiều lần gửi lại
                options.AddPolicy("otp-limit", httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 3,
                            Window = TimeSpan.FromMinutes(15),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));
            });

            return services;
        }
    }
}
