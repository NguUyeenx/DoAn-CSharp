using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class FavoriteService : IFavoriteService
    {
        private readonly AppDbContext _context;

        public FavoriteService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<FavoriteDto>> GetUserFavoritesAsync(int userId)
        {
            return await _context.Favorites
                .Where(f => f.UserId == userId)
                .Include(f => f.POI)
                .Select(f => new FavoriteDto
                {
                    Id = f.Id,
                    POIId = f.POIId,
                    POIName = f.POI != null ? f.POI.Name : string.Empty,
                    POIImageUrl = f.POI != null ? f.POI.ImageUrl : null,
                    POICategory = f.POI != null ? f.POI.Category : string.Empty,
                    CreatedAt = f.CreatedAt
                })
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<FavoriteDto> AddFavoriteAsync(int userId, int poiId)
        {
            var exists = await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.POIId == poiId);

            if (exists)
                throw new InvalidOperationException("POI is already in favorites.");

            var poi = await _context.POIs.FindAsync(poiId)
                ?? throw new KeyNotFoundException("POI not found.");

            var favorite = new Favorite
            {
                UserId = userId,
                POIId = poiId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Favorites.AddAsync(favorite);
            await _context.SaveChangesAsync();

            return new FavoriteDto
            {
                Id = favorite.Id,
                POIId = poiId,
                POIName = poi.Name,
                POIImageUrl = poi.ImageUrl,
                POICategory = poi.Category,
                CreatedAt = favorite.CreatedAt
            };
        }

        public async Task RemoveFavoriteAsync(int userId, int poiId)
        {
            var favorite = await _context.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.POIId == poiId)
                ?? throw new KeyNotFoundException("Favorite not found.");

            _context.Favorites.Remove(favorite);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsFavoriteAsync(int userId, int poiId)
        {
            return await _context.Favorites
                .AnyAsync(f => f.UserId == userId && f.POIId == poiId);
        }
    }
}
