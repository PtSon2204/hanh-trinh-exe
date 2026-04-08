using FluentValidation.AspNetCore;
using FluentValidation;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TheALMAProject.API.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddCustomServices(this IServiceCollection services, IConfiguration configuration)
        {
            //Đăng kí serivce
            //services.AddScoped<IStudentService, StudentService>();

            //Đăng kí fluentValidation
            //services.AddFluentValidationAutoValidation();
            //services.AddValidatorsFromAssemblyContaining<CreateRoleDtoValidator>();

            //Đăng kí map entity -> dto
            //services.AddAutoMapper(typeof(StudentMappingProfile));

            //Đăng kí jwt
            //services.AddScoped<JwtService>();
            //services.AddAuthentication("Bearer").AddJwtBearer("Bearer", options =>
            //{
            //    options.TokenValidationParameters = new TokenValidationParameters
            //    {
            //        ValidateIssuerSigningKey = true,
            //        IssuerSigningKey = new SymmetricSecurityKey(
            //            Encoding.UTF8.GetBytes(configuration["Jwt:Key"])
            //        ),
            //        ValidateIssuer = false,
            //        ValidateAudience = false
            //    };
            //});

            //return services;
            throw new NotImplementedException();
        }
    }
}
