using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IPOIService
    {
        Task<IEnumerable<POIListDto>> GetAllAsync(string? category, string lang);
        Task<POIDto?> GetByIdAsync(int id, string lang);
        Task<POIDto?> GetBySlugAsync(string slug, string lang);
        Task<IEnumerable<POIListDto>> GetNearbyAsync(double lat, double lng, int radiusMeters, string lang);
        Task<IEnumerable<POIListDto>> SearchAsync(string query, string lang);
        Task<POIDto> CreateAsync(POICreateDto dto, int? ownerId = null);
        Task<IEnumerable<POIListDto>> GetByOwnerAsync(int ownerId, string lang);
        Task<bool> UpdateApprovalStatusAsync(int id, string status);
        Task<POIDto?> UpdateAsync(int id, POIUpdateDto dto);
        Task<bool> DeleteAsync(int id);   // Soft delete
        Task<bool> RestoreAsync(int id);  // Restore soft delete
    }
}
