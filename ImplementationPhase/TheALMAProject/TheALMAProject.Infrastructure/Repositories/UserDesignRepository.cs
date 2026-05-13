using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class UserDesignRepository : IUserDesignRepository
    {
        private readonly ApplicationDbContext _context;

        public UserDesignRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<UserDesign?> GetByIdWithDetailsAsync(int designId)
        {
            return await _context.UserDesigns
         .Include(ud => ud.Icons)
         .FirstOrDefaultAsync(ud => ud.DesignId == designId);
        }

        public async Task<PagedResult<UserDesign>> GetAllAsync(PaginationParams paginationParams)
        {
            var query = _context.UserDesigns
                .Include(ud => ud.User)
                .Include(ud => ud.BaseProduct)
                .AsQueryable();

            var totalRecords = await query.CountAsync();
            var data = await query
                .OrderByDescending(ud => ud.CreatedAt)
                .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
                .Take(paginationParams.PageSize)
                .ToListAsync();

            return new PagedResult<UserDesign>
            {
                Data = data,
                PageNumber = paginationParams.PageNumber,
                PageSize = paginationParams.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)paginationParams.PageSize)
            };
        }

        public async Task<UserDesign?> GetByIdWithAdminDetailsAsync(int designId)
        {
            return await _context.UserDesigns
                .Include(ud => ud.User)
                .Include(ud => ud.BaseProduct)
                .FirstOrDefaultAsync(ud => ud.DesignId == designId);
        }

        public async Task<PagedResult<UserDesign>> GetMyDesignsAsync(int userId, UserDesignQuery query)
        {
            var designs = _context.UserDesigns
                .Include(ud => ud.BaseProduct)
                .Include(ud => ud.Icons)
                .Include(ud => ud.Fonts)
                .Where(ud => ud.UserId == userId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.DesignName))
            {
                designs = designs.Where(ud => ud.DesignName != null && ud.DesignName.Contains(query.DesignName));
            }

            if (query.IsOrdered.HasValue)
            {
                designs = designs.Where(ud => ud.IsOrdered == query.IsOrdered.Value);
            }

            var totalRecords = await designs.CountAsync();
            var data = await designs
                .OrderByDescending(ud => ud.CreatedAt) 
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<UserDesign>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<UserDesign?> GetByIdForOwnerAsync(int designId, int userId)
        {
            return await _context.UserDesigns.FirstOrDefaultAsync(ud => ud.DesignId == designId && ud.UserId == userId);
        }

        public async Task<UserDesign?> GetSharedDesignByIdAsync(int designId)
        {
            return await _context.UserDesigns
                .Include(ud => ud.BaseProduct)
                .Include(ud => ud.Icons)
                .Include(ud => ud.Fonts)
                .FirstOrDefaultAsync(ud => ud.DesignId == designId);
        }

        //hàm phục vụ cho update
        public async Task<UserDesign?> GetByIdForUpdateAsync(int designId, int userId)
        {
            return await _context.UserDesigns
                .Include(ud => ud.Icons) 
                .Include(ud => ud.Fonts)
                .FirstOrDefaultAsync(ud => ud.DesignId == designId && ud.UserId == userId);
        }
        public void Delete(UserDesign design)
        {
            _context.UserDesigns.Remove(design);
        }
        public async Task AddAsync(UserDesign design)
        {
            await _context.UserDesigns.AddAsync(design);
        }
    }
}
