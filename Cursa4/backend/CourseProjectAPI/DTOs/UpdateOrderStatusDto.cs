using System.ComponentModel.DataAnnotations;

namespace CourseProjectAPI.DTOs
{
    public class UpdateOrderStatusDto
    {
        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = string.Empty;
        
        public string? Notes { get; set; }
    }
}
