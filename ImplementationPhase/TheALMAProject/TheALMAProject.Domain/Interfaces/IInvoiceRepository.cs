using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IInvoiceRepository
    {
        Task<Invoice?> GetByOrderIdAsync(int orderId, int userId);
        Task AddInvoiceAsync(Invoice invoice);
    }
}
