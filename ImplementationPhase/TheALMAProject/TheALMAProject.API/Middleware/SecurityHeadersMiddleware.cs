namespace TheALMAProject.API.Middleware
{
    /// <summary>
    /// Middleware thêm HTTP Security Headers vào mỗi response.
    /// Bảo vệ chống: Clickjacking, XSS, MIME sniffing, server info disclosure.
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Chống Clickjacking — không cho nhúng site vào iframe
            context.Response.Headers["X-Frame-Options"] = "DENY";

            // Chống MIME sniffing — trình duyệt không được đoán Content-Type
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";

            // Chống XSS (legacy browsers)
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";

            // Kiểm soát Referrer khi navigate ra ngoài
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // Tắt các browser feature không cần thiết
            context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

            // Ẩn thông tin server — không để lộ ASP.NET, Kestrel version
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");

            await _next(context);
        }
    }
}
