using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Repositories;

namespace TheALMAProject.Infrastructure.Data
{
    public class UnitOfWork : IUnitOfWork
    {

        private readonly ApplicationDbContext _context;

        public IUserRepository UserRepo { get; }
        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;

            UserRepo = new UserRepository(_context);
        }
        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
