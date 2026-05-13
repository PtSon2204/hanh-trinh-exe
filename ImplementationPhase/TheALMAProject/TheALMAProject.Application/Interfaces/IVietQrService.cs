using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.PaymentDtos;

namespace TheALMAProject.Application.Interfaces
{
    public interface IVietQrService
    {
        string GenerateQrImageUrl(PaymentInformationModel model);
    }
}
