using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Application.DTOs.PaymentDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper; 
        private readonly IVietQrService _vietQrService;
        private readonly IVnPayService _vnPayService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrderService(IUnitOfWork unitOfWork, IMapper mapper, IVietQrService vietQrService, IVnPayService vnPayService, IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _vietQrService = vietQrService;
            _httpContextAccessor = httpContextAccessor;
            _vnPayService = vnPayService;
        }

        public async Task<PagedResult<OrderResponseDto>> GetUserOrdersAsync(int userId, OrderQuery query)
        {
            var pagedOrders = await _unitOfWork.OrderRepo.GetOrdersByUserIdAsync(userId, query);

            var dtoList = _mapper.Map<List<OrderResponseDto>>(pagedOrders.Data);

            return new PagedResult<OrderResponseDto>
            {
                Data = dtoList,
                PageNumber = pagedOrders.PageNumber,
                PageSize = pagedOrders.PageSize,
                TotalRecords = pagedOrders.TotalRecords,
                TotalPages = pagedOrders.TotalPages
            };
        }

        public async Task<OrderDetailResponseDto?> GetOrderDetailAsync(int userId, int orderId)
        {
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, userId);

            if (order == null) return null;

            return _mapper.Map<OrderDetailResponseDto>(order);
        }

        public async Task<CheckoutResponseDto> CheckoutAsync(int userId, CheckoutRequestDto request)
        {
            // 1. Lấy giỏ hàng của User
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);

            if (cart == null || !cart.CartItems.Any())
            {
                return new CheckoutResponseDto { IsSuccess = false, Message = "Giỏ hàng của bạn đang trống." };
            }

            // 2. Tính toán tiền hàng (SubTotal)
            decimal subTotal = cart.CartItems.Sum(item => item.UnitPrice * item.Quantity);
            decimal shippingFee = 30000; // Phí ship mặc định (Bạn có thể viết logic tính phí theo ShipProvince)
            decimal discountAmount = 0;
            Voucher? appliedVoucher = null;

            // 3. Xử lý Voucher (Nếu khách có nhập mã)
            if (!string.IsNullOrEmpty(request.VoucherCode))
            {
                appliedVoucher = await _unitOfWork.VoucherRepo.GetByCode(request.VoucherCode);

                if (appliedVoucher == null || !appliedVoucher.IsActive || appliedVoucher.StartDate > DateTime.UtcNow || appliedVoucher.EndDate < DateTime.UtcNow)
                    return new CheckoutResponseDto { IsSuccess = false, Message = "Mã giảm giá không tồn tại hoặc đã hết hạn." };

                if (subTotal < appliedVoucher.MinOrderAmount)
                    return new CheckoutResponseDto { IsSuccess = false, Message = $"Đơn hàng tối thiểu phải đạt {appliedVoucher.MinOrderAmount:N0}đ để dùng mã này." };

                if (appliedVoucher.UsedCount >= appliedVoucher.UsageLimit)
                    return new CheckoutResponseDto { IsSuccess = false, Message = "Mã giảm giá đã hết lượt sử dụng." };

                // Tính tiền giảm (Hỗ trợ Freeship nếu mã chứa FREESHIP)
                if (appliedVoucher.Code.StartsWith("FREESHIP", StringComparison.OrdinalIgnoreCase) || appliedVoucher.Code.Contains("FREESHIP", StringComparison.OrdinalIgnoreCase))
                {
                    discountAmount = shippingFee;
                }
                else
                {
                    discountAmount = subTotal * (appliedVoucher.DiscountPercent / 100);
                    if (discountAmount > appliedVoucher.MaxDiscount) discountAmount = appliedVoucher.MaxDiscount; // Không vượt quá mức trần
                }
            }

            // 4. Tính Tổng tiền cuối cùng
            decimal totalAmount = subTotal + shippingFee - discountAmount;

            // 5. Khởi tạo Order
            var newOrder = new Order
            {
                UserId = userId,
                OrderCode = "ALMA-" + DateTime.Now.ToString("yyyyMMddHHmmss"), // Tạo mã đơn duy nhất
                TotalAmount = totalAmount,
                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                VoucherId = appliedVoucher?.VoucherId,
                ShipName = request.ShipName,
                ShipPhone = request.ShipPhone,
                ShipAddress = request.ShipAddress,
                ShipProvince = request.ShipProvince,
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = "Unpaid", // Chưa thanh toán
                OrderStatus = "Pending",  // Chờ xác nhận
                CreatedAt = DateTime.UtcNow
            };

            // 6. Chuyển CartItem sang OrderItem
            foreach (var cartItem in cart.CartItems)
            {
                newOrder.OrderItems.Add(new OrderItem
                {
                    ProductId = cartItem.ProductId,
                    DesignId = cartItem.DesignId,
                    Size = cartItem.Size,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.UnitPrice
                });

                // NẾU LÀ ÁO TỰ THIẾT KẾ: Khóa bản thiết kế lại, không cho user xóa nữa
                if (cartItem.DesignId.HasValue)
                {
                    var userDesign = await _unitOfWork.UserDesignRepo.GetByIdForOwnerAsync(cartItem.DesignId.Value, userId);
                    if (userDesign != null)
                    {
                        userDesign.IsOrdered = true;
                        // Repository Update sẽ được gọi ngầm khi SaveChanges nếu entity đã được track
                    }
                }
            }

            // 7. Cập nhật số lượt dùng Voucher (Nếu có)
            if (appliedVoucher != null)
            {
                appliedVoucher.UsedCount++;
                _unitOfWork.VoucherRepo.UpdateVoucher(appliedVoucher);
            }

            // 8. XÓA GIỎ HÀNG (Quan trọng)
            foreach (var item in cart.CartItems.ToList())
            {
                _unitOfWork.CartRepo.DeleteCartItemAsync(item);
            }

            // 9. Lưu tất cả vào Database (Transaction)
            await _unitOfWork.OrderRepo.AddAsync(newOrder); // Giả sử có hàm AddAsync trong IOrderRepository
            var saved = await _unitOfWork.SaveChangesAsync() > 0;

            if (!saved) return new CheckoutResponseDto { IsSuccess = false, Message = "Có lỗi xảy ra khi tạo đơn hàng." };

            // 10. Xử lý sau khi lưu (Chuyển hướng thanh toán)
            if (request.PaymentMethod == "VNPAY")
            {
                // Cần inject HttpContextAccessor vào OrderService để lấy HttpContext truyền cho VNPay lấy IP
                var paymentUrl = _vnPayService.CreatePaymentUrl(new PaymentInformationModel
                {
                    OrderCode = newOrder.OrderCode,
                    Amount = (double)newOrder.TotalAmount,
                    OrderDescription = $"Thanh toan don hang {newOrder.OrderCode}",
                    Name = newOrder.ShipName
                }, _httpContextAccessor.HttpContext);

                return new CheckoutResponseDto
                {
                    IsSuccess = true,
                    OrderId = newOrder.OrderId,
                    Message = "Chuyển hướng đến VNPay",
                    PaymentUrl = paymentUrl // Trả URL thật về cho Frontend redirect
                };
            }
            else if (request.PaymentMethod == "VIETQR")
            {
                var qrImageUrl = _vietQrService.GenerateQrImageUrl(new PaymentInformationModel
                {
                    OrderCode = newOrder.OrderCode,
                    Amount = (double)newOrder.TotalAmount,
                    // Cực kỳ quan trọng: Nội dung CK nên ngắn gọn và chứa chính xác OrderCode
                    OrderDescription = newOrder.OrderCode,
                    Name = newOrder.ShipName
                });

                return new CheckoutResponseDto
                {
                    IsSuccess = true,
                    OrderId = newOrder.OrderId,
                    Message = "Tạo mã VietQR thành công",
                    // Lợi dụng trường PaymentUrl để chứa link ảnh QR luôn, Frontend tự nhận diện để in ra ảnh
                    PaymentUrl = qrImageUrl
                };
            }

            // Trả về cho COD
            return new CheckoutResponseDto { IsSuccess = true, OrderId = newOrder.OrderId, Message = "Đặt hàng thành công!" };
        }

        public async Task<bool> ChangePaymentMethodAsync(int userId, int orderId, string paymentMethod)
        {
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, userId);
            if (order == null || order.OrderStatus != "Pending")
            {
                return false;
            }

            order.PaymentMethod = paymentMethod;
            _unitOfWork.OrderRepo.UpdateOrder(order);
            return await _unitOfWork.SaveChangesAsync() > 0;
        }

        public async Task<VoucherCheckResponseDto> CheckVoucherAsync(int userId, string voucherCode)
        {
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);
            if (cart == null || !cart.CartItems.Any())
            {
                return new VoucherCheckResponseDto { IsValid = false, Message = "Giỏ hàng của bạn đang trống." };
            }

            decimal subTotal = cart.CartItems.Sum(item => item.UnitPrice * item.Quantity);
            decimal shippingFee = 30000;

            var voucher = await _unitOfWork.VoucherRepo.GetByCode(voucherCode);
            if (voucher == null || !voucher.IsActive || voucher.StartDate > DateTime.UtcNow || voucher.EndDate < DateTime.UtcNow)
            {
                return new VoucherCheckResponseDto { IsValid = false, Message = "Mã giảm giá không tồn tại hoặc đã hết hạn." };
            }

            if (subTotal < voucher.MinOrderAmount)
            {
                return new VoucherCheckResponseDto { IsValid = false, Message = $"Đơn hàng tối thiểu phải đạt {voucher.MinOrderAmount:N0}đ để dùng mã này." };
            }

            if (voucher.UsedCount >= voucher.UsageLimit)
            {
                return new VoucherCheckResponseDto { IsValid = false, Message = "Mã giảm giá đã hết lượt sử dụng." };
            }

            decimal discountAmount = 0;
            bool isFreeShipping = false;

            if (voucher.Code.StartsWith("FREESHIP", StringComparison.OrdinalIgnoreCase) || voucher.Code.Contains("FREESHIP", StringComparison.OrdinalIgnoreCase))
            {
                discountAmount = shippingFee;
                isFreeShipping = true;
            }
            else
            {
                discountAmount = subTotal * (voucher.DiscountPercent / 100);
                if (discountAmount > voucher.MaxDiscount) discountAmount = voucher.MaxDiscount;
            }

            return new VoucherCheckResponseDto
            {
                IsValid = true,
                Message = isFreeShipping ? "Áp dụng mã miễn phí vận chuyển thành công!" : $"Áp dụng mã giảm giá thành công! Giảm {discountAmount:N0}đ.",
                DiscountAmount = discountAmount,
                IsFreeShipping = isFreeShipping
            };
        }

        public async Task<bool> CancelOrderAsync(int userId, int orderId)
        {
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, userId);
            if (order == null || order.OrderStatus != "Pending")
            {
                return false;
            }

            order.OrderStatus = "Cancelled";
            _unitOfWork.OrderRepo.UpdateOrder(order);
            return await _unitOfWork.SaveChangesAsync() > 0;
        }

        public async Task<bool> UpdateShippingAddressAsync(int userId, int orderId, UpdateShippingAddressDto request)
        {
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, userId);
            if (order == null || order.OrderStatus != "Pending")
            {
                return false;
            }

            order.ShipName = request.ShipName;
            order.ShipPhone = request.ShipPhone;
            order.ShipAddress = request.ShipAddress;
            order.ShipProvince = request.ShipProvince;

            _unitOfWork.OrderRepo.UpdateOrder(order);
            return await _unitOfWork.SaveChangesAsync() > 0;
        }
    }
}
