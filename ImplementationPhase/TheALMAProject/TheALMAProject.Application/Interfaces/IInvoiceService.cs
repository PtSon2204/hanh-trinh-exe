using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.InvoiceDtos;

namespace TheALMAProject.Application.Interfaces
{
    public interface IInvoiceService
    {
        Task<InvoiceResponseDto?> GetInvoiceDataAsync(int userId, int orderId);
        Task<byte[]?> DownloadInvoicePdfAsync(int userId, int orderId);
    }
}
