using System.Collections.Generic;
using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IPOIService
    {
        Task<IEnumerable<POIListDto>> GetAllAsync(string? category, string lang);
        Task<POIDto?> GetByIdAsync(int id, string lang);
        Task<IEnumerable<POIListDto>> GetNearbyAsync(double lat, double lng, int radiusMeters, string lang);
        Task<POIDto> CreateAsync(POICreateDto dto);
        Task<POIDto?> UpdateAsync(int id, POIUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
