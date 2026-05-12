using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Repositories;

namespace TheALMAProject.Infrastructure.Data
{
    public class UnitOfWork : IUnitOfWork
    {

        private readonly ApplicationDbContext _context;

        public IUserRepository UserRepo { get; }

        public IBaseProductRepository BaseProductRepo { get; }

        public IStoreProductRepository StoreProductRepo {  get; }

        public IOrderRepository OrderRepo {  get; }
        public ICartRepository CartRepo { get; }

        public IUserDesignRepository UserDesignRepo { get; }
        public IReviewRepository ReviewRepo { get; }
        public IInvoiceRepository InvoiceRepo { get; }

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;

            UserRepo = new UserRepository(_context);
            BaseProductRepo = new BaseProductRepository(_context);
            StoreProductRepo = new StoreProductRepository(_context);
            OrderRepo = new OrderRepository(_context);
            CartRepo = new CartRepository(_context);
            UserDesignRepo = new UserDesignRepository(_context);
            ReviewRepo = new ReviewRepository(_context);   
            InvoiceRepo = new InvoiceRepository(_context);
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
