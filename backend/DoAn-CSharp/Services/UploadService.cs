using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public class UploadService : IUploadService
    {
        private readonly ICloudStorageService _cloudStorageService;

        private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/png", "image/webp", "image/gif" };
        private static readonly string[] AllowedAudioTypes = { "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac" };
        private const long MaxImageSizeBytes = 5 * 1024 * 1024;  // 5 MB
        private const long MaxAudioSizeBytes = 50 * 1024 * 1024; // 50 MB

        public UploadService(ICloudStorageService cloudStorageService)
        {
            _cloudStorageService = cloudStorageService;
        }

        public async Task<UploadResultDto> UploadImageAsync(IFormFile file, string subfolder)
        {
            ValidateFile(file, AllowedImageTypes, MaxImageSizeBytes, "Image");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{ext}";

            using var stream = file.OpenReadStream();
            string fileUrl = await _cloudStorageService.UploadImageAsync(stream, fileName, subfolder);

            return new UploadResultDto
            {
                Url = fileUrl,
                FileName = fileName,
                SizeBytes = file.Length,
                ContentType = file.ContentType
            };
        }

        public async Task<UploadResultDto> UploadAudioAsync(IFormFile file)
        {
            ValidateFile(file, AllowedAudioTypes, MaxAudioSizeBytes, "Audio");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{ext}";

            using var stream = file.OpenReadStream();
            string fileUrl = await _cloudStorageService.UploadAudioAsync(stream, fileName);

            return new UploadResultDto
            {
                Url = fileUrl,
                FileName = fileName,
                SizeBytes = file.Length,
                ContentType = file.ContentType
            };
        }

        public async Task DeleteFileAsync(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath)) return;

            string resourceType = filePath.Contains("/audio/") || filePath.Contains("/video/") || filePath.Contains("_audio") ? "audio" : "image";
            await _cloudStorageService.DeleteFileAsync(filePath, resourceType);
        }

        private static void ValidateFile(IFormFile file, string[] allowedTypes, long maxSize, string fileType)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException($"{fileType} file is empty.");

            if (!allowedTypes.Contains(file.ContentType.ToLowerInvariant()))
                throw new ArgumentException($"Invalid {fileType} file type. Allowed: {string.Join(", ", allowedTypes)}");

            if (file.Length > maxSize)
                throw new ArgumentException($"{fileType} file exceeds maximum size of {maxSize / 1024 / 1024} MB.");
        }
    }
}
