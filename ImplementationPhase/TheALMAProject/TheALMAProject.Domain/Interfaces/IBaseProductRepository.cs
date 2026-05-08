using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IBaseProductRepository
    {
        Task<PagedResult<BaseProduct>> GetBaseProducts(BaseProductQuery query);

        Task<BaseProduct?> GetById(int id);

        Task<BaseProduct?> GetBaseProductByName(string name);

        Task CreateBaseProduct(BaseProduct baseProduct);

        void UpdateBaseProduct(BaseProduct baseProduct);

        void DeleteBaseProduct(BaseProduct baseProduct);
    }
}
