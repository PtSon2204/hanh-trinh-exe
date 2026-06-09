using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TheALMAProject.Infrastructure.Services
{
    /// <summary>
    /// BackgroundService tự ping /api/health mỗi N phút
    /// để giữ server Render free tier luôn "thức".
    /// Chỉ hoạt động khi environment = Production.
    /// </summary>
    public class KeepAliveService : BackgroundService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<KeepAliveService> _logger;
        private readonly string _healthUrl;
        private readonly int _intervalMinutes;

        public KeepAliveService(
            IHttpClientFactory httpClientFactory,
            ILogger<KeepAliveService> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;

            // Đọc config từ appsettings.json
            _healthUrl = configuration["KeepAlive:Url"]
                ?? "https://hanh-trinh-exe.onrender.com/api/health";
            _intervalMinutes = int.TryParse(configuration["KeepAlive:IntervalMinutes"], out var interval)
                ? interval
                : 5;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "KeepAliveService started — pinging {Url} every {Interval} minutes",
                _healthUrl, _intervalMinutes);

            // Đợi 30 giây sau khi app khởi động để các service khác sẵn sàng
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient("KeepAlive");
                    var response = await client.GetAsync(_healthUrl, stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation(
                            "KeepAlive ping OK — Status: {StatusCode} at {Time}",
                            (int)response.StatusCode,
                            DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                    }
                    else
                    {
                        _logger.LogWarning(
                            "KeepAlive ping FAILED — Status: {StatusCode} at {Time}",
                            (int)response.StatusCode,
                            DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "KeepAlive ping ERROR at {Time}",
                        DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
                }

                // Chờ N phút rồi ping lại
                await Task.Delay(TimeSpan.FromMinutes(_intervalMinutes), stoppingToken);
            }

            _logger.LogInformation("KeepAliveService stopped");
        }
    }
}
