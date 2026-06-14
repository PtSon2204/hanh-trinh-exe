namespace TheALMAProject.API.Middleware
{
    /// <summary>
    /// Cấu hình cho IpBlacklistMiddleware.
    /// Được bind từ section "IpBlacklist" trong appsettings.json.
    /// </summary>
    public class IpBlacklistOptions
    {
        public string[] BlockedIPs { get; set; } = [];

        public AutoBlockOptions AutoBlock { get; set; } = new();
    }

    public class AutoBlockOptions
    {
        /// <summary>Số request tối đa trong 1 cửa sổ thời gian trước khi bị block.</summary>
        public int ThresholdPerWindow { get; set; } = 200;

        /// <summary>Độ dài cửa sổ thời gian (giây).</summary>
        public int WindowSeconds { get; set; } = 60;

        /// <summary>Thời gian block tạm thời (phút).</summary>
        public int BlockDurationMinutes { get; set; } = 30;
    }
}
