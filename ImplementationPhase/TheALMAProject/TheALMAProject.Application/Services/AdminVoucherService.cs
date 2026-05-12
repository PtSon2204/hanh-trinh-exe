using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminVoucherDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class AdminVoucherService : IAdminVoucherService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminVoucherService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<AdminVoucherListDto>> GetVouchers(AdminVoucherQuery query)
        {
            var result = await _unitOfWork.VoucherRepo.GetAdminVouchers(query);

            return new PagedResult<AdminVoucherListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminVoucherListDto>>(result.Data)
            };
        }

        public async Task<AdminVoucherDto?> GetVoucherById(int id)
        {
            var voucher = await _unitOfWork.VoucherRepo.GetById(id);

            return _mapper.Map<AdminVoucherDto>(voucher);
        }

        public async Task<AdminVoucherDto> CreateVoucher(AdminCreateVoucherDto dto)
        {
            await EnsureCodeAvailable(dto.Code);
            EnsureValidDateRange(dto.StartDate, dto.EndDate);
            EnsureUsageLimitIsNotExceeded(dto.UsageLimit, 0);

            var voucher = _mapper.Map<Voucher>(dto);
            voucher.UsedCount = 0;

            await _unitOfWork.VoucherRepo.CreateVoucher(voucher);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminVoucherDto>(voucher);
        }

        public async Task<AdminVoucherDto> UpdateVoucher(int id, AdminUpdateVoucherDto dto)
        {
            var voucher = await GetVoucherOrThrow(id);

            await EnsureCodeAvailable(dto.Code, id);
            EnsureValidDateRange(dto.StartDate, dto.EndDate);
            EnsureUsageLimitIsNotExceeded(dto.UsageLimit, voucher.UsedCount);

            voucher.Code = dto.Code;
            voucher.DiscountPercent = dto.DiscountPercent;
            voucher.MaxDiscount = dto.MaxDiscount;
            voucher.MinOrderAmount = dto.MinOrderAmount;
            voucher.UsageLimit = dto.UsageLimit;
            voucher.StartDate = dto.StartDate;
            voucher.EndDate = dto.EndDate;
            voucher.IsActive = dto.IsActive;

            _unitOfWork.VoucherRepo.UpdateVoucher(voucher);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminVoucherDto>(voucher);
        }

        public async Task DeleteVoucher(int id)
        {
            var voucher = await GetVoucherOrThrow(id);

            _unitOfWork.VoucherRepo.DeleteVoucher(voucher);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<Voucher> GetVoucherOrThrow(int id)
        {
            var voucher = await _unitOfWork.VoucherRepo.GetById(id);
            if (voucher == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "Voucher not found");
            }

            return voucher;
        }

        private async Task EnsureCodeAvailable(string code, int? voucherId = null)
        {
            var existingVoucher = await _unitOfWork.VoucherRepo.GetByCode(code);
            if (existingVoucher != null && existingVoucher.VoucherId != voucherId)
            {
                throw new AppHttpException(StatusCodes.Status409Conflict, "Voucher code already exists");
            }
        }

        private static void EnsureValidDateRange(DateTime startDate, DateTime endDate)
        {
            if (endDate < startDate)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "End date must be greater than or equal to start date");
            }
        }

        private static void EnsureUsageLimitIsNotExceeded(int usageLimit, int usedCount)
        {
            if (usageLimit < usedCount)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Usage limit cannot be less than used count");
            }
        }
    }
}
