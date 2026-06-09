using Microsoft.AspNetCore.Mvc;

namespace TheALMAProject.API.Controllers
{
    /// <summary>
    /// Health check endpoint — dùng cho cron job keep-alive
    /// để tránh Render free tier tắt server sau 15 phút idle.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Service = "TheALMAProject API"
            });
        }
    }
}
