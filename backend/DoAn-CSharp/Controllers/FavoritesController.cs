using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Services;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All endpoints require User or Admin JWT
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favoriteService;

        public FavoritesController(IFavoriteService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        /// <summary>Lấy danh sách địa điểm yêu thích của user</summary>
        [HttpGet]
        public async Task<ActionResult<List<FavoriteDto>>> GetFavorites()
        {
            var userId = GetCurrentUserId();
            var result = await _favoriteService.GetUserFavoritesAsync(userId);
            return Ok(result);
        }

        /// <summary>Thêm địa điểm vào danh sách yêu thích</summary>
        [HttpPost("{poiId:int}")]
        public async Task<ActionResult<FavoriteDto>> AddFavorite(int poiId)
        {
            var userId = GetCurrentUserId();
            var result = await _favoriteService.AddFavoriteAsync(userId, poiId);
            return CreatedAtAction(nameof(GetFavorites), result);
        }

        /// <summary>Xóa địa điểm khỏi danh sách yêu thích</summary>
        [HttpDelete("{poiId:int}")]
        public async Task<IActionResult> RemoveFavorite(int poiId)
        {
            var userId = GetCurrentUserId();
            await _favoriteService.RemoveFavoriteAsync(userId, poiId);
            return NoContent();
        }

        private int GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User ID not found in token.");
            return int.Parse(idClaim);
        }
    }
}
