using System;

namespace DoAn_CSharp.Models.Entities
{
    public class Owner
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string DefaultLanguage { get; set; } = "en";
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();

        // Owner properties
        public string OwnerStatus { get; set; } = "pending_payment"; // pending_payment, pending, approved, rejected
        public string? AdminNote { get; set; }
        public bool IsPaid { get; set; } = false;
        public DateTime? PaidAt { get; set; }
    }
}
