using AutoMapper;
using TheALMAProject.Application.DTOs.NotificationDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    /// <summary>
    /// UC-40: Service xử lý toàn bộ logic Notifications
    /// - Lấy danh sách, đếm chưa đọc, đánh dấu đã đọc
    /// - Admin tạo notification
    /// - Tự động notify khi có đơn mới (tạo notification + gửi email)
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public NotificationService(IUnitOfWork unitOfWork, IMapper mapper, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _emailService = emailService;
        }

        /// <summary>
        /// Lấy danh sách notifications của user (phân trang + filter)
        /// </summary>
        public async Task<PagedResult<NotificationResponseDto>> GetMyNotificationsAsync(int userId, NotificationQuery query)
        {
            var result = await _unitOfWork.NotificationRepo.GetNotificationsByUserIdAsync(userId, query);

            return new PagedResult<NotificationResponseDto>
            {
                Data = _mapper.Map<IEnumerable<NotificationResponseDto>>(result.Data),
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages
            };
        }

        /// <summary>
        /// Lấy số notifications chưa đọc (cho bell icon)
        /// </summary>
        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _unitOfWork.NotificationRepo.GetUnreadCountAsync(userId);
        }

        /// <summary>
        /// Đánh dấu 1 notification đã đọc
        /// Kiểm tra notification thuộc về user hiện tại
        /// </summary>
        public async Task MarkAsReadAsync(int userId, int notificationId)
        {
            var notification = await _unitOfWork.NotificationRepo.GetByIdAsync(notificationId);

            if (notification == null)
                throw new Exception("Không tìm thấy thông báo.");

            if (notification.UserId != userId)
                throw new Exception("Bạn không có quyền truy cập thông báo này.");

            if (!notification.IsRead)
            {
                _unitOfWork.NotificationRepo.MarkAsRead(notification);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Đánh dấu tất cả notifications đã đọc
        /// </summary>
        public async Task MarkAllAsReadAsync(int userId)
        {
            await _unitOfWork.NotificationRepo.MarkAllAsReadAsync(userId);
        }

        /// <summary>
        /// Admin tạo notification thủ công cho user
        /// </summary>
        public async Task CreateNotificationAsync(CreateNotificationDto dto)
        {
            // Kiểm tra user tồn tại
            var user = await _unitOfWork.UserRepo.GetById(dto.UserId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");

            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false,
                CreatedAt = DateTime.Now
            };

            await _unitOfWork.NotificationRepo.AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Tự động notify khi có đơn hàng mới:
        /// 1. Tạo notification cho tất cả Admin/OrderMgr
        /// 2. Gửi email xác nhận đơn hàng cho khách
        /// </summary>
        public async Task NotifyNewOrderAsync(int orderId)
        {
            // Lấy thông tin đơn hàng
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, 0);
            if (order == null) return;

            var customer = await _unitOfWork.UserRepo.GetById(order.UserId);
            if (customer == null) return;

            // 1. Gửi email xác nhận cho khách
            await _emailService.SendOrderConfirmationAsync(
                customer.Email,
                customer.FullName,
                order.OrderCode,
                order.TotalAmount);

            // 2. Tạo notification cho khách
            var customerNotification = new Notification
            {
                UserId = customer.UserId,
                Title = "Đặt hàng thành công!",
                Message = $"Đơn hàng #{order.OrderCode} đã được đặt thành công. Tổng tiền: {order.TotalAmount:N0} VNĐ.",
                Type = "Order",
                IsRead = false,
                CreatedAt = DateTime.Now
            };
            await _unitOfWork.NotificationRepo.AddAsync(customerNotification);

            // 3. Tạo notification cho Admin (thông báo đơn mới)
            // Lấy danh sách admin users
            var adminQuery = new Domain.Queries.AdminUserQuery { Role = "Admin", PageSize = 50 };
            var admins = await _unitOfWork.UserRepo.GetAdminUsers(adminQuery);

            foreach (var admin in admins.Data)
            {
                var adminNotification = new Notification
                {
                    UserId = admin.UserId,
                    Title = "🔔 Đơn hàng mới!",
                    Message = $"Đơn hàng #{order.OrderCode} từ {customer.FullName}. Tổng tiền: {order.TotalAmount:N0} VNĐ.",
                    Type = "NewOrder",
                    IsRead = false,
                    CreatedAt = DateTime.Now
                };
                await _unitOfWork.NotificationRepo.AddAsync(adminNotification);

                // Gửi email cho admin
                await _emailService.SendNewOrderNotificationAsync(
                    admin.Email,
                    order.OrderCode,
                    order.TotalAmount);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Gửi email thông báo/marketing cho danh sách user cụ thể hoặc toàn bộ user
        /// </summary>
        public async Task SendEmailNotificationAsync(SendEmailNotificationDto dto)
        {
            if (dto.Emails != null && dto.Emails.Count > 0)
            {
                // Gửi cho danh sách người cụ thể
                foreach (var email in dto.Emails)
                {
                    if (string.IsNullOrEmpty(email)) continue;
                    
                    var user = await _unitOfWork.UserRepo.GetUserByEmail(email);
                    if (user != null)
                    {
                        try 
                        {
                            await _emailService.SendEmailAsync(user.Email, dto.Subject, dto.Body);
                        }
                        catch 
                        {
                            // Tiếp tục gửi cho những người khác
                        }
                    }
                }
            }
            else
            {
                // Gửi cho toàn bộ hệ thống (Lấy theo Page để không bị over-memory)
                int pageIndex = 1;
                int pageSize = 50; // Xử lý batch 50 user 1 lần (tuy nhiên PaginationParams MaxPageSize là 50)
                PagedResult<User> pagedUsers;
                
                do
                {
                    var query = new UserQuery { PageNumber = pageIndex, PageSize = pageSize };
                    pagedUsers = await _unitOfWork.UserRepo.GetUsers(query);

                    foreach (var user in pagedUsers.Data)
                    {
                        if (user.IsActive && !string.IsNullOrEmpty(user.Email))
                        {
                            // Cân nhắc dùng background job (Hangfire/RabbitMQ) cho production
                            try 
                            {
                                await _emailService.SendEmailAsync(user.Email, dto.Subject, dto.Body);
                            } 
                            catch 
                            {
                                // Log lỗi nếu cần, tiếp tục gửi cho người khác
                            }
                        }
                    }

                    pageIndex++;
                } while (pageIndex <= pagedUsers.TotalPages);
            }
        }
    }
}
