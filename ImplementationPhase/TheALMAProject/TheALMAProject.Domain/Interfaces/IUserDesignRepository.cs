using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUserDesignRepository
    {
        Task<UserDesign?> GetByIdWithDetailsAsync(int designId);
        Task<PagedResult<UserDesign>> GetMyDesignsAsync(int userId, UserDesignQuery query);
        Task<UserDesign?> GetByIdForOwnerAsync(int designId, int userId);
        Task<UserDesign?> GetSharedDesignByIdAsync(int designId);
        Task<UserDesign?> GetByIdForUpdateAsync(int designId, int userId);
        void Delete(UserDesign design);
    }
}
