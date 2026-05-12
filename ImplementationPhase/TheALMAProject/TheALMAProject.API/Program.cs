using TheALMAProject.Infrastructure;
using TheALMAProject.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using TheALMAProject.API.Extensions;
using TheALMAProject.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TheALMAProject.API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

            //Đki db
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
           options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            //Đăng kí repository
            builder.Services.AddInfrastructure();

            //Đăng kí service
            builder.Services.AddCustomServices(builder.Configuration);

            // =====================================================
            // CẤU HÌNH MEMORY CACHE — Lưu OTP và Reset Token tạm
            // =====================================================
            builder.Services.AddMemoryCache();

            // =====================================================
            // CẤU HÌNH JWT AUTHENTICATION
            // =====================================================
            // Giải thích:
            // 1. AddAuthentication: Khai báo scheme mặc định là JwtBearer
            // 2. AddJwtBearer: Cấu hình cách server verify JWT token
            //    - ValidateIssuerSigningKey: Kiểm tra chữ ký token bằng SecretKey
            //    - ValidateIssuer: Kiểm tra token được phát hành bởi "TheALMAProject"
            //    - ValidateAudience: Kiểm tra token dành cho "TheALMAProject"
            //    - ValidateLifetime: Kiểm tra token chưa hết hạn
            var jwtSecretKey = builder.Configuration["JwtSettings:SecretKey"]
                ?? throw new InvalidOperationException("JwtSettings:SecretKey chưa được cấu hình trong appsettings.json!");

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = builder.Configuration["JwtSettings:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero  // Không cho phép sai lệch thời gian
                };
            });

            builder.Services.AddEndpointsApiExplorer();

            // =====================================================
            // CẤU HÌNH SWAGGER CÓ JWT
            // =====================================================
            // Thêm nút "Authorize" trên Swagger UI để test API có JWT
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Nhập JWT token. Ví dụ: eyJhbGci..."
                });
                options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            //SeedData
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await DbInitializer.InitializeAsync(context);
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            //Đăng kí middleware exception
            app.UseMiddleware<ExceptionMiddleware>();

            app.UseHttpsRedirection();

            // Phục vụ file tĩnh (avatar, images) từ wwwroot
            app.UseStaticFiles();

            // =====================================================
            // QUAN TRỌNG: Thứ tự middleware
            // UseAuthentication PHẢI trước UseAuthorization
            // 1. Authentication: "Bạn là ai?" (verify JWT → lấy UserId, Role)
            // 2. Authorization:  "Bạn có quyền không?" (check [Authorize] attribute)
            // =====================================================
            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
