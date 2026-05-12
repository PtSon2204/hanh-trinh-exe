using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IVoucherRepository
    {
        Task<PagedResult<Voucher>> GetVouchers(VoucherQuery voucherQuery);
        Task<PagedResult<Voucher>> GetAdminVouchers(AdminVoucherQuery voucherQuery);
        Task<Voucher?> GetById(int id);
        Task<Voucher?> GetByCode(string code);
        Task CreateVoucher(Voucher voucher);
        void UpdateVoucher(Voucher voucher);
        void DeleteVoucher(Voucher voucher);
    }
}