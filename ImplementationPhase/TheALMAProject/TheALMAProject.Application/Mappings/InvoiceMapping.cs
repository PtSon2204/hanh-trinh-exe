using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.InvoiceDtos;
using TheALMAProject.Domain.Models;

namespace TheALMAProject.Application.Mappings
{
    public class InvoiceMapping : Profile
    {
        public InvoiceMapping()
        {
            CreateMap<Invoice, InvoiceResponseDto>();
        }
    }
}
