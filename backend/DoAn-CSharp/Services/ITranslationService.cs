using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface ITranslationService
    {
        Task<TranslationDto?> GetTranslationAsync(int poiId, string lang);
        Task<TranslationDto> UpsertTranslationAsync(TranslationCreateDto dto);
    }
}
