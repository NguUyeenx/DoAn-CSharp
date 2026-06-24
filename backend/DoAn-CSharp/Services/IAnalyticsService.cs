using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IAnalyticsService
    {
        Task LogVisitAsync(VisitCreateDto dto);
        Task UpdateVisitLanguageAsync(UpdateLanguageDto dto);
        Task<AnalyticsSummaryDto> GetSummaryAsync();
        void RegisterHeartbeat(string sessionId);
    }
}
