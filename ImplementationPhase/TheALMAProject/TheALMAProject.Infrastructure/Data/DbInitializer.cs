using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Models;
using TheALMAProject.Infrastructure.Models;


namespace TheALMAProject.Infrastructure.Data
{
    public static class DbInitializer
    {
        private const string LegacyShirt3DModelUrl = "/models/base-products/shirt_hangar_operational.glb";

        private const string PreviousTShirt3DModelUrl = "/models/base-products/tshirt_operational.glb";

        private const string DefaultTShirt3DModelUrl = "/models/base-products/tshirt_operational_v1.1.glb";

        private const string DefaultPolo3DModelUrl = "/models/base-products/polo_operation_v1.1.glb";

        private const string DefaultShirt3DCenterOffsetJson = "[-9.443575220313505,620.7378559796042,30.46297532832287]";

        private const string DefaultShirt3DFrontPrintPlaneJson = """
        {
          "position": [0, -620, 119],
          "rotation": [0, 0, 0],
          "size": [1150, 1438],
          "renderMode": "sampledDepth",
          "segments": [24, 32],
          "projectionDirection": [0, 0, -1],
          "maxProjectionDistance": 320,
          "surfaceOffset": 1.8,
          "projectionStrength": 0.68,
          "fallbackBend": 0.08,
          "smoothIterations": 1
        }
        """;

        private const string DefaultShirt3DBackPrintPlaneJson = """
        {
          "position": [0, -620, -179],
          "rotation": [0, 3.141592653589793, 0],
          "size": [1150, 1438],
          "renderMode": "sampledDepth",
          "segments": [24, 32],
          "projectionDirection": [0, 0, 1],
          "maxProjectionDistance": 320,
          "surfaceOffset": 1.2,
          "projectionStrength": 0.68,
          "fallbackBend": 0.08,
          "smoothIterations": 1
        }
        """;

        private const string DefaultTShirt3DFrontPrintPlaneJson = """
        {
          "position": [0, -620, 119],
          "rotation": [0, 0, 0],
          "size": [1150, 1438],
          "renderMode": "sampledDepth",
          "segments": [24, 32],
          "projectionDirection": [0, 0, -1],
          "maxProjectionDistance": 320,
          "surfaceOffset": 1.8,
          "projectionStrength": 0.68,
          "fallbackBend": 0.08,
          "smoothIterations": 1,
          "authoredTextureOffset": [0.28, 0.11],
          "authoredTextureRepeat": [1.3, 1.1]
        }
        """;

        private const string DefaultTShirt3DBackPrintPlaneJson = """
        {
          "position": [0, -620, -179],
          "rotation": [0, 3.141592653589793, 0],
          "size": [1150, 1438],
          "renderMode": "sampledDepth",
          "segments": [24, 32],
          "projectionDirection": [0, 0, 1],
          "maxProjectionDistance": 320,
          "surfaceOffset": 1.2,
          "projectionStrength": 0.68,
          "fallbackBend": 0.08,
          "smoothIterations": 1,
          "authoredTextureOffset": [-0.32, 0.1],
          "authoredTextureRepeat": [1.3, 1.1]
        }
        """;

        private const string DefaultPolo3DFrontPrintPlaneJson = """
        {
          "position": [0, -700, 255],
          "rotation": [0, 0, 0],
          "size": [640, 860],
          "renderMode": "sampledDepth",
          "segments": [36, 48],
          "projectionDirection": [0, 0, -1],
          "maxProjectionDistance": 760,
          "surfaceOffset": 1.4,
          "projectionStrength": 0.82,
          "fallbackBend": 0.035,
          "smoothIterations": 2
        }
        """;

        private const string DefaultPolo3DBackPrintPlaneJson = """
        {
          "position": [0, -700, -285],
          "rotation": [0, 3.141592653589793, 0],
          "size": [680, 900],
          "renderMode": "sampledDepth",
          "segments": [36, 48],
          "projectionDirection": [0, 0, 1],
          "maxProjectionDistance": 760,
          "surfaceOffset": 1.4,
          "projectionStrength": 0.82,
          "fallbackBend": 0.035,
          "smoothIterations": 2
        }
        """;

        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            await context.Database.MigrateAsync();

            string defaultPassword = "@123456";
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

            if (!await context.Users.AnyAsync())
            {
                var users = new List<User>
                {
                    new User { Email = "admin@thealma.vn", PasswordHash = hashedPassword, FullName = "System Admin", Phone = "0988000001", Role = "Admin", IsActive = true, CreatedAt = DateTime.Now },
                    new User { Email = "product@thealma.vn", PasswordHash = hashedPassword, FullName = "Product Manager", Phone = "0988000002", Role = "Product Manager", IsActive = true, CreatedAt = DateTime.Now },
                    new User { Email = "order@thealma.vn", PasswordHash = hashedPassword, FullName = "Order Manager", Phone = "0988000003", Role = "OrderMgr", IsActive = true, CreatedAt = DateTime.Now },

                    new User { Email = "son.pt@gmail.com", PasswordHash = hashedPassword, FullName = "Phạm Thế Sơn", Phone = "0988111222", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now },
                    new User { Email = "nguyenvana@gmail.com", PasswordHash = hashedPassword, FullName = "Nguyễn Văn A", Phone = "0988333444", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now },
                    new User { Email = "tranthib@gmail.com", PasswordHash = hashedPassword, FullName = "Trần Thị B", Phone = "0988555666", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now }
                };

                await context.Users.AddRangeAsync(users);
            }

