using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.PaymentDtos
{
    public class PaymentInformationModel
    {
        public string OrderCode { get; set; } = null!;
        public double Amount { get; set; }
        public string OrderDescription { get; set; } = null!;
        public string Name { get; set; } = null!;
    }
}
