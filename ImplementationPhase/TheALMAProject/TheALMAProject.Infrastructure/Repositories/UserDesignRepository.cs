using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
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
    }
}
