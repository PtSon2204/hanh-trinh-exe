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
            services.AddScoped<IAdminUserService, AdminUserService>();
            services.AddScoped<IAdminBaseProductService, AdminBaseProductService>();
            services.AddScoped<IAdminStoreProductService, AdminStoreProductService>();
            services.AddScoped<IAdminIconService, AdminIconService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<ICartService, CartService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IPdfService, PdfService>();
            services.AddScoped<IInvoiceService, InvoiceService>();
            services.AddScoped<IAdminInvoiceService, AdminInvoiceService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IUserDesignService, UserDesignService>();
            services.AddScoped<IAdminVoucherService, AdminVoucherService>();
            services.AddScoped<IAdminUniversityService, AdminUniversityService>();
            services.AddScoped<IAdminOrderService, AdminOrderService>();
            services.AddScoped<IAdminUserDesignService, AdminUserDesignService>();
            //Đăng kí fluentValidation
            services.AddFluentValidationAutoValidation();
            services.AddValidatorsFromAssemblyContaining<CreateUserDtoValidator>();

            //Đăng kí map entity -> dto
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(UserMapping).Assembly));
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(OrderMapping).Assembly));
            services.AddAutoMapper(cfg => cfg.AddMaps(typeof(ReviewMapping).Assembly));

            return services;
        }
    }
}
