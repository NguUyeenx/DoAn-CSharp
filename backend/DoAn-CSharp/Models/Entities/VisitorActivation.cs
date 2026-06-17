using System;

namespace DoAn_CSharp.Models.Entities
{
    public class VisitorActivation
    {
        public int Id { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public DateTime ActivatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsPaid { get; set; }
        public decimal AmountPaid { get; set; }
        public string? CardNumberMasked { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
