using System;
using System.ComponentModel.DataAnnotations;

namespace DoAn_CSharp.Models.DTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int POIId { get; set; }
        public string VisitorName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateReviewDto
    {
        [Required]
        [StringLength(100)]
        public string VisitorName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string VisitorPhone { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        [StringLength(1000)]
        public string? Comment { get; set; }
    }
}
