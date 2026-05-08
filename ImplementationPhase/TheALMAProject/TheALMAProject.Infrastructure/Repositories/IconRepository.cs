using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class IconRepository : IIconRepository
    {
        private readonly ApplicationDbContext _context;

        public IconRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Icon>> GetIcons(IconQuery query)
        {
            var icons = _context.Icons.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                icons = icons.Where(x => x.Name.Contains(query.Name));
            }

            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                icons = icons.Where(x => x.Category.Contains(query.Category));
            }

            if (query.IsActive.HasValue)
            {
                icons = icons.Where(x => x.IsActive == query.IsActive.Value);
            }

            var totalRecords = await icons.CountAsync();
            var data = await icons
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<Icon>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<Icon?> GetById(int id)
        {
            return await _context.Icons.FindAsync(id);
        }

        public async Task<Icon?> GetIconByName(string name)
        {
            return await _context.Icons.FirstOrDefaultAsync(x => x.Name == name);
        }

        public async Task CreateIcon(Icon icon)
        {
            await _context.AddAsync(icon);
        }

        public void UpdateIcon(Icon icon)
        {
            _context.Update(icon);
        }

        public void DeleteIcon(Icon icon)
        {
            _context.Remove(icon);
        }
    }
}
