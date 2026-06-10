using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IAudioProgressService
    {
        Task<AudioProgressDto?> GetProgressAsync(int userId, int audioFileId);
        Task<AudioProgressDto> SaveProgressAsync(int userId, SaveAudioProgressDto dto);
    }
}
