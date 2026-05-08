using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepo { get; }
        IBaseProductRepository BaseProductRepo { get; }
        IStoreProductRepository StoreProductRepo { get; }
        IOrderRepository OrderRepo { get; }
        ICartRepository CartRepo { get; }
        Task<int> SaveChangesAsync();
    }
}
