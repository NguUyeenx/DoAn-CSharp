using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class AudioProgressService : IAudioProgressService
    {
        private readonly AppDbContext _context;

        public AudioProgressService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AudioProgressDto?> GetProgressAsync(int userId, int audioFileId)
        {
            var progress = await _context.AudioProgresses
                .FirstOrDefaultAsync(ap => ap.UserId == userId && ap.AudioFileId == audioFileId);

            if (progress == null) return null;

            return new AudioProgressDto
            {
                Id = progress.Id,
                AudioFileId = progress.AudioFileId,
                CurrentSecond = progress.CurrentSecond,
                UpdatedAt = progress.UpdatedAt
            };
        }

        public async Task<AudioProgressDto> SaveProgressAsync(int userId, SaveAudioProgressDto dto)
        {
            var progress = await _context.AudioProgresses
                .FirstOrDefaultAsync(ap => ap.UserId == userId && ap.AudioFileId == dto.AudioFileId);

            if (progress == null)
            {
                progress = new AudioProgress
                {
                    UserId = userId,
                    AudioFileId = dto.AudioFileId,
                    CurrentSecond = dto.CurrentSecond,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.AudioProgresses.AddAsync(progress);
            }
            else
            {
                progress.CurrentSecond = dto.CurrentSecond;
                progress.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return new AudioProgressDto
            {
                Id = progress.Id,
                AudioFileId = progress.AudioFileId,
                CurrentSecond = progress.CurrentSecond,
                UpdatedAt = progress.UpdatedAt
            };
        }
    }
}
