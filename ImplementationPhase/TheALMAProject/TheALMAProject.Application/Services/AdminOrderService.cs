using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Application.DTOs.AdminStatisticsDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Application.Services
{
    public class AdminOrderService : IAdminOrderService
    {
        private const int MaxFabricUploadItems = 50;
        private const int MaxGeneratedPngBytes = 5 * 1024 * 1024;
        private const string PngDataUrlPrefix = "data:image/png;base64,";
        private static readonly HashSet<string> ProductionStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Pending",
            "Processing",
            "Printing"
        };
        private static readonly HashSet<string> ShippingStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Shipping"
        };
        private static readonly HashSet<string> FinalOrderStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "Delivered",
            "Completed",
            "Cancelled"
        };

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

        public async Task<AdminOperationStatisticsDto> GetOperationStatistics(AdminOrderStatisticQuery query)
        {
            var dateRangeQuery = new AdminOrderStatisticQuery
            {
                FromDate = query.FromDate,
                ToDate = query.ToDate,
                GroupBy = query.GroupBy
            };
            var orders = await _unitOfWork.OrderRepo.GetAdminOrdersForStatisticsAsync(dateRangeQuery);

            var totalOrders = orders.Count;
            var totalItems = orders.Sum(GetOrderItemCount);
            var totalRevenue = orders.Sum(order => order.TotalAmount);
            var ordersNeedingProduction = orders.Count(order => ProductionStatuses.Contains(order.OrderStatus));
            var ordersNeedingShipping = orders.Count(order => ShippingStatuses.Contains(order.OrderStatus));
            var customItemsNeedingExport = orders
                .SelectMany(order => order.OrderItems)
                .Where(item => item.DesignId.HasValue)
                .Sum(item => IsCustomItemMissingExport(item) ? item.Quantity : 0);

            return new AdminOperationStatisticsDto
            {
                TotalOrders = totalOrders,
                TotalItems = totalItems,
                TotalRevenue = totalRevenue,
                OrderStatusBreakdown = BuildStatusBreakdown(orders, order => order.OrderStatus),
                PaymentStatusBreakdown = BuildStatusBreakdown(orders, order => order.PaymentStatus),
                AgingBuckets = BuildAgingBuckets(orders),
                Exceptions = BuildOperationalExceptions(orders, customItemsNeedingExport),
                OrdersNeedingProduction = ordersNeedingProduction,
                OrdersNeedingShipping = ordersNeedingShipping,
                CustomItemsNeedingExport = customItemsNeedingExport
            };
        }

        public async Task<AdminProductStatisticsDto> GetProductStatistics(AdminOrderStatisticQuery query)
        {
            var groupBy = NormalizeGroupBy(query.GroupBy);
            var orders = await _unitOfWork.OrderRepo.GetAdminOrdersForStatisticsAsync(query);
            var orderItems = orders
                .SelectMany(order => order.OrderItems.Select(item => new ProductStatisticItem(
                    order,
                    item,
                    item.Quantity * item.UnitPrice,
                    item.DesignId.HasValue)))
                .ToList();

            var customItems = orderItems.Where(item => item.IsCustom).ToList();
            var readyMadeItems = orderItems.Where(item => !item.IsCustom).ToList();

            return new AdminProductStatisticsDto
            {
                TotalItemsSold = orderItems.Sum(item => item.Item.Quantity),
                TotalOrders = orders.Count,
                CustomItemCount = customItems.Sum(item => item.Item.Quantity),
                ReadyMadeItemCount = readyMadeItems.Sum(item => item.Item.Quantity),
                CustomRevenue = customItems.Sum(item => item.Revenue),
                ReadyMadeRevenue = readyMadeItems.Sum(item => item.Revenue),
                TopStoreProducts = BuildTopStoreProducts(orderItems),
                TopBaseProducts = BuildTopBaseProducts(orderItems),
                TopUniversities = BuildTopUniversities(orderItems),
                CustomizationTrend = BuildCustomizationTrend(orderItems, groupBy)
            };
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
                design.PlacementGuideUrl = await SaveGeneratedPngAsync(
                    _printFileRenderer.GenerateOrderItemPlacementGuidePng(order, item, design),
                    $"{fileNamePrefix}-guide.png",
                    "uploads/placement-guides");

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

        private static List<AdminStatusBreakdownDto> BuildStatusBreakdown(
            IEnumerable<Order> orders,
            Func<Order, string> statusSelector)
        {
            return orders
                .GroupBy(statusSelector, StringComparer.OrdinalIgnoreCase)
                .Select(group => new AdminStatusBreakdownDto
                {
                    Status = group.Key,
                    OrderCount = group.Count(),
                    ItemCount = group.Sum(GetOrderItemCount),
                    Revenue = group.Sum(order => order.TotalAmount)
                })
                .OrderByDescending(item => item.OrderCount)
                .ThenBy(item => item.Status)
                .ToList();
        }

        private static List<AdminAgingBucketDto> BuildAgingBuckets(IEnumerable<Order> orders)
        {
            var now = DateTime.Now;
            var activeOrders = orders
                .Where(order => order.CreatedAt.HasValue && !FinalOrderStatuses.Contains(order.OrderStatus))
                .ToList();

            return new List<AdminAgingBucketDto>
            {
                new()
                {
                    Label = "0-1 ngày",
                    OrderCount = activeOrders.Count(order => GetOrderAgeInDays(order, now) <= 1)
                },
                new()
                {
                    Label = "2-3 ngày",
                    OrderCount = activeOrders.Count(order => GetOrderAgeInDays(order, now) >= 2 && GetOrderAgeInDays(order, now) <= 3)
                },
                new()
                {
                    Label = "4-7 ngày",
                    OrderCount = activeOrders.Count(order => GetOrderAgeInDays(order, now) >= 4 && GetOrderAgeInDays(order, now) <= 7)
                },
                new()
                {
                    Label = "Trên 7 ngày",
                    OrderCount = activeOrders.Count(order => GetOrderAgeInDays(order, now) > 7)
                }
            };
        }

        private static int GetOrderItemCount(Order order)
        {
            return order.OrderItems.Sum(item => item.Quantity);
        }

        private sealed record ProductStatisticItem(Order Order, OrderItem Item, decimal Revenue, bool IsCustom);

        private static List<AdminTopProductDto> BuildTopStoreProducts(IEnumerable<ProductStatisticItem> orderItems)
        {
            return orderItems
                .GroupBy(item => new
                {
                    item.Item.ProductId,
                    ProductName = item.Item.Product?.Name ?? item.Item.Design?.DesignName ?? "Sản phẩm tùy chỉnh",
                    UniversityName = item.Item.Product?.University?.Name
                })
                .Select(group => new AdminTopProductDto
                {
                    ProductId = group.Key.ProductId,
                    ProductName = group.Key.ProductName,
                    UniversityName = group.Key.UniversityName,
                    QuantitySold = group.Sum(item => item.Item.Quantity),
                    OrderCount = group.Select(item => item.Order.OrderId).Distinct().Count(),
                    Revenue = group.Sum(item => item.Revenue),
                    CustomItemCount = group.Where(item => item.IsCustom).Sum(item => item.Item.Quantity)
                })
                .OrderByDescending(item => item.QuantitySold)
                .ThenByDescending(item => item.Revenue)
                .Take(10)
                .ToList();
        }

        private static List<AdminTopBaseProductDto> BuildTopBaseProducts(IEnumerable<ProductStatisticItem> orderItems)
        {
            return orderItems
                .GroupBy(item => new
                {
                    BaseProductId = item.Item.Product?.BaseProductId ?? item.Item.Design?.BaseProductId,
                    BaseProductName = item.Item.Product?.BaseProduct?.Name ?? item.Item.Design?.BaseProduct?.Name ?? "Chưa xác định",
                    Category = item.Item.Product?.BaseProduct?.Category ?? item.Item.Design?.BaseProduct?.Category
                })
                .Select(group => new AdminTopBaseProductDto
                {
                    BaseProductId = group.Key.BaseProductId,
                    BaseProductName = group.Key.BaseProductName,
                    Category = group.Key.Category,
                    QuantitySold = group.Sum(item => item.Item.Quantity),
                    OrderCount = group.Select(item => item.Order.OrderId).Distinct().Count(),
                    Revenue = group.Sum(item => item.Revenue)
                })
                .OrderByDescending(item => item.QuantitySold)
                .ThenByDescending(item => item.Revenue)
                .Take(10)
                .ToList();
        }

        private static List<AdminTopUniversityDto> BuildTopUniversities(IEnumerable<ProductStatisticItem> orderItems)
        {
            return orderItems
                .Where(item => item.Item.Product?.UniversityId != null)
                .GroupBy(item => new
                {
                    item.Item.Product!.UniversityId,
                    UniversityName = item.Item.Product!.University?.Name ?? "Chưa xác định"
                })
                .Select(group => new AdminTopUniversityDto
                {
                    UniversityId = group.Key.UniversityId,
                    UniversityName = group.Key.UniversityName,
                    QuantitySold = group.Sum(item => item.Item.Quantity),
                    OrderCount = group.Select(item => item.Order.OrderId).Distinct().Count(),
                    Revenue = group.Sum(item => item.Revenue)
                })
                .OrderByDescending(item => item.QuantitySold)
                .ThenByDescending(item => item.Revenue)
                .Take(10)
                .ToList();
        }

        private static List<AdminCustomizationTrendDto> BuildCustomizationTrend(IEnumerable<ProductStatisticItem> orderItems, string groupBy)
        {
            return orderItems
                .Where(item => item.Order.CreatedAt.HasValue)
                .GroupBy(item => GetPeriodKey(item.Order.CreatedAt!.Value, groupBy))
                .OrderBy(group => group.Key.SortValue)
                .Select(group => new AdminCustomizationTrendDto
                {
                    Period = group.Key.Label,
                    CustomItemCount = group.Where(item => item.IsCustom).Sum(item => item.Item.Quantity),
                    ReadyMadeItemCount = group.Where(item => !item.IsCustom).Sum(item => item.Item.Quantity),
                    CustomRevenue = group.Where(item => item.IsCustom).Sum(item => item.Revenue),
                    ReadyMadeRevenue = group.Where(item => !item.IsCustom).Sum(item => item.Revenue)
                })
                .ToList();
        }

        private static List<AdminOperationalExceptionDto> BuildOperationalExceptions(
            IEnumerable<Order> orders,
            int customItemsNeedingExport)
        {
            var orderList = orders.ToList();
            var now = DateTime.Now;
            var oldActiveOrderCount = orderList.Count(order =>
                order.CreatedAt.HasValue
                && !FinalOrderStatuses.Contains(order.OrderStatus)
                && GetOrderAgeInDays(order, now) > 7);
            var unpaidOrderCount = orderList.Count(order => order.PaymentStatus.Equals("Pending", StringComparison.OrdinalIgnoreCase));
            var failedPaymentCount = orderList.Count(order => order.PaymentStatus.Equals("Failed", StringComparison.OrdinalIgnoreCase));
            var refundedOrderCount = orderList.Count(order => order.PaymentStatus.Equals("Refunded", StringComparison.OrdinalIgnoreCase));
            var cancelledOrderCount = orderList.Count(order => order.OrderStatus.Equals("Cancelled", StringComparison.OrdinalIgnoreCase));

            return new List<AdminOperationalExceptionDto>
            {
                new()
                {
                    Label = "Đơn đang xử lý quá 7 ngày",
                    Count = oldActiveOrderCount,
                    Severity = oldActiveOrderCount > 0 ? "danger" : "info"
                },
                new()
                {
                    Label = "Đơn chờ thanh toán",
                    Count = unpaidOrderCount,
                    Severity = unpaidOrderCount > 0 ? "warning" : "info"
                },
                new()
                {
                    Label = "Thanh toán lỗi",
                    Count = failedPaymentCount,
                    Severity = failedPaymentCount > 0 ? "danger" : "info"
                },
                new()
                {
                    Label = "Đơn đã hoàn tiền",
                    Count = refundedOrderCount,
                    Severity = refundedOrderCount > 0 ? "warning" : "info"
                },
                new()
                {
                    Label = "Đơn đã hủy",
                    Count = cancelledOrderCount,
                    Severity = cancelledOrderCount > 0 ? "warning" : "info"
                },
                new()
                {
                    Label = "Sản phẩm tùy chỉnh thiếu file in",
                    Count = customItemsNeedingExport,
                    Severity = customItemsNeedingExport > 0 ? "danger" : "info"
                }
            };
        }

        private static int GetOrderAgeInDays(Order order, DateTime now)
        {
            return order.CreatedAt.HasValue ? Math.Max(0, (now.Date - order.CreatedAt.Value.Date).Days) : 0;
        }

        private static bool IsCustomItemMissingExport(OrderItem item)
        {
            return item.Design == null
                || string.IsNullOrWhiteSpace(item.Design.PrintFileUrl)
                || string.IsNullOrWhiteSpace(item.Design.PlacementGuideUrl);
        }

        private async Task<string> SaveGeneratedPngAsync(byte[] pngBytes, string fileName, string folderName)
        {
            await using var stream = new MemoryStream(pngBytes);
            var formFile = new FormFile(stream, 0, pngBytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
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
