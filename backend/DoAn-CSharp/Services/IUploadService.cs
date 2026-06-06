using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IUploadService
    {
        Task<UploadResultDto> UploadImageAsync(IFormFile file, string subfolder);
        Task<UploadResultDto> UploadAudioAsync(IFormFile file);
        Task DeleteFileAsync(string filePath);
    }
}
