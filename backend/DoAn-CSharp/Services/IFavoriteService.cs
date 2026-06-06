using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IFavoriteService
    {
        Task<List<FavoriteDto>> GetUserFavoritesAsync(int userId);
        Task<FavoriteDto> AddFavoriteAsync(int userId, int poiId);
        Task RemoveFavoriteAsync(int userId, int poiId);
        Task<bool> IsFavoriteAsync(int userId, int poiId);
    }
}
