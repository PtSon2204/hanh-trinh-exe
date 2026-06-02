using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace TheALMAProject.Infrastructure.Services
{
    public class CloudinaryFileStorageService : IFileStorageService
    {
        private readonly Cloudinary _cloudinary;

        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml"
        };

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".svg"
        };

        private const long MaxFileSizeBytes = 5 * 1024 * 1024;

        public CloudinaryFileStorageService(IConfiguration configuration)
        {
            var cloudName = configuration["CloudinarySettings:CloudName"];
            var apiKey = configuration["CloudinarySettings:ApiKey"];
            var apiSecret = configuration["CloudinarySettings:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                throw new ArgumentException("Cloudinary settings are missing in the configuration.");
            }

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            ValidateImageFile(file);

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folderName.Trim('/')
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                throw new Exception($"Failed to upload to Cloudinary: {uploadResult.Error.Message}");
            }

            return uploadResult.SecureUrl.ToString();
        }

        public async Task DeleteFileAsync(string? relativeUrl)
        {
            if (string.IsNullOrWhiteSpace(relativeUrl))
            {
                return;
            }

            try
            {
                var uri = new Uri(relativeUrl);
                var segments = uri.Segments;
                
                var uploadIndex = relativeUrl.IndexOf("upload/", StringComparison.OrdinalIgnoreCase);
                if (uploadIndex > -1)
                {
                    var pathAfterUpload = relativeUrl.Substring(uploadIndex + "upload/".Length);
                    var parts = pathAfterUpload.Split('/');
                    if (parts.Length > 0 && parts[0].StartsWith("v") && parts[0].Length > 1 && char.IsDigit(parts[0][1]))
                    {
                        parts = parts.Skip(1).ToArray();
                    }
                    
                    var publicIdWithExtension = string.Join("/", parts);
                    var lastDotIndex = publicIdWithExtension.LastIndexOf('.');
                    var publicId = lastDotIndex > -1 ? publicIdWithExtension.Substring(0, lastDotIndex) : publicIdWithExtension;
                    
                    var deletionParams = new DeletionParams(publicId);
                    await _cloudinary.DestroyAsync(deletionParams);
                }
            }
            catch
            {
                // Ignore invalid URLs or deletion errors
            }
        }

        private static void ValidateImageFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new Exception("Image file is required");
            }

            if (file.Length > MaxFileSizeBytes)
            {
                throw new Exception("Image file must be 5MB or smaller");
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension) || !AllowedContentTypes.Contains(file.ContentType))
            {
                throw new Exception("Unsupported image file type");
            }
        }
    }
}
