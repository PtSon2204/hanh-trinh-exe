using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Infrastructure.Models;


namespace TheALMAProject.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            await context.Database.MigrateAsync();

            if (context.Users.Any())
            {
                return;
            }

            string defaultPassword = "Password@123";
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

            // --- SEED USERS ---
            var users = new List<User>
            {
                // Tài khoản hệ thống
                new User { Email = "admin@thealma.vn", PasswordHash = hashedPassword, FullName = "System Admin", Phone = "0988000001", Role = "Admin", IsActive = true, CreatedAt = DateTime.Now },
                new User { Email = "product@thealma.vn", PasswordHash = hashedPassword, FullName = "Product Manager", Phone = "0988000002", Role = "ProdMgr", IsActive = true, CreatedAt = DateTime.Now },
                new User { Email = "order@thealma.vn", PasswordHash = hashedPassword, FullName = "Order Manager", Phone = "0988000003", Role = "OrderMgr", IsActive = true, CreatedAt = DateTime.Now },
                
                // Tài khoản Customer
                new User { Email = "son.pt@gmail.com", PasswordHash = hashedPassword, FullName = "Phạm Thế Sơn", Phone = "0988111222", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now },
                new User { Email = "nguyenvana@gmail.com", PasswordHash = hashedPassword, FullName = "Nguyễn Văn A", Phone = "0988333444", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now },
                new User { Email = "tranthib@gmail.com", PasswordHash = hashedPassword, FullName = "Trần Thị B", Phone = "0988555666", Role = "Customer", IsActive = true, CreatedAt = DateTime.Now }
            };
            await context.Users.AddRangeAsync(users);

            // --- SEED UNIVERSITIES ---
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

            // --- SEED BASE PRODUCTS (Phôi áo / Shirt Templates) ---
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
                    AvailableColors = "#FFFFFF,#000000,#F5F5DC,#000080", // Trắng, Đen, Be, Navy
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
                    AvailableColors = "#FFFFFF,#000000,#800000", // Trắng, Đen, Đô
                    AvailableSizes = "M,L,XL,XXL",
                    IsActive = true
                },
                new BaseProduct
                {
                    Name = "Áo Hoodie mùa đông form Boxy",
                    BasePrice = 220000.00m,
                    FrontImageUrl = "/images/blanks/hoodie-front.png",
                    BackImageUrl = "/images/blanks/hoodie-back.png",
                    PrintAreaJson = "{\"front\":{\"x\":180,\"y\":280,\"width\":240,\"height\":300},\"back\":{\"x\":150,\"y\":200,\"width\":300,\"height\":450}}",
                    Category = "Hoodie",
                    Material = "Nỉ bông định lượng 350gsm",
                    AvailableColors = "#000000,#808080,#006400", // Đen, Xám, Xanh rêu
                    AvailableSizes = "M,L,XL",
                    IsActive = true
                }
            };
            await context.BaseProducts.AddRangeAsync(baseProducts);

            await context.SaveChangesAsync();
        }
    }
}