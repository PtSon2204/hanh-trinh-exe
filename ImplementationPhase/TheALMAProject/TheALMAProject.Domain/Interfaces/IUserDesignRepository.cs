using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUserDesignRepository
    {
        Task<UserDesign?> GetByIdWithDetailsAsync(int designId);
    }
}
