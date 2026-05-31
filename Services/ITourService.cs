using System.Collections.Generic;
using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface ITourService
    {
        Task<IEnumerable<TourListDto>> GetActiveToursAsync(string lang);
        Task<TourDto?> GetTourByIdAsync(int id, string lang);
        Task<TourDto> CreateTourAsync(TourCreateDto dto);
        Task<TourDto?> UpdateTourAsync(int id, TourCreateDto dto);
        Task<bool> DeleteTourAsync(int id);
    }
}
