using System;

namespace DoAn_CSharp.Models.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public Owner? Owner { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // OwnerApproved, OwnerRejected, POIApproved, POIRejected, POIUpdated, System
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
