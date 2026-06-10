using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoAn_CSharp.Data;
using DoAn_CSharp.Models.DTOs;
using DoAn_CSharp.Models.Entities;

namespace DoAn_CSharp.Services
{
    public class MenuService : IMenuService
    {
        private readonly AppDbContext _context;

        public MenuService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MenuItemDto>> GetMenuByPOIAsync(int poiId, string lang)
        {
            var menuItems = await _context.MenuItems
                .Include(m => m.Translations)
                .Where(m => m.POIId == poiId)
                .OrderBy(m => m.DisplayOrder)
                .ToListAsync();

            return menuItems.Select(m => MapToDto(m, lang)).ToList();
        }

        public async Task<MenuItemDto> CreateMenuItemAsync(MenuItemCreateDto dto)
        {
            var menuItem = new MenuItem
            {
                POIId = dto.POIId,
                Name = dto.Name,
                Price = dto.Price,
                Currency = dto.Currency,
                ImageUrl = dto.ImageUrl,
                DisplayOrder = dto.DisplayOrder,
                IsAvailable = dto.IsAvailable
            };

            await _context.MenuItems.AddAsync(menuItem);
            await _context.SaveChangesAsync();

            return MapToDto(menuItem, "en");
        }

        public async Task<MenuItemDto?> UpdateMenuItemAsync(int id, MenuItemUpdateDto dto)
        {
            var menuItem = await _context.MenuItems
                .Include(m => m.Translations)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
            {
                return null;
            }

            if (dto.Name != null) menuItem.Name = dto.Name;
            if (dto.Price.HasValue) menuItem.Price = dto.Price.Value;
            if (dto.Currency != null) menuItem.Currency = dto.Currency;
            if (dto.ImageUrl != null) menuItem.ImageUrl = dto.ImageUrl;
            if (dto.DisplayOrder.HasValue) menuItem.DisplayOrder = dto.DisplayOrder.Value;
            if (dto.IsAvailable.HasValue) menuItem.IsAvailable = dto.IsAvailable.Value;

            await _context.SaveChangesAsync();

            return MapToDto(menuItem, "en");
        }

        public async Task<bool> DeleteMenuItemAsync(int id)
        {
            var menuItem = await _context.MenuItems.FindAsync(id);
            if (menuItem == null)
            {
                return false;
            }

            _context.MenuItems.Remove(menuItem);
            await _context.SaveChangesAsync();
            return true;
        }

        private static MenuItemDto MapToDto(MenuItem entity, string lang)
        {
            var targetLang = lang.ToLowerInvariant();
            var translation = entity.Translations
                .FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == targetLang);

            // Fallback to English (en) if requested language not found
            if (translation == null && targetLang != "en")
            {
                translation = entity.Translations
                    .FirstOrDefault(t => t.LanguageCode.ToLowerInvariant() == "en");
            }

            return new MenuItemDto
            {
                Id = entity.Id,
                POIId = entity.POIId,
                Name = entity.Name,
                Price = entity.Price,
                Currency = entity.Currency,
                ImageUrl = entity.ImageUrl,
                DisplayOrder = entity.DisplayOrder,
                IsAvailable = entity.IsAvailable,
                LocalizedName = translation?.Name ?? entity.Name,
                LocalizedDescription = translation?.Description ?? string.Empty
            };
        }
    }
}
