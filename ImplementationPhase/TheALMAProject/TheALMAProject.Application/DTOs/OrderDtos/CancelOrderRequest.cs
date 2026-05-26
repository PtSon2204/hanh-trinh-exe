namespace TheALMAProject.Application.DTOs.OrderDtos
{
    public class CancelOrderRequest
    {
        public string? RefundBankName { get; set; }
        public string? RefundAccountNumber { get; set; }
        public string? RefundAccountName { get; set; }
    }
}
