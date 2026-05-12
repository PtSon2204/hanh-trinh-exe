using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Models;
using TheALMAProject.Infrastructure.Data;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly ApplicationDbContext _context;

        public InvoiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Invoice?> GetByOrderIdAsync(int orderId, int userId)
        {
            // Join qua bảng Order để verify đúng người mua
            return await _context.Invoices
                .Include(i => i.Order)
                .FirstOrDefaultAsync(i => i.OrderId == orderId && i.Order.UserId == userId);
        }

        public async Task AddInvoiceAsync(Invoice invoice)
        {
            await _context.Invoices.AddAsync(invoice);
        }
    }
}
