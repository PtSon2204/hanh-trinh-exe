using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class VoucherRepository : IVoucherRepository
    {
        private readonly ApplicationDbContext _context;

        public VoucherRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Voucher>> GetVouchers(VoucherQuery voucherQuery)
        {
            var now = DateTime.Now;
            var vouchers = _context.Vouchers
                .AsNoTracking()
                .Where(x => x.IsActive && x.StartDate <= now && x.EndDate >= now && x.UsedCount < x.UsageLimit)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(voucherQuery.Code))
            {
                vouchers = vouchers.Where(x => x.Code.Contains(voucherQuery.Code));
            }

            if (voucherQuery.DiscountPercent.HasValue)
            {
                vouchers = vouchers.Where(x => x.DiscountPercent == voucherQuery.DiscountPercent.Value);
            }

            if (voucherQuery.MaxDiscount.HasValue)
            {
                vouchers = vouchers.Where(x => x.MaxDiscount == voucherQuery.MaxDiscount.Value);
            }

            if (voucherQuery.MinOrderAmount.HasValue)
            {
                vouchers = vouchers.Where(x => x.MinOrderAmount == voucherQuery.MinOrderAmount.Value);
            }

            if (voucherQuery.StartDate.HasValue)
            {
                vouchers = vouchers.Where(x => x.StartDate.Date >= voucherQuery.StartDate.Value.Date);
            }

            if (voucherQuery.EndDate.HasValue)
            {
                vouchers = vouchers.Where(x => x.EndDate.Date <= voucherQuery.EndDate.Value.Date);
            }

            vouchers = vouchers.OrderBy(x => x.VoucherId);

            var totalRecords = await vouchers.CountAsync();
            var data = await vouchers
                .Skip((voucherQuery.PageNumber - 1) * voucherQuery.PageSize)
                .Take(voucherQuery.PageSize)
                .ToListAsync();

            return new PagedResult<Voucher>
            {
                Data = data,
                PageNumber = voucherQuery.PageNumber,
                PageSize = voucherQuery.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)voucherQuery.PageSize)
            };
        }

        public async Task<PagedResult<Voucher>> GetAdminVouchers(AdminVoucherQuery voucherQuery)
        {
            var vouchers = _context.Vouchers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(voucherQuery.Code))
            {
                vouchers = vouchers.Where(x => x.Code.Contains(voucherQuery.Code));
            }

            if (voucherQuery.DiscountPercent.HasValue)
            {
                vouchers = vouchers.Where(x => x.DiscountPercent == voucherQuery.DiscountPercent.Value);
            }

            if (voucherQuery.StartDate.HasValue)
            {
                vouchers = vouchers.Where(x => x.StartDate.Date >= voucherQuery.StartDate.Value.Date);
            }

            if (voucherQuery.EndDate.HasValue)
            {
                vouchers = vouchers.Where(x => x.EndDate.Date <= voucherQuery.EndDate.Value.Date);
            }

            if (voucherQuery.MaxDiscount.HasValue)
            {
                vouchers = vouchers.Where(x => x.MaxDiscount == voucherQuery.MaxDiscount.Value);
            }

            if (voucherQuery.MinOrderAmount.HasValue)
            {
                vouchers = vouchers.Where(x => x.MinOrderAmount == voucherQuery.MinOrderAmount.Value);
            }

            if (voucherQuery.UsageLimit.HasValue)
            {
                vouchers = vouchers.Where(x => x.UsageLimit == voucherQuery.UsageLimit.Value);
            }

            if (voucherQuery.UsedCount.HasValue)
            {
                vouchers = vouchers.Where(x => x.UsedCount == voucherQuery.UsedCount.Value);
            }

            if (voucherQuery.IsActive.HasValue)
            {
                vouchers = vouchers.Where(x => x.IsActive == voucherQuery.IsActive.Value);
            }

            vouchers = vouchers.OrderBy(x => x.VoucherId);

            var totalRecords = await vouchers.CountAsync();
            var data = await vouchers
                .Skip((voucherQuery.PageNumber - 1) * voucherQuery.PageSize)
                .Take(voucherQuery.PageSize)
                .ToListAsync();

            return new PagedResult<Voucher>
            {
                Data = data,
                PageNumber = voucherQuery.PageNumber,
                PageSize = voucherQuery.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)voucherQuery.PageSize)
            };
        }

        public async Task<Voucher?> GetById(int id)
        {
            return await _context.Vouchers.FindAsync(id);
        }

        public async Task<Voucher?> GetByCode(string code)
        {
            return await _context.Vouchers.FirstOrDefaultAsync(x => x.Code == code);
        }

        public async Task CreateVoucher(Voucher voucher)
        {
            await _context.Vouchers.AddAsync(voucher);
        }

        public void UpdateVoucher(Voucher voucher)
        {
            _context.Vouchers.Update(voucher);
        }

        public void DeleteVoucher(Voucher voucher)
        {
            _context.Vouchers.Remove(voucher);
        }
    }
}
