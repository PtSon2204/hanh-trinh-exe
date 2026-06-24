using TheALMAProject.Infrastructure;
using TheALMAProject.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
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

            // Chỉ nạp file .env nếu file này thực sự tồn tại (tức là đang chạy ở máy tính của bạn)
            if (File.Exists(".env"))
            {
                DotNetEnv.Env.Load();
            }
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

            // =====================================================
            // CẤU HÌNH CORS 
            // =====================================================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowVercel", policy =>
                {
                    policy.WithOrigins(
                            "https://thealmastore.vercel.app", // Link Vercel
                            "http://localhost:5173", // Link Local của React/Vite
                            "http://localhost:3000"
                          )
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            //Đki db
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseNpgsql(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    npgsqlOptions =>
                    {
                        npgsqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 5,
                            maxRetryDelay: TimeSpan.FromSeconds(60),
                            errorCodesToAdd: null);
                    });
            });

            //Đăng kí repository
            builder.Services.AddInfrastructure(builder.Environment);

            //Đăng kí service
            builder.Services.AddCustomServices(builder.Configuration);

            // =====================================================
            // CẤU HÌNH MEMORY CACHE — Lưu OTP và Reset Token tạm
            // =====================================================
            builder.Services.AddMemoryCache();

            // =====================================================
            // CẤU HÌNH CHỐNG DDOS — Rate Limiting + IP Blacklist + Body Size Limit
            // =====================================================
            if (!builder.Environment.IsDevelopment())
            {
                builder.Services.AddDDoSProtection(builder.Configuration);
            }

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
                var logger = scope.ServiceProvider
                    .GetRequiredService<ILogger<Program>>();

                try
                {
                    var context = scope.ServiceProvider
                        .GetRequiredService<ApplicationDbContext>();

                    await DbInitializer.InitializeAsync(context);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Database initialization failed");
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            //Đăng kí middleware exception
            app.UseMiddleware<ExceptionMiddleware>();

            // Tầng 4 - Security headers — ẩn thông tin server, chống XSS/Clickjacking
            app.UseMiddleware<SecurityHeadersMiddleware>();

            if (!app.Environment.IsDevelopment())
            {
                // Tầng 3 - IP Blacklist — chặn IP thủ công + auto-block IP tấn công
                app.UseMiddleware<IpBlacklistMiddleware>();

                // Tầng 2 - Kích hoạt Rate Limiting — giới hạn request/phút/IP (phải đặt trước UseAuthentication)
                app.UseRateLimiter();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowVercel");

            // Phục vụ file tĩnh (avatar, images) từ wwwroot với cấu hình CORS
            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
                    ctx.Context.Response.Headers["Access-Control-Allow-Headers"] = "Origin, X-Requested-With, Content-Type, Accept";
                }
            });

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
