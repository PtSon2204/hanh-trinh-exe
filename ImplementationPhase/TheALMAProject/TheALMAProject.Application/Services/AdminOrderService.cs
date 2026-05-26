using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Application.Services
{
    public class AdminOrderService : IAdminOrderService
    {
        private const int MaxFabricUploadItems = 50;
        private const int MaxGeneratedPngBytes = 5 * 1024 * 1024;
        private const string PngDataUrlPrefix = "data:image/png;base64,";

        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;
        private readonly IPrintFileRenderer _printFileRenderer;
        private readonly IEmailService _emailService;

        public AdminOrderService(
            IUnitOfWork unitOfWork, 
            IMapper mapper, 
            IFileStorageService fileStorageService, 
            IPrintFileRenderer printFileRenderer,
            IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _fileStorageService = fileStorageService;
            _printFileRenderer = printFileRenderer;
            _emailService = emailService;
        }

        public async Task<PagedResult<AdminOrderListDto>> GetOrders(PaginationParams query)
        {
            var result = await _unitOfWork.OrderRepo.GetAdminOrdersAsync(query);

            return new PagedResult<AdminOrderListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminOrderListDto>>(result.Data)
            };
        }

        public async Task<AdminOrderDto?> GetOrderById(int id)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                return null;
            }

            return _mapper.Map<AdminOrderDto>(order);
        }

        public async Task<IEnumerable<AdminOrderStatisticDto>> GetOrderStatistics(AdminOrderStatisticQuery query)
        {
            var groupBy = NormalizeGroupBy(query.GroupBy);
            var orders = await _unitOfWork.OrderRepo.GetAdminOrdersForStatisticsAsync(query);

            var groupedOrders = orders
                .Where(o => o.CreatedAt.HasValue)
                .GroupBy(o => GetPeriodKey(o.CreatedAt!.Value, groupBy))
                .OrderBy(g => g.Key.SortValue);

            var result = new List<AdminOrderStatisticDto>();
            foreach (var group in groupedOrders)
            {
                var itemCount = 0;
                var totalRevenue = 0m;
                var totalShippingFee = 0m;
                var totalDiscount = 0m;
                var totalSubTotal = 0m;

                foreach (var order in group)
                {
                    itemCount += order.OrderItems.Sum(i => i.Quantity);
                    totalRevenue += order.TotalAmount;
                    totalShippingFee += order.ShippingFee;
                    totalDiscount += order.DiscountAmount;
                    totalSubTotal += order.TotalAmount - order.ShippingFee + order.DiscountAmount;
                }

                result.Add(new AdminOrderStatisticDto
                {
                    Period = group.Key.Label,
                    OrderCount = group.Count(),
                    ItemCount = itemCount,
                    TotalRevenue = totalRevenue,
                    TotalShippingFee = totalShippingFee,
                    TotalDiscount = totalDiscount,
                    TotalSubTotal = totalSubTotal
                });
            }

            return result;
        }

        public async Task<IEnumerable<AdminOrderPrintFileDto>> ExportPrintFiles(int id)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "Order not found");
            }

            var designItems = order.OrderItems
                .Where(i => i.Design != null)
                .ToList();

            if (designItems.Count == 0)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Order has no custom design items to export");
            }

            var result = new List<AdminOrderPrintFileDto>();
            foreach (var item in designItems)
            {
                var design = item.Design!;
                var pngBytes = _printFileRenderer.GenerateOrderItemPrintPng(order, item, design);
                var fileNamePrefix = $"order-{order.OrderId}-item-{item.OrderItemId}-design-{design.DesignId}";

                design.PrintFileUrl = await SaveGeneratedPngAsync(pngBytes, $"{fileNamePrefix}-artwork.png", "uploads/print-files");
                design.PlacementGuideUrl = string.IsNullOrWhiteSpace(design.PreviewImageUrl)
                    ? await SaveGeneratedPngAsync(_printFileRenderer.GenerateOrderItemPlacementGuidePng(order, item, design), $"{fileNamePrefix}-guide.png", "uploads/placement-guides")
                    : design.PreviewImageUrl;

                result.Add(new AdminOrderPrintFileDto
                {
                    OrderId = order.OrderId,
                    OrderCode = order.OrderCode,
                    OrderItemId = item.OrderItemId,
                    DesignId = design.DesignId,
                    DesignName = design.DesignName,
                    Size = item.Size,
                    Quantity = item.Quantity,
                    PrintFileUrl = design.PrintFileUrl,
                    PlacementGuideUrl = design.PlacementGuideUrl
                });
            }

            _unitOfWork.OrderRepo.UpdateOrder(order);
            await _unitOfWork.SaveChangesAsync();

            return result;
        }

        public async Task<IEnumerable<AdminOrderPrintFileDto>> SaveFabricPrintFiles(int id, AdminOrderFabricPrintFileUploadDto dto)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "Order not found");
            }

            ValidateFabricPrintFileUpload(dto);

            var uploadItems = dto.Items.ToDictionary(i => i.OrderItemId);
            var designItems = order.OrderItems
                .Where(i => i.Design != null && uploadItems.ContainsKey(i.OrderItemId))
                .ToList();

            if (designItems.Count == 0)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "No matching custom design items to save");
            }

            if (designItems.Count != uploadItems.Count)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "All uploaded print files must match custom design items in this order");
            }

            var result = new List<AdminOrderPrintFileDto>();
            foreach (var item in designItems)
            {
                var design = item.Design!;
                var upload = uploadItems[item.OrderItemId];
                var fileNamePrefix = $"order-{order.OrderId}-item-{item.OrderItemId}-design-{design.DesignId}-fabric";

                design.PrintFileUrl = await SaveGeneratedPngAsync(ReadPngDataUrl(upload.ArtworkPngDataUrl, "artwork PNG"), $"{fileNamePrefix}-artwork.png", "uploads/print-files");
                design.PlacementGuideUrl = await SaveGeneratedPngAsync(ReadPngDataUrl(upload.PlacementGuidePngDataUrl, "placement guide PNG"), $"{fileNamePrefix}-guide.png", "uploads/placement-guides");

                result.Add(new AdminOrderPrintFileDto
                {
                    OrderId = order.OrderId,
                    OrderCode = order.OrderCode,
                    OrderItemId = item.OrderItemId,
                    DesignId = design.DesignId,
                    DesignName = design.DesignName,
                    Size = item.Size,
                    Quantity = item.Quantity,
                    PrintFileUrl = design.PrintFileUrl,
                    PlacementGuideUrl = design.PlacementGuideUrl
                });
            }

            _unitOfWork.OrderRepo.UpdateOrder(order);
            await _unitOfWork.SaveChangesAsync();

            return result;
        }

        public async Task UpdateOrderStatus(int id, AdminUpdateOrderStatusDto dto)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "Order not found");
            }

            bool wasRefunded = order.PaymentStatus == "Refunded";

            order.OrderStatus = dto.OrderStatus;
            order.PaymentStatus = dto.PaymentStatus;

            _unitOfWork.OrderRepo.UpdateOrder(order);
            await _unitOfWork.SaveChangesAsync();

            // Nếu trạng thái thanh toán chuyển sang Refunded (đã hoàn tiền)
            if (!wasRefunded && order.PaymentStatus == "Refunded")
            {
                try
                {
                    await _emailService.SendRefundNotificationAsync(order.User.Email, order.User.FullName, order.OrderCode, order.TotalAmount);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Admin Refund Email Error]: Lỗi gửi email thông báo hoàn tiền: {ex.Message}");
                }
            }
        }

        private async Task<string> SaveGeneratedPngAsync(byte[] pngBytes, string fileName, string folderName)
        {
            await using var stream = new MemoryStream(pngBytes);
            var formFile = new FormFile(stream, 0, pngBytes.Length, "file", fileName)
            {
                ContentType = "image/png"
            };

            return await _fileStorageService.SaveFileAsync(formFile, folderName);
        }

        private static void ValidateFabricPrintFileUpload(AdminOrderFabricPrintFileUploadDto dto)
        {
            if (dto?.Items == null || dto.Items.Count == 0)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "At least one Fabric print file is required");
            }

            if (dto.Items.Count > MaxFabricUploadItems)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"A maximum of {MaxFabricUploadItems} Fabric print files can be saved at once");
            }

            var orderItemIds = new HashSet<int>();
            foreach (var item in dto.Items)
            {
                if (item.OrderItemId <= 0)
                {
                    throw new AppHttpException(StatusCodes.Status400BadRequest, "Order item id is required for every Fabric print file");
                }

                if (!orderItemIds.Add(item.OrderItemId))
                {
                    throw new AppHttpException(StatusCodes.Status400BadRequest, "Duplicate Fabric print file order item id");
                }

                ValidatePngDataUrlShape(item.ArtworkPngDataUrl, "artwork PNG");
                ValidatePngDataUrlShape(item.PlacementGuidePngDataUrl, "placement guide PNG");
            }
        }

        private static void ValidatePngDataUrlShape(string? dataUrl, string label)
        {
            if (string.IsNullOrWhiteSpace(dataUrl) || !dataUrl.StartsWith(PngDataUrlPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} data URL is required");
            }

            var base64Length = dataUrl.Length - PngDataUrlPrefix.Length;
            if (base64Length <= 0)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} data URL is required");
            }

            var padding = dataUrl.EndsWith("==", StringComparison.Ordinal) ? 2 : dataUrl.EndsWith("=", StringComparison.Ordinal) ? 1 : 0;
            var estimatedBytes = (base64Length * 3 / 4) - padding;
            if (estimatedBytes > MaxGeneratedPngBytes)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} must be 5MB or smaller");
            }
        }

        private static byte[] ReadPngDataUrl(string dataUrl, string label)
        {
            ValidatePngDataUrlShape(dataUrl, label);

            byte[] bytes;
            try
            {
                bytes = Convert.FromBase64String(dataUrl[PngDataUrlPrefix.Length..]);
            }
            catch (FormatException)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} data URL is not valid base64");
            }

            if (bytes.Length == 0 || bytes.Length > MaxGeneratedPngBytes)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} must be 5MB or smaller");
            }

            if (!HasPngSignature(bytes))
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, $"{label} must be a valid PNG image");
            }

            return bytes;
        }

        private static bool HasPngSignature(byte[] bytes)
        {
            return bytes.Length >= 8
                && bytes[0] == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A;
        }

        private static string NormalizeGroupBy(string? groupBy)
        {
            return groupBy?.Trim().ToLowerInvariant() switch
            {
                "day" => "day",
                "week" => "week",
                "month" => "month",
                _ => "month"
            };
        }

        private static (string Label, DateTime SortValue) GetPeriodKey(DateTime date, string groupBy)
        {
            return groupBy switch
            {
                "day" => (date.ToString("yyyy-MM-dd"), date.Date),
                "week" => ($"{date.Year}-W{GetWeekOfYear(date):00}", date.Date.AddDays(-(int)date.DayOfWeek)),
                _ => (date.ToString("yyyy-MM"), new DateTime(date.Year, date.Month, 1))
            };
        }

        private static int GetWeekOfYear(DateTime date)
        {
            return System.Globalization.ISOWeek.GetWeekOfYear(date);
        }
    }
}
