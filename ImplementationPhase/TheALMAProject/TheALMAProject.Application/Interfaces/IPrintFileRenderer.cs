using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Interfaces
{
    public interface IPrintFileRenderer
    {
        byte[] GenerateOrderItemPrintPng(Order order, OrderItem item, UserDesign design);
        byte[] GenerateOrderItemPlacementGuidePng(Order order, OrderItem item, UserDesign design);
    }
}
