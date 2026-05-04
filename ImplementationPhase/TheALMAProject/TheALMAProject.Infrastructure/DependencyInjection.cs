using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Repositories;

namespace TheALMAProject.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IUserRepository, UserRepository>();
          
            return services;
        }
    }
}
