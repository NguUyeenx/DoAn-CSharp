using System.IO;
using System.Threading.Tasks;

namespace DoAn_CSharp.Services
{
    public interface ICloudStorageService
    {
        Task<string> UploadImageAsync(Stream fileStream, string fileName, string subfolder);
        Task<string> UploadAudioAsync(Stream fileStream, string fileName);
        Task DeleteFileAsync(string fileUrl, string resourceType);
    }
}
