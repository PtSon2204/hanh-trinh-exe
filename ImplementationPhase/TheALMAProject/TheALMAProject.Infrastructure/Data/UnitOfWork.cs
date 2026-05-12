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

        public IIconRepository IconRepo { get; }

        public IOrderRepository OrderRepo {  get; }
        public ICartRepository CartRepo { get; }

        public IUserDesignRepository UserDesignRepo { get; }
        public IReviewRepository ReviewRepo { get; }
        public IInvoiceRepository InvoiceRepo { get; }
        public IFontRepository FontRepo { get; }
        public IVoucherRepository VoucherRepo { get; }
        public IUniversityRepository UniversityRepo { get; }
        public INotificationRepository NotificationRepo { get; }
        public IAddressRepository AddressRepo { get; }
        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;

            UserRepo = new UserRepository(_context);
            BaseProductRepo = new BaseProductRepository(_context);
            StoreProductRepo = new StoreProductRepository(_context);
            IconRepo = new IconRepository(_context);
            OrderRepo = new OrderRepository(_context);
            CartRepo = new CartRepository(_context);
            UserDesignRepo = new UserDesignRepository(_context);
            ReviewRepo = new ReviewRepository(_context);   
            InvoiceRepo = new InvoiceRepository(_context);
            FontRepo = new FontRepository(_context);
            VoucherRepo = new VoucherRepository(_context);
            UniversityRepo = new UniversityRepository(_context);
            NotificationRepo = new NotificationRepository(_context);
            AddressRepo = new AddressRepository(_context);
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
