using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Net;

namespace TheALMAProject.API.Middleware
{
    /// <summary>
    /// Middleware chống DDoS theo IP.
    ///   1. Block thủ công: đọc danh sách IP từ appsettings.json (IpBlacklist:BlockedIPs)
    ///   2. Auto-block: đếm request trong sliding window, vượt ngưỡng → block tạm thời
    /// </summary>
    public class IpBlacklistMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IpBlacklistMiddleware> _logger;
        private readonly HashSet<string> _manualBlacklist;
        private readonly int _threshold;
        private readonly int _windowSeconds;
        private readonly int _blockDurationMinutes;

        // Đếm request mỗi IP trong cửa sổ thời gian (thread-safe)
        private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _requestCounts = new();

        // Danh sách IP bị auto-block tạm thời — Value là thời điểm hết hạn block
        private static readonly ConcurrentDictionary<string, DateTime> _autoBlockedIps = new();

        public IpBlacklistMiddleware(
            RequestDelegate next,
            ILogger<IpBlacklistMiddleware> logger,
            IOptions<IpBlacklistOptions> options)
        {
            _next = next;
            _logger = logger;

            var config = options.Value;
            _manualBlacklist = new HashSet<string>(config.BlockedIPs, StringComparer.OrdinalIgnoreCase);
            _threshold = config.AutoBlock.ThresholdPerWindow;
            _windowSeconds = config.AutoBlock.WindowSeconds;
            _blockDurationMinutes = config.AutoBlock.BlockDurationMinutes;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var ip = GetClientIp(context);

            if (string.IsNullOrEmpty(ip))
            {
                await _next(context);
                return;
            }

            // 1. Kiểm tra manual blacklist
            if (_manualBlacklist.Contains(ip))
            {
                _logger.LogWarning("[IpBlacklist] Blocked (manual): {IP} → {Path}", ip, context.Request.Path);
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "Access denied." });
                return;
            }

            // 2. Kiểm tra auto-block tạm thời
            if (_autoBlockedIps.TryGetValue(ip, out var blockUntil))
            {
                if (DateTime.UtcNow < blockUntil)
                {
                    _logger.LogWarning("[IpBlacklist] Blocked (auto): {IP} until {Until}", ip, blockUntil);
                    context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    await context.Response.WriteAsJsonAsync(new { message = "Quá nhiều request. IP của bạn đã bị tạm khóa." });
                    return;
                }

                // Hết hạn block → xóa
                _autoBlockedIps.TryRemove(ip, out _);
            }

            // 3. Đếm request trong sliding window
            var now = DateTime.UtcNow;
            _requestCounts.AddOrUpdate(
                ip,
                addValue: (1, now),
                updateValueFactory: (_, existing) =>
                {
                    // Quá cửa sổ thời gian → reset
                    if ((now - existing.WindowStart).TotalSeconds >= _windowSeconds)
                        return (1, now);

                    return (existing.Count + 1, existing.WindowStart);
                });

            if (_requestCounts.TryGetValue(ip, out var current) && current.Count >= _threshold)
            {
                var until = DateTime.UtcNow.AddMinutes(_blockDurationMinutes);
                _autoBlockedIps[ip] = until;
                _requestCounts.TryRemove(ip, out _);

                _logger.LogWarning(
                    "[IpBlacklist] Auto-blocked: {IP} — vượt {Threshold} req/{Window}s. Block đến {Until}",
                    ip, _threshold, _windowSeconds, until);

                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.Response.WriteAsJsonAsync(new { message = "Quá nhiều request. IP của bạn đã bị tạm khóa." });
                return;
            }

            await _next(context);
        }

        /// <summary>
        /// Lấy IP thực của client — xử lý proxy/Cloudflare/load-balancer
        /// </summary>
        private static string? GetClientIp(HttpContext context)
        {
            // CF-Connecting-IP (Cloudflare — chính xác nhất nếu sau này bật)
            var cfIp = context.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(cfIp) && IPAddress.TryParse(cfIp, out _))
                return cfIp;

            // X-Forwarded-For (nginx, proxy, load balancer)
            var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwarded))
            {
                var clientIp = forwarded.Split(',')[0].Trim();
                if (IPAddress.TryParse(clientIp, out _))
                    return clientIp;
            }

            return context.Connection.RemoteIpAddress?.ToString();
        }
    }
}
