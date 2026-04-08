using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUnitOfWork
    {
        //Ví dụ:
       // IStudentRepository StudentsRepo { get; }
        Task<int> SaveChangesAsync();
    }
}
