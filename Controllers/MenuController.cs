using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DoAn_CSharp.Services;
using DoAn_CSharp.Models.DTOs;

namespace DoAn_CSharp.Controllers
{
    [ApiController]
    [Route("api/pois/{poiId:int}/menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenu(int poiId, [FromQuery] string lang = "en")
        {
            var menu = await _menuService.GetMenuByPOIAsync(poiId, lang);
            return Ok(menu);
        }

        [HttpPost("/api/admin/pois/{poiId:int}/menu")]
        public async Task<IActionResult> Create(int poiId, [FromBody] MenuItemCreateDto dto)
        {
            // Note: Authority check placeholder for Phase 5 JWT
            var result = await _menuService.CreateMenuItemAsync(poiId, dto);
            return CreatedAtAction(nameof(GetMenu), new { poiId = result.POIId }, result);
        }

        [HttpPut("/api/admin/menu/{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] MenuItemUpdateDto dto)
        {
            // Note: Authority check placeholder for Phase 5 JWT
            var result = await _menuService.UpdateMenuItemAsync(id, dto);
            if (result == null)
            {
                return NotFound(new { error = "NotFound", message = $"Menu Item with ID {id} was not found." });
            }
            return Ok(result);
        }

        [HttpDelete("/api/admin/menu/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            // Note: Authority check placeholder for Phase 5 JWT
            var success = await _menuService.DeleteMenuItemAsync(id);
            if (!success)
            {
                return NotFound(new { error = "NotFound", message = $"Menu Item with ID {id} was not found." });
            }
            return NoContent();
        }
    }
}
