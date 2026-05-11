using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace TheALMAProject.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
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

        private readonly IWebHostEnvironment _environment;

        public LocalFileStorageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName)
        {
            ValidateImageFile(file);

            var webRootPath = string.IsNullOrWhiteSpace(_environment.WebRootPath)
                ? Path.Combine(_environment.ContentRootPath, "wwwroot")
                : _environment.WebRootPath;

            var normalizedFolder = folderName.Trim('/').Replace('/', Path.DirectorySeparatorChar);
            var storagePath = Path.Combine(webRootPath, normalizedFolder);
            Directory.CreateDirectory(storagePath);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(storagePath, fileName);

            await using (var stream = new FileStream(filePath, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            return $"/{folderName.Trim('/')}/{fileName}".Replace("//", "/");
        }

        public Task DeleteFileAsync(string? relativeUrl)
        {
            if (string.IsNullOrWhiteSpace(relativeUrl))
            {
                return Task.CompletedTask;
            }

            var webRootPath = string.IsNullOrWhiteSpace(_environment.WebRootPath)
                ? Path.Combine(_environment.ContentRootPath, "wwwroot")
                : _environment.WebRootPath;

            var safeRelativePath = relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.GetFullPath(Path.Combine(webRootPath, safeRelativePath));
            var rootPath = Path.GetFullPath(webRootPath);

            if (fullPath.StartsWith(rootPath, StringComparison.OrdinalIgnoreCase) && File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            return Task.CompletedTask;
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
