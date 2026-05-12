using Microsoft.Extensions.DependencyInjection;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Repositories;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IBaseProductRepository, BaseProductRepository>();
            services.AddScoped<IStoreProductRepository, StoreProductRepository>();
            services.AddScoped<IIconRepository, IconRepository>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<ICartRepository, CartRepository>();
            services.AddScoped<IInvoiceRepository, InvoiceRepository>();
            services.AddScoped<IUserDesignRepository, UserDesignRepository>();
            services.AddScoped<IFontRepository, FontRepository>();
            services.AddScoped<IVoucherRepository, VoucherRepository>();
            services.AddScoped<IUniversityRepository, UniversityRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();
            services.AddScoped<IAddressRepository, AddressRepository>();

            return services;
        }
    }
}