            var seededProductManager = await context.Users.FirstOrDefaultAsync(x => x.Email == "product@thealma.vn");
            if (seededProductManager != null && seededProductManager.Role == "ProdMgr")
            {
                seededProductManager.Role = "Product Manager";
            }

            if (!await context.Universities.AnyAsync())
            {
                var universities = new List<University>
                {
                    new University { Name = "FPT University", LogoUrl = "/images/logos/fpt-logo.png", IsActive = true },
                    new University { Name = "Đại học Quốc gia Hà Nội (VNU)", LogoUrl = "/images/logos/vnu-logo.png", IsActive = true },
                    new University { Name = "Học viện Tài chính (AOF)", LogoUrl = "/images/logos/aof-logo.png", IsActive = true },
                    new University { Name = "Đại học Luật Hà Nội (HLU)", LogoUrl = "/images/logos/hlu-logo.png", IsActive = true },
                    new University { Name = "Đại học Kinh tế Quốc dân (NEU)", LogoUrl = "/images/logos/neu-logo.png", IsActive = true },
                    new University { Name = "Đại học Ngoại thương (FTU)", LogoUrl = "/images/logos/ftu-logo.png", IsActive = true },
                    new University { Name = "Đại học Bách khoa Hà Nội (HUST)", LogoUrl = "/images/logos/hust-logo.png", IsActive = true },
                    new University { Name = "Đại học Thương mại (TMU)", LogoUrl = "/images/logos/tmu-logo.png", IsActive = true }
                };

                await context.Universities.AddRangeAsync(universities);
            }

            await context.SaveChangesAsync();

            await EnsureBaseProduct3DConfigAsync(
                context,
                "TShirt",
                DefaultTShirt3DModelUrl,
                DefaultTShirt3DFrontPrintPlaneJson,
                DefaultTShirt3DBackPrintPlaneJson,
                migrateLegacyModelUrl: LegacyShirt3DModelUrl,
                migrateAdditionalModelUrl: PreviousTShirt3DModelUrl);
            await EnsureBaseProduct3DConfigAsync(
                context,
                "Polo",
                DefaultPolo3DModelUrl,
                frontPrintPlaneJson: DefaultPolo3DFrontPrintPlaneJson,
                backPrintPlaneJson: DefaultPolo3DBackPrintPlaneJson);
        }

        private static async Task EnsureBaseProduct3DConfigAsync(
            ApplicationDbContext context,
            string category,
            string modelUrl,
            string? frontPrintPlaneJson = null,
            string? backPrintPlaneJson = null,
            string? migrateLegacyModelUrl = null,
            string? migrateAdditionalModelUrl = null)
        {
            var baseProduct = await context.BaseProducts
                .Include(x => x.ThreeDConfig)
                .FirstOrDefaultAsync(x => x.Category == category);

            if (baseProduct == null)
            {
                return;
            }

            if (baseProduct.ThreeDConfig == null)
            {
                await context.BaseProduct3DConfigs.AddAsync(new BaseProduct3DConfig
                {
                    BaseProductId = baseProduct.BaseProductId,
                    ModelUrl = modelUrl,
                    CenterOffsetJson = DefaultShirt3DCenterOffsetJson,
                    FrontPrintPlaneJson = frontPrintPlaneJson ?? DefaultShirt3DFrontPrintPlaneJson,
                    BackPrintPlaneJson = backPrintPlaneJson ?? DefaultShirt3DBackPrintPlaneJson
                });

                await context.SaveChangesAsync();
                return;
            }

            if ((!string.IsNullOrWhiteSpace(migrateLegacyModelUrl) && baseProduct.ThreeDConfig.ModelUrl == migrateLegacyModelUrl) ||
                (!string.IsNullOrWhiteSpace(migrateAdditionalModelUrl) && baseProduct.ThreeDConfig.ModelUrl == migrateAdditionalModelUrl))
            {
                baseProduct.ThreeDConfig.ModelUrl = modelUrl;
                await context.SaveChangesAsync();
            }

            if (!string.IsNullOrWhiteSpace(frontPrintPlaneJson) || !string.IsNullOrWhiteSpace(backPrintPlaneJson))
            {
                baseProduct.ThreeDConfig.ModelUrl = modelUrl;
                baseProduct.ThreeDConfig.CenterOffsetJson = DefaultShirt3DCenterOffsetJson;
                baseProduct.ThreeDConfig.FrontPrintPlaneJson = frontPrintPlaneJson ?? DefaultShirt3DFrontPrintPlaneJson;
                baseProduct.ThreeDConfig.BackPrintPlaneJson = backPrintPlaneJson ?? DefaultShirt3DBackPrintPlaneJson;
                await context.SaveChangesAsync();
            }
        }
    }
}
