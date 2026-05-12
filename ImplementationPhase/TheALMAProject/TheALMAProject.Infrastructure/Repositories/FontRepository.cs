using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class FontRepository : IFontRepository
    {
        private readonly ApplicationDbContext _context;
        public FontRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Font?> GetByIdAsync(int id) => await _context.Fonts.FindAsync(id);
    }
}
