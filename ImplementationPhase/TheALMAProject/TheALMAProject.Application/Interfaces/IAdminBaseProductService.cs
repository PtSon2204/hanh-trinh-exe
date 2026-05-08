using TheALMAProject.Application.DTOs.BaseProductDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminBaseProductService
    {
        Task<PagedResult<BaseProductListDto>> GetBaseProducts(BaseProductQuery query);

        Task<BaseProductDto?> GetBaseProductById(int id);

        Task CreateBaseProduct(CreateBaseProductDto baseProduct);

        Task UpdateBaseProduct(int id, UpdateBaseProductDto baseProduct);

        Task DeleteBaseProduct(int id);
    }
}
