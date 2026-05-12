using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class UniversityRepository : IUniversityRepository
    {
        private readonly ApplicationDbContext _context;

        public UniversityRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<University>> GetAdminUniversities(AdminUniversityQuery query)
        {
            var universities = _context.Universities.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                universities = universities.Where(x => x.Name.Contains(query.Name));
            }

            if (query.IsActive.HasValue)
            {
                universities = universities.Where(x => x.IsActive == query.IsActive.Value);
            }

            universities = universities.OrderBy(x => x.UniversityId);

            var totalRecords = await universities.CountAsync();
            var data = await universities
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<University>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<University?> GetById(int id)
        {
            return await _context.Universities.FindAsync(id);
        }

        public async Task<University?> GetByName(string name)
        {
            var normalizedName = name.Trim().ToLower();

            return await _context.Universities.FirstOrDefaultAsync(x => x.Name.ToLower() == normalizedName);
        }

        public async Task CreateUniversity(University university)
        {
            await _context.Universities.AddAsync(university);
        }

        public void UpdateUniversity(University university)
        {
            _context.Universities.Update(university);
        }

        public void DeleteUniversity(University university)
        {
            _context.Universities.Remove(university);
        }
    }
}
