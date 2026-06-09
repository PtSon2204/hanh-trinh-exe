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
            //await context.Database.MigrateAsync();

            string defaultPassword = "";
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

            if (!await context.BaseProducts.AnyAsync())
            {
                var baseProducts = new List<BaseProduct>
                {
                    new BaseProduct
                    {
                        Name = "Áo thun cổ tròn Oversize định lượng 250gsm",
                        BasePrice = 120000.00m,
                        FrontImageUrl = "/images/blanks/tshirt-oversize-front.png",
                        BackImageUrl = "/images/blanks/tshirt-oversize-back.png",
                        PrintAreaJson = "{\"front\":{\"x\":150,\"y\":200,\"width\":300,\"height\":400},\"back\":{\"x\":150,\"y\":150,\"width\":300,\"height\":450}}",
                        Category = "TShirt",
                        Material = "100% Premium Cotton",
                        AvailableColors = "#FFFFFF,#000000,#F5F5DC,#000080",
                        AvailableSizes = "S,M,L,XL,XXL",
                        IsActive = true
                    },
                    new BaseProduct
                    {
                        Name = "Áo Polo dáng suông viền cổ",
                        BasePrice = 150000.00m,
                        FrontImageUrl = "/images/blanks/polo-front.png",
                        BackImageUrl = "/images/blanks/polo-back.png",
                        PrintAreaJson = "{\"front\":{\"x\":200,\"y\":250,\"width\":200,\"height\":300},\"back\":{\"x\":150,\"y\":180,\"width\":300,\"height\":400}}",
                        Category = "Polo",
                        Material = "CVC Pique 65/35",
                        AvailableColors = "#FFFFFF,#000000,#800000",
                        AvailableSizes = "M,L,XL,XXL",
                        IsActive = true
                    }
                };

                await context.BaseProducts.AddRangeAsync(baseProducts);
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

            if (!await context.StoreProducts.AnyAsync())
            {
                var fptUniversityId = await context.Universities
                    .Where(x => x.Name == "FPT University")
                    .Select(x => x.UniversityId)
                    .FirstAsync();

                var vnuUniversityId = await context.Universities
                    .Where(x => x.Name == "Đại học Quốc gia Hà Nội (VNU)")
                    .Select(x => x.UniversityId)
                    .FirstAsync();

                var tshirtBaseProductId = await context.BaseProducts
                    .Where(x => x.Name == "Áo thun cổ tròn Oversize định lượng 250gsm")
                    .Select(x => x.BaseProductId)
                    .FirstAsync();

                var poloBaseProductId = await context.BaseProducts
                    .Where(x => x.Name == "Áo Polo dáng suông viền cổ")
                    .Select(x => x.BaseProductId)
                    .FirstAsync();

                var storeProducts = new List<StoreProduct>
                {
                    new StoreProduct
                    {
                        BaseProductId = tshirtBaseProductId,
                        UniversityId = fptUniversityId,
                        Name = "FPT Orange Oversize Tee",
                        Description = "Áo thun oversize nhận diện FPT dành cho sinh viên, phù hợp mặc hằng ngày.",
                        Price = 149000.00m,
                        ImageUrl = "/images/store-products/fpt-oversize-tee.png",
                        IsCustomizable = true,
                        IsActive = true
                    },
                    new StoreProduct
                    {
                        BaseProductId = poloBaseProductId,
                        UniversityId = fptUniversityId,
                        Name = "FPT Premium Polo",
                        Description = "Áo polo viền cổ phong cách tối giản, dùng cho sự kiện và ngày đến trường.",
                        Price = 189000.00m,
                        ImageUrl = "/images/store-products/fpt-premium-polo.png",
                        IsCustomizable = false,
                        IsActive = true
                    }
                };

                await context.StoreProducts.AddRangeAsync(storeProducts);
                await context.SaveChangesAsync();
            }

            if (!await context.Icons.AnyAsync())
            {
                var icons = new List<Icon>
                {
                    new Icon
                    {
                        Name = "Premium Print Badge",
                        ImageUrl = "/images/icons/premium-print-badge.png",
                        PriceAddon = 15000.00m,
                        Category = "PrintEffect",
                        IsActive = true
                    },
                    new Icon
                    {
                        Name = "Student Favorite Star",
                        ImageUrl = "/images/icons/student-favorite-star.png",
                        PriceAddon = 0.00m,
                        Category = "Sticker",
                        IsActive = true
                    },
                    new Icon
                    {
                        Name = "Limited Edition Crown",
                        ImageUrl = "/images/icons/limited-edition-crown.png",
                        PriceAddon = 25000.00m,
                        Category = "Badge",
                        IsActive = false
                    }
                };

                await context.Icons.AddRangeAsync(icons);
                await context.SaveChangesAsync();
            }

            if (!await context.UserDesigns.AnyAsync())
            {
                var customer = await context.Users.FirstOrDefaultAsync(u => u.Role == "Customer");
                var baseProduct = await context.BaseProducts.FirstOrDefaultAsync();

                if (customer != null && baseProduct != null)
                {
                    var userDesigns = new List<UserDesign>
                    {
                        new UserDesign
                        {
                            UserId = customer.UserId,
                            BaseProductId = baseProduct.BaseProductId,
                            CanvasJson = "{\"objects\": []}",
                            FrontCanvasJson = "{\"objects\": []}",
                            BackCanvasJson = "{\"objects\": []}",
                            PreviewImageUrl = "https://placehold.co/400x400/png?text=Mock+Design",
                            FrontPreviewImageUrl = "https://placehold.co/400x400/png?text=Mock+Design",
                            DesignName = "My Awesome Design 1",
                            IsOrdered = false,
                            CreatedAt = DateTime.Now
                        },
                        new UserDesign
                        {
                            UserId = customer.UserId,
                            BaseProductId = baseProduct.BaseProductId,
                            CanvasJson = "{\"objects\": [{\"type\": \"text\", \"text\": \"FPT Rocks\"}]}",
                            FrontCanvasJson = "{\"objects\": [{\"type\": \"text\", \"text\": \"FPT Rocks\"}]}",
                            BackCanvasJson = "{\"objects\": []}",
                            PreviewImageUrl = "https://placehold.co/400x400/png?text=FPT+Rocks",
                            FrontPreviewImageUrl = "https://placehold.co/400x400/png?text=FPT+Rocks",
                            DesignName = "FPT Rocks Shirt",
                            IsOrdered = true,
                            CreatedAt = DateTime.Now.AddDays(-1)
                        }
                    };
                    await context.UserDesigns.AddRangeAsync(userDesigns);
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.Orders.AnyAsync())
            {
                var customer = await context.Users.FirstOrDefaultAsync(u => u.Role == "Customer");
                var orderedDesign = await context.UserDesigns.FirstOrDefaultAsync(d => d.IsOrdered);

                if (customer != null && orderedDesign != null)
                {
                    var order = new Order
                    {
                        UserId = customer.UserId,
                        OrderCode = "ORD-" + DateTime.Now.Ticks.ToString().Substring(8),
                        TotalAmount = 250000,
                        ShippingFee = 30000,
                        DiscountAmount = 0,
                        ShipName = customer.FullName,
                        ShipPhone = customer.Phone ?? "0988000000",
                        ShipAddress = "123 FPT Street",
                        ShipProvince = "Hanoi",
                        PaymentMethod = "COD",
                        PaymentStatus = "Pending",
                        OrderStatus = "Pending",
                        CreatedAt = DateTime.Now,
                        OrderItems = new List<OrderItem>
                        {
                            new OrderItem
                            {
                                DesignId = orderedDesign.DesignId,
                                Quantity = 1,
                                UnitPrice = 250000,
                                Size = "L"
                            }
                        }
                    };
                    await context.Orders.AddAsync(order);
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.Invoices.AnyAsync())
            {
                var order = await context.Orders
                    .Include(o => o.User)
                    .OrderBy(o => o.OrderId)
                    .FirstOrDefaultAsync();

                if (order != null)
                {
                    var invoice = new Invoice
                    {
                        OrderId = order.OrderId,
                        InvoiceNumber = $"INV-SEED-{order.OrderId:000000}",
                        IssueDate = DateTime.UtcNow,
                        BillingName = order.ShipName,
                        BillingAddress = order.ShipAddress,
                        BuyerPhone = order.ShipPhone,
                        BuyerEmail = order.User.Email,
                        CurrencyCode = "VND",
                        SubTotal = order.TotalAmount - order.ShippingFee + order.DiscountAmount,
                        VoucherDiscountAmount = order.DiscountAmount,
                        ShippingFee = order.ShippingFee,
                        TotalAmount = order.TotalAmount,
                        InvoiceStatus = "Issued",
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Invoices.AddAsync(invoice);
                    await context.SaveChangesAsync();
                }
            }
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
