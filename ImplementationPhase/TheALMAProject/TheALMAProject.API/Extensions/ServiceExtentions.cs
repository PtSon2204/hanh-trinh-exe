using FluentValidation;
using FluentValidation.AspNetCore;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Application.Mappings;
using TheALMAProject.Application.Services;
using TheALMAProject.Application.Validator.UserValidators;

namespace TheALMAProject.API.Extensions
{
    public static class ServiceExtensions
    {
        public static IServiceCollection AddCustomServices(this IServiceCollection services, IConfiguration configuration)
        {
            //Đăng kí serivce
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAuthService, AuthService>();

            //Đăng kí fluentValidation
            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblyContaining<CreateUserDtoValidator>();

            //Đăng kí map entity -> dto
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(UserMapping).Assembly));
            
            return services;
        }
    }
}
