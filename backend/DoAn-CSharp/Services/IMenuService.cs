using System.Collections.Generic;
using System.Threading.Tasks;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Services
{
    public interface IMenuService
    {
        Task<IEnumerable<MenuItemDto>> GetMenuByPOIAsync(int poiId, string lang);
        Task<MenuItemDto> CreateMenuItemAsync(int poiId, MenuItemCreateDto dto);
        Task<MenuItemDto?> UpdateMenuItemAsync(int id, MenuItemUpdateDto dto);
        Task<bool> DeleteMenuItemAsync(int id);
    }
}
