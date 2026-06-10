using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public class UploadService : IUploadService
    {
        private readonly IWebHostEnvironment _env;

        private static readonly string[] AllowedImageTypes = { "image/jpeg", "image/png", "image/webp", "image/gif" };
        private static readonly string[] AllowedAudioTypes = { "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac" };
        private const long MaxImageSizeBytes = 5 * 1024 * 1024;  // 5 MB
        private const long MaxAudioSizeBytes = 50 * 1024 * 1024; // 50 MB

        public UploadService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<UploadResultDto> UploadImageAsync(IFormFile file, string subfolder)
        {
            ValidateFile(file, AllowedImageTypes, MaxImageSizeBytes, "Image");

            var folder = Path.Combine(_env.WebRootPath, "images", subfolder);
            Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            await using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

            return new UploadResultDto
            {
                Url = $"/images/{subfolder}/{fileName}",
                FileName = fileName,
                SizeBytes = file.Length,
                ContentType = file.ContentType
            };
        }

        public async Task<UploadResultDto> UploadAudioAsync(IFormFile file)
        {
            ValidateFile(file, AllowedAudioTypes, MaxAudioSizeBytes, "Audio");

            var folder = Path.Combine(_env.WebRootPath, "audio");
            Directory.CreateDirectory(folder);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(folder, fileName);

            await using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

            return new UploadResultDto
            {
                Url = $"/audio/{fileName}",
                FileName = fileName,
                SizeBytes = file.Length,
                ContentType = file.ContentType
            };
        }

        public Task DeleteFileAsync(string filePath)
        {
            var fullPath = Path.Combine(_env.WebRootPath, filePath.TrimStart('/'));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
            return Task.CompletedTask;
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
