namespace TheALMAProject.Domain.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepo { get; }
        IBaseProductRepository BaseProductRepo { get; }
        IStoreProductRepository StoreProductRepo { get; }
        IIconRepository IconRepo { get; }
        IOrderRepository OrderRepo { get; }
        ICartRepository CartRepo { get; }
        IUserDesignRepository UserDesignRepo { get; }
        IReviewRepository ReviewRepo { get; }
        IInvoiceRepository InvoiceRepo { get; }
        IFontRepository FontRepo { get; }
        IVoucherRepository VoucherRepo { get; }
        IUniversityRepository UniversityRepo { get; }
        Task<int> SaveChangesAsync();
    }
}
