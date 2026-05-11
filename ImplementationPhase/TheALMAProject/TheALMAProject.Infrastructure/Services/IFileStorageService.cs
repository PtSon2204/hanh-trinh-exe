using Microsoft.AspNetCore.Http;

namespace TheALMAProject.Infrastructure.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string folderName);

        Task DeleteFileAsync(string? relativeUrl);
    }
}
