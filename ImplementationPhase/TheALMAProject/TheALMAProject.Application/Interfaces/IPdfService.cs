using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.InvoiceDtos;

namespace TheALMAProject.Application.Interfaces
{
    public interface IPdfService
    {
        byte[] GenerateInvoicePdf(InvoiceResponseDto invoiceData);
    }
}
