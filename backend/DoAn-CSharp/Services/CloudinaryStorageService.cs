using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace DoAn_CSharp.Services
{
    public class CloudinaryStorageService : ICloudStorageService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryStorageService(IConfiguration configuration)
        {
            var cloudName = configuration["CloudinarySettings:CloudName"];
            var apiKey = configuration["CloudinarySettings:ApiKey"];
            var apiSecret = configuration["CloudinarySettings:ApiSecret"];

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string subfolder)
        {
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(fileName, fileStream),
                Folder = $"doan_csharp/images/{subfolder}",
                PublicId = Path.GetFileNameWithoutExtension(fileName)
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
            {
                throw new Exception($"Cloudinary Image Upload failed: {uploadResult.Error.Message}");
            }
            return uploadResult.SecureUrl.ToString();
        }

        public async Task<string> UploadAudioAsync(Stream fileStream, string fileName)
        {
            var uploadParams = new VideoUploadParams() // Cloudinary manages Audio using VideoUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = "doan_csharp/audio",
                PublicId = Path.GetFileNameWithoutExtension(fileName)
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            if (uploadResult.Error != null)
            {
                throw new Exception($"Cloudinary Audio Upload failed: {uploadResult.Error.Message}");
            }
            return uploadResult.SecureUrl.ToString();
        }

        public async Task DeleteFileAsync(string fileUrl, string resourceType)
        {
            if (string.IsNullOrWhiteSpace(fileUrl)) return;

            try
            {
                var uri = new Uri(fileUrl);
                var segments = uri.AbsolutePath.Split('/');
                
                int rootIndex = Array.IndexOf(segments, "doan_csharp");
                if (rootIndex != -1)
                {
                    var publicIdWithExt = string.Join("/", segments[rootIndex..]);
                    var publicId = Path.ChangeExtension(publicIdWithExt, null); // Strip extension e.g. .mp3

                    var deletionParams = new DeletionParams(publicId)
                    {
                        ResourceType = resourceType == "audio" ? ResourceType.Video : ResourceType.Image
                    };

                    await _cloudinary.DestroyAsync(deletionParams);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CloudinaryStorageService] Error deleting file: {ex.Message}");
            }
        }
    }
}
