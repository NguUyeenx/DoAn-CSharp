using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IQRCodeService
    {
        Task<QRCodeDto?> GetByCodeAsync(string code);
        Task<QRCodeDto> GenerateQRCodeAsync(int poiId);
    }
}
