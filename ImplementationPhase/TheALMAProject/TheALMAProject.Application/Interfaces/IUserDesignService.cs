using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.UserDesignDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IUserDesignService
    {
        Task<bool> UpdateDesignAsync(int userId, int designId, UpdateUserDesignDto dto);
        Task<PagedResult<UserDesignResponseDto>> GetMyDesignsAsync(int userId, UserDesignQuery query);
        Task<string> DeleteDesignAsync(int userId, int designId);
        Task<UserDesignResponseDto?> GetSharedDesignAsync(int designId);
    }
}
