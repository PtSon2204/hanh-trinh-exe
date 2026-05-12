using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.InvoiceDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Interfaces;

namespace TheALMAProject.Application.Services
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IPdfService _pdfService; 
        public InvoiceService(IUnitOfWork unitOfWork, IMapper mapper, IPdfService pdfService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _pdfService = pdfService;
        }

        public async Task<InvoiceResponseDto?> GetInvoiceDataAsync(int userId, int orderId)
        {
            var invoice = await _unitOfWork.InvoiceRepo.GetByOrderIdAsync(orderId, userId);
            if (invoice == null) return null;

            return _mapper.Map<InvoiceResponseDto>(invoice);
        }

        public async Task<byte[]?> DownloadInvoicePdfAsync(int userId, int orderId)
        {
            var invoiceData = await GetInvoiceDataAsync(userId, orderId);
            if (invoiceData == null) return null;

            return _pdfService.GenerateInvoicePdf(invoiceData);
        }
    }
}
