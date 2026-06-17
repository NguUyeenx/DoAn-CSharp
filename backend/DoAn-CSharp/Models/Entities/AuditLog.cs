using System;

namespace DoAn_CSharp.Models.Entities
{
    public class AuditLog
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserRole { get; set; } = string.Empty; // admin, owner
        public string Action { get; set; } = string.Empty; // ApproveOwner, DeletePOI, etc.
        public string EntityName { get; set; } = string.Empty; // Owner, POI, Menu
        public int? EntityId { get; set; }
        public string Details { get; set; } = string.Empty; // JSON or text
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
