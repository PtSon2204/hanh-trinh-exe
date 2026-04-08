using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;

namespace TheALMAProject.Infrastructure.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        // private readonly ApplicationDbContext _context;
        //public IStudentRepository StudentsRepo { get; }
        //public UnitOfWork(ApplicationDbContext context)
        //{
        //    _context = context;

        //    StudentsRepo = new StudentRepository(_context);
        //}
        public async Task<int> SaveChangesAsync()
        {
            //return await _context.SaveChangesAsync();
            throw new NotImplementedException();
        }
    }
}
